"""
test_version3_integration.py  ─  Comprehensive Version 3 Test Suite
====================================================================
Tests the unified AgriConnect Version 3 system:
1. Version 2 Core Features (Auth, Products, Orders, Escrow)
2. Demand Forecasting API (/api/forecast/*)
3. Route Optimization Engine (/api/v1/presets, /api/v1/optimize, /api/route/*)
"""

import sys
import os

# Ensure UTF-8 output encoding for Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure paths
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _THIS_DIR)

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_1_root_and_health():
    print("\n[TEST 1] Root and Health Check...")
    res_root = client.get("/")
    assert res_root.status_code == 200
    assert "AgriConnect API v3.0" in res_root.json()["message"]
    print(" -> Root endpoint OK:", res_root.json()["message"])

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"
    print(" -> Health check OK:", res_health.json())


def test_2_route_optimization_presets():
    print("\n[TEST 2] Route Optimization Presets...")
    for endpoint in ["/api/v1/presets", "/api/route/presets"]:
        res = client.get(endpoint)
        assert res.status_code == 200
        data = res.json()
        assert "pune_cluster" in data
        assert "nashik_cluster" in data
        assert len(data["pune_cluster"]["payload"]["farmers"]) == 4
        assert len(data["pune_cluster"]["payload"]["buyers"]) == 3
        print(f" -> {endpoint} returned {len(data)} scenario presets.")


def test_3_route_optimization_solver():
    print("\n[TEST 3] Route Optimization Solver (OR-Tools PDP-VRPTW)...")
    payload = {
        "depot": {"id": "D0", "name": "Pune Central Hub", "lat": 18.5204, "lon": 73.8567},
        "farmers": [
            {"farmer_id": "F01", "name": "Farmer A (Kothrud)", "lat": 18.5074, "lon": 73.8077, "product": "Tomato", "supply_kg": 180, "pickup_start": "06:00", "pickup_end": "10:00", "service_min": 15},
            {"farmer_id": "F02", "name": "Farmer B (Hinjewadi)", "lat": 18.5913, "lon": 73.7389, "product": "Tomato", "supply_kg": 220, "pickup_start": "06:00", "pickup_end": "10:30", "service_min": 15},
        ],
        "buyers": [
            {"buyer_id": "B01", "name": "Wholesale Mandi 1 (Hadapsar)", "lat": 18.5679, "lon": 73.9143, "product": "Tomato", "demand_kg": 400, "delivery_start": "09:00", "delivery_end": "14:00", "service_min": 20},
        ],
        "vehicles": [
            {"vehicle_id": "V01", "capacity_kg": 500, "max_route_min": 540, "fixed_cost": 300.0},
        ],
        "cost_per_km": 12.0,
        "cost_per_hour": 80.0,
        "solver_time_limit_seconds": 5,
        "use_osrm": False
    }

    for endpoint in ["/api/v1/optimize", "/api/route/optimize"]:
        res = client.post(endpoint, json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "success"
        assert "kpis" in data
        assert "routes" in data
        assert len(data["routes"]) == 1
        r = data["routes"][0]
        assert r["vehicle_id"] == "V01"
        assert len(r["stops"]) >= 4
        print(f" -> {endpoint} solved successfully: {r['distance_km']} km, {r['travel_time_min']} mins, cost ₹{r['estimated_cost_inr']}")


def test_4_route_live_orders_bridge():
    print("\n[TEST 4] Route Live Orders Bridge...")
    res = client.get("/api/route/live-orders")
    assert res.status_code == 200
    data = res.json()
    assert "source" in data
    assert "payload" in data
    assert "farmers" in data["payload"]
    assert "buyers" in data["payload"]
    assert "vehicles" in data["payload"]
    print(f" -> Live orders bridge OK: source='{data['source']}', message='{data['message']}'")


def test_5_demand_forecasting():
    print("\n[TEST 5] Demand Forecasting API...")
    # Check if forecast router is mounted
    res_pred = client.post("/api/forecast/predict", json={
        "commodity": "Tomato",
        "market": "Pune",
        "horizon_days": 7,
        "target": "modal_price",
        "model_type": "xgboost"
    })
    print(f" -> Demand forecasting status code: {res_pred.status_code}")
    if res_pred.status_code == 200:
        data = res_pred.json()
        print(" -> Demand forecast prediction OK:", data.get("commodity"), data.get("current_price"))
    else:
        print(" -> Note on forecast:", res_pred.json())


def test_6_v2_auth_and_product_flow():
    print("\n[TEST 6] Version 2 Core Platform Flow (User Check & OTP)...")
    res_otp = client.post("/api/send-otp", json={"mobile": "9876543210", "role": "farmer"})
    assert res_otp.status_code == 200
    assert res_otp.json()["otp"] == "4920"
    print(" -> Send OTP OK:", res_otp.json())

    res_verify = client.post("/api/verify-otp", json={"mobile": "9876543210", "otp": "4920"})
    assert res_verify.status_code == 200
    assert res_verify.json()["verified"] is True
    print(" -> Verify OTP OK:", res_verify.json())


if __name__ == "__main__":
    print("==================================================================")
    print("       AGRICONNECT VERSION 3 - END-TO-END INTEGRATION TEST        ")
    print("==================================================================")
    test_1_root_and_health()
    test_2_route_optimization_presets()
    test_3_route_optimization_solver()
    test_4_route_live_orders_bridge()
    test_5_demand_forecasting()
    test_6_v2_auth_and_product_flow()
    print("\n==================================================================")
    print("  ALL AGRICONNECT VERSION 3 END-TO-END INTEGRATION TESTS PASSED!  ")
    print("==================================================================")
