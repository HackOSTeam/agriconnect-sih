import urllib.request
import urllib.parse
import json

BASE_URL = "http://127.0.0.1:8000"

def make_request(path, method="GET", data=None, is_json=True, form_data=None):
    url = f"{BASE_URL}{path}"
    headers = {}
    body = None

    if form_data:
        body = urllib.parse.urlencode(form_data).encode("utf-8")
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    elif is_json and data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            return response.status, json.loads(res_body)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except:
            return e.code, {"detail": err_body}

def test_api():
    print("--- 1. Testing Live Stats Endpoint ---")
    status, data = make_request("/api/stats/overview")
    assert status == 200, f"Stats failed: {data}"
    print("Live Stats:", data)
    assert "active_farmers_count" in data
    assert "products_listed_count" in data

    print("\n--- 2. Testing Check User & Role Separation ---")
    # Unregistered user
    status, data = make_request("/api/check-user", method="POST", data={"identifier": "9999999999", "role": "farmer"})
    assert status == 200
    assert data["exists"] is False
    print("Unregistered check pass:", data)

    # Registered farmer check
    status, data = make_request("/api/check-user", method="POST", data={"identifier": "9876543210", "role": "farmer"})
    assert status == 200
    assert data["exists"] is True
    assert data["matches_role"] is True
    print("Farmer valid check pass:", data)

    # Registered farmer attempting buyer check (role conflict)
    status, data = make_request("/api/check-user", method="POST", data={"identifier": "9876543210", "role": "buyer"})
    assert status == 200
    assert data["exists"] is True
    assert data["matches_role"] is False
    print("Role separation check pass:", data)

    print("\n--- 3. Testing OTP Verification Flow ---")
    status, otp_send = make_request("/api/send-otp", method="POST", data={"mobile": "9876543210", "role": "farmer"})
    assert status == 200
    print("OTP send pass:", otp_send)

    status, otp_verify = make_request("/api/verify-otp", method="POST", data={"mobile": "9876543210", "otp": "4920"})
    assert status == 200
    print("OTP verify pass:", otp_verify)

    print("\n--- 4. Testing Farmer OTP Login ---")
    status, login_res = make_request("/api/login", method="POST", data={
        "identifier": "9876543210",
        "role": "farmer",
        "auth_type": "otp",
        "otp": "4920"
    })
    assert status == 200, f"Login failed: {login_res}"
    print("Farmer Login pass:", login_res["name"], login_res["role"])

    print("\n--- 5. Testing Product Creation & Database Persistence ---")
    # Test form data product creation
    prod_data = {
        "farmer_name": "Ramesh Patel",
        "crop_name": "Premium Sharbati Wheat",
        "category": "Grain",
        "variety": "Sharbati",
        "quantity_kg": 2500.0,
        "unit": "kg",
        "price_per_kg": 42.0,
        "quality_grade": "Grade A (Export Quality)",
        "pickup_location": "Haveli, Pune",
        "organic": "Yes"
    }
    status, prod_res = make_request("/api/products/", method="POST", form_data=prod_data)
    assert status == 200, f"Product create failed: {prod_res}"
    created_prod = prod_res["product"]
    print("Product Created & Persisted to DB:", created_prod["id"], created_prod["crop_name"])

    # Fetch products for this farmer
    status, prods_list = make_request(f"/api/products/?farmer_name={urllib.parse.quote('Ramesh Patel')}")
    assert status == 200
    matching = [p for p in prods_list if p["crop_name"] == "Premium Sharbati Wheat"]
    assert len(matching) > 0, "Created product not found in farmer listings!"
    print(f"Verified product persisted in Farmer listings! (Total listings for Ramesh: {len(prods_list)})")

    # Fetch all marketplace products for Buyer
    status, buyer_list = make_request("/api/products/")
    assert status == 200
    matching_buyer = [p for p in buyer_list if p["crop_name"] == "Premium Sharbati Wheat"]
    assert len(matching_buyer) > 0, "Created product not found in Buyer marketplace!"
    print(f"Verified product is instantly visible in Buyer marketplace! (Total active lots: {len(buyer_list)})")

    print("\n--- 6. Testing Wallet and Transaction History ---")
    status, wallet = make_request(f"/api/wallet/{urllib.parse.quote('Ramesh Patel')}")
    assert status == 200
    print("Wallet Balance retrieved successfully, balance value:", wallet["balance"])
    print("Transactions count:", len(wallet["transactions"]))

    print("\n--- 7. Testing Buyer Login with Password ---")
    status, buyer_login = make_request("/api/login", method="POST", data={
        "identifier": "9822001122",
        "role": "buyer",
        "auth_type": "password",
        "password": "password123"
    })
    assert status == 200, f"Buyer login failed: {buyer_login}"
    print("Buyer login pass:", buyer_login["name"])

    print("\n==========================================")
    print("ALL API & DATABASE PERSISTENCE TESTS PASSED! [SUCCESS]")
    print("==========================================")

if __name__ == "__main__":
    test_api()
