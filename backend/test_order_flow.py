import urllib.request
import urllib.parse
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8001"

PASS = "[PASS]"
FAIL = "[FAIL]"

def api_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_text = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_text)
        except Exception:
            return e.code, {"detail": err_text}

def assert_eq(a, b, msg=""):
    if a != b:
        print(f"  {FAIL} {msg}: expected {b!r}, got {a!r}")
        sys.exit(1)
    print(f"  {PASS} {msg}")

def run_tests():
    print("\n" + "="*60)
    print("   AGRI-CONNECT FULL ORDER FLOW INTEGRATION TESTS")
    print("="*60)
    errors = []

    # ── 0. Register test accounts ─────────────────────────────────
    print("\n[0] Registering Test Accounts")
    ts = int(time.time())
    test_farmer_username = f"TF{ts}"
    test_buyer_username  = f"TB{ts}"
    # Use last 10 digits of timestamp-based numbers to get valid mobiles
    farmer_mobile = str(7000000000 + (ts % 1000000))
    buyer_mobile  = str(8000000000 + (ts % 1000000))

    status, freg = api_request("/api/register/farmer", "POST", {
        "name": test_farmer_username,
        "mobile": farmer_mobile,
        "password": "test1234",
        "village_district": "Nashik",
        "state": "Maharashtra",
        "id_number": f"T{ts}",
        "id_type": "Aadhaar",
        "primary_crops": ["Tomato"],
        "language": "English",
        "account_type": "individual"
    })
    assert status == 200, f"Farmer registration failed: {freg}"
    farmer_token = freg.get("token") or freg.get("access_token")
    print(f"  {PASS} Farmer registered: {test_farmer_username} (mobile {farmer_mobile})")

    status, breg = api_request("/api/register/buyer", "POST", {
        "name": test_buyer_username,
        "mobile": buyer_mobile,
        "password": "test1234",
        "buyer_type": "bulk",
        "business_type": "Wholesaler"
    })
    assert status == 200, f"Buyer registration failed: {breg}"
    buyer_token = breg.get("token") or breg.get("access_token")
    print(f"  {PASS} Buyer registered: {test_buyer_username} (mobile {buyer_mobile})")

    # ── 1. Farmer adds a product ───────────────────────────────────
    print("\n[1] Farmer Adds Produce Listing")
    status, prod_res = api_request("/api/products/", "POST", {
        "farmer_name": test_farmer_username,
        "farmer_id": freg.get("farmer_id") or freg.get("user_id"),
        "crop_name": "Test Tomatoes",
        "category": "Vegetables",
        "quantity_kg": 500.0,
        "moq": "25",
        "price_per_kg": 18.0,
        "negotiable": True,
        "harvest_date": "2026-09-01",
        "available_from": "2026-09-03",
        "shelf_life": "7 days",
        "organic": False,
        "pickup_location": "Nashik",
        "quality_grade": "Grade A",
        "status": "active",
        "cancellation_window_hours": 24
    }, token=farmer_token)
    assert status == 200, f"Product creation failed ({status}): {prod_res}"
    prod_id = prod_res["id"]
    farmer_name = prod_res["farmer_name"]
    print(f"  {PASS} Product created: ID={prod_id}, Stock=500kg, MOQ=25kg")

    # ── 2. Product persists on GET ─────────────────────────────────
    print("\n[2] Product Persists in Marketplace GET")
    status, prods = api_request(f"/api/products/?farmer_name={urllib.parse.quote(test_farmer_username)}")
    assert status == 200
    farm_prod = next((p for p in prods if p["id"] == prod_id), None)
    assert farm_prod is not None, f"Product ID {prod_id} not found in farmer listing"
    assert_eq(farm_prod["quantity_kg"], 500.0, "Initial stock is 500kg")
    assert_eq(farm_prod["reserved_quantity_kg"], 0.0, "Initial reserved_quantity_kg is 0")
    assert_eq(farm_prod["available_quantity_kg"], 500.0, "Initial available_quantity_kg is 500kg")

    # ── 3. Buyer adds to server-side cart (soft-reservation) ──────
    print("\n[3] Buyer Adds to Cart (Soft-Reservation Test)")
    order_qty = 50.0
    status, cart_res = api_request("/api/cart/add", "POST", {
        "buyer_name": test_buyer_username,
        "product_id": prod_id,
        "quantity_kg": order_qty,
        "cancellation_window_hours": 24
    }, token=buyer_token)
    assert status == 200, f"Cart add failed ({status}): {cart_res}"
    print(f"  {PASS} Cart add succeeded, items: {len(cart_res.get('items', []))}")

    # Verify soft-reserve updated quantity_kg NOT reduced
    status, prods2 = api_request(f"/api/products/?farmer_name={urllib.parse.quote(test_farmer_username)}")
    p2 = next(p for p in prods2 if p["id"] == prod_id)
    assert_eq(p2["quantity_kg"], 500.0, "quantity_kg NOT reduced on cart-add (only reserved)")
    assert_eq(p2["reserved_quantity_kg"], order_qty, f"reserved_quantity_kg = {order_qty}")
    assert_eq(p2["available_quantity_kg"], 500.0 - order_qty, f"available_quantity_kg = {500.0 - order_qty}")

    # ── 4. Checkout: sub-order created as 'Pending Farmer Confirmation' ──
    print("\n[4] Checkout Creates Sub-Orders with 'Pending Farmer Confirmation'")
    status, checkout_res = api_request("/api/checkout", "POST", {
        "buyer_name": test_buyer_username,
        "delivery_address": "APMC Cold Storage Bay 4, Pune",
        "order_note": "Handle with care.",
        "payment_method": "Bank Transfer (NEFT/RTGS)",
        "items": [{
            "product_id": prod_id,
            "farmer_name": farmer_name,
            "crop_name": "Test Tomatoes",
            "quantity_kg": order_qty,
            "price_per_kg": 18.0,
            "cancellation_window_hours": 24
        }]
    }, token=buyer_token)
    assert status == 200, f"Checkout failed ({status}): {checkout_res}"
    order = checkout_res["orders"][0]
    order_id = order["id"]
    order_group_id = checkout_res["order_group_id"]
    order_number = order["order_number"]
    s = (order.get("status") or "").lower()
    assert s in ("pending farmer confirmation", "placed", "pending"), \
        f"Expected pending status, got '{order['status']}'"
    print(f"  {PASS} Order created: #{order_number}, Group: {order_group_id}, Status: {order['status']!r}")

    # quantity_kg still 500 (not yet deducted – only reservation kept)
    status, prods3 = api_request(f"/api/products/?farmer_name={urllib.parse.quote(test_farmer_username)}")
    p3 = next(p for p in prods3 if p["id"] == prod_id)
    assert_eq(p3["quantity_kg"], 500.0, "quantity_kg NOT deducted after checkout (soft-reserve model)")
    assert_eq(p3["reserved_quantity_kg"], order_qty, f"reserved still {order_qty}kg after checkout")

    # ── 5. Reject flow: reservation released ─────────────────────
    print("\n[5] Farmer Rejects Order → Reserved Stock Released")
    status, reject_res = api_request("/api/orders/update_status", "POST",
        {"order_id": order_id, "status": "rejected"}, token=farmer_token)
    assert status == 200, f"Reject failed ({status}): {reject_res}"
    print(f"  {PASS} {reject_res.get('message', 'rejected')}")

    status, prods4 = api_request(f"/api/products/?farmer_name={urllib.parse.quote(test_farmer_username)}")
    p4 = next(p for p in prods4 if p["id"] == prod_id)
    assert_eq(p4["quantity_kg"], 500.0, "quantity_kg still 500 after rejection")
    assert_eq(p4["reserved_quantity_kg"], 0.0, "reserved_quantity_kg released to 0")
    assert_eq(p4["available_quantity_kg"], 500.0, "available fully restored to 500")

    # ── 6. Accept flow: permanent stock deduction ─────────────────
    print("\n[6] Farmer Accepts → Permanent Stock Deduction & Wallet Credit")
    # Place fresh order
    status, co2 = api_request("/api/checkout", "POST", {
        "buyer_name": test_buyer_username,
        "delivery_address": "APMC Cold Storage Bay 4, Pune",
        "order_note": "Test Accept Flow",
        "payment_method": "Bank Transfer (NEFT/RTGS)",
        "items": [{"product_id": prod_id, "farmer_name": farmer_name,
                   "crop_name": "Test Tomatoes", "quantity_kg": order_qty,
                   "price_per_kg": 18.0, "cancellation_window_hours": 24}]
    }, token=buyer_token)
    assert status == 200, f"Second checkout failed: {co2}"
    order2_id = co2["orders"][0]["id"]
    order2_num = co2["orders"][0]["order_number"]
    print(f"  {PASS} Fresh order #{order2_num} placed")

    status, accept_res = api_request("/api/orders/update_status", "POST",
        {"order_id": order2_id, "status": "confirmed"}, token=farmer_token)
    assert status == 200, f"Accept failed: {accept_res}"
    print(f"  {PASS} {accept_res.get('message', 'accepted')}")

    status, prods5 = api_request(f"/api/products/?farmer_name={urllib.parse.quote(test_farmer_username)}")
    p5 = next(p for p in prods5 if p["id"] == prod_id)
    expected_stock = 500.0 - order_qty
    assert_eq(p5["quantity_kg"], expected_stock, f"Permanent stock deduction: {expected_stock}kg")
    assert_eq(p5["reserved_quantity_kg"], 0.0, "Reserved released after accept")

    status, buyer_orders = api_request(f"/api/orders/?buyer_name={urllib.parse.quote(test_buyer_username)}")
    bo = next((o for o in buyer_orders if o["id"] == order2_id), None)
    assert bo, "Buyer cannot see confirmed order"
    s2 = (bo.get("status") or "").lower()
    assert s2 in ("confirmed", "accepted"), f"Buyer sees status {bo['status']!r}, expected confirmed"
    print(f"  {PASS} Buyer sees Confirmed status: {bo['status']!r}")

    # ── 7. Stage progression: Picked Up → In Transit → Delivered ──
    print("\n[7] Stage Lifecycle: Picked Up → In Transit → Delivered")
    for new_status, label in [("Picked Up", "Picked Up"), ("In Transit", "In Transit"), ("Delivered", "Delivered")]:
        status, stage_res = api_request("/api/orders/update_status", "POST",
            {"order_id": order2_id, "status": new_status}, token=farmer_token)
        assert status == 200, f"Stage update '{new_status}' failed: {stage_res}"
        print(f"  {PASS} Order marked as '{new_status}'")

    status, farmer_orders_f = api_request(f"/api/orders/?farmer_name={urllib.parse.quote(farmer_name)}")
    final_order = next((o for o in farmer_orders_f if o["id"] == order2_id), None)
    sf = (final_order.get("status") or "").lower()
    assert sf == "delivered", f"Expected 'Delivered', got {final_order['status']!r}"
    print(f"  {PASS} Final status 'Delivered' confirmed")

    # ── 8. Wallet credited ────────────────────────────────────────
    print("\n[8] Farmer Wallet Credited")
    status, wallet = api_request(f"/api/wallet/{urllib.parse.quote(farmer_name)}")
    assert status == 200, f"Wallet fetch failed: {wallet}"
    has_trx = any(t.get("reference_id") == order2_num for t in wallet.get("transactions", []))
    assert has_trx, f"No wallet transaction for order #{order2_num}"
    print(f"  {PASS} Farmer wallet has escrow credit for #{order2_num}")

    # ── Summary ───────────────────────────────────────────────────
    print("\n" + "="*60)
    print("   ALL 8 TEST GROUPS PASSED ✅")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_tests()