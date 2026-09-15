"""
Automated Pytest Suite for SIH 2026 Vehicle Route Optimization Engine.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

# Add src and api to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from route_optimizer.models import (
    Depot, Farmer, Buyer, Vehicle, OptimizationRequest, time_to_minutes, minutes_to_hhmm
)
from route_optimizer.matching import build_shipments
from route_optimizer.matrix import build_haversine_matrix, build_distance_duration_matrix
from route_optimizer.solver import solve_vrp, build_routing_nodes
from route_optimizer.kpis import calculate_kpis, baseline_sequential_distance
from app import app


@pytest.fixture
def sample_payload():
    return {
        "depot": Depot(id="D0", name="Pune Hub", lat=18.5204, lon=73.8567),
        "farmers": [
            Farmer(farmer_id="F1", name="Farmer 1", lat=18.5074, lon=73.8077, product="Tomato", supply_kg=200, pickup_start="06:00", pickup_end="10:00"),
            Farmer(farmer_id="F2", name="Farmer 2", lat=18.5913, lon=73.7389, product="Tomato", supply_kg=150, pickup_start="06:00", pickup_end="10:00"),
        ],
        "buyers": [
            Buyer(buyer_id="B1", name="Buyer 1", lat=18.5679, lon=73.9143, product="Tomato", demand_kg=350, delivery_start="09:00", delivery_end="14:00"),
        ],
        "vehicles": [
            Vehicle(vehicle_id="V1", capacity_kg=400, max_route_min=540, fixed_cost=300.0),
        ]
    }


def test_time_conversions():
    assert time_to_minutes("06:30") == 390
    assert time_to_minutes("00:00") == 0
    assert minutes_to_hhmm(390) == "06:30"
    assert minutes_to_hhmm(0) == "00:00"


def test_matching(sample_payload):
    shipments = build_shipments(sample_payload["farmers"], sample_payload["buyers"])
    assert len(shipments) == 2
    total_qty = sum(s.quantity_kg for s in shipments)
    assert total_qty == 350.0


def test_haversine_matrix(sample_payload):
    shipments = build_shipments(sample_payload["farmers"], sample_payload["buyers"])
    nodes, _ = build_routing_nodes(sample_payload["depot"], shipments)
    coords = [(n.lat, n.lon) for n in nodes]
    dist_km, dur_min = build_haversine_matrix(coords)

    assert dist_km.shape == (5, 5)
    assert dur_min.shape == (5, 5)
    assert dist_km[0, 0] == 0.0


def test_vrp_solver(sample_payload):
    shipments = build_shipments(sample_payload["farmers"], sample_payload["buyers"])
    nodes, pairs = build_routing_nodes(sample_payload["depot"], shipments)
    dist_km, dur_min, source = build_distance_duration_matrix(nodes, use_osrm=False)

    routes = solve_vrp(
        depot=sample_payload["depot"],
        shipments=shipments,
        vehicles=sample_payload["vehicles"],
        distance_matrix_km=dist_km,
        duration_matrix_min=dur_min,
        time_limit_seconds=5
    )

    assert len(routes) == 1
    route = routes[0]
    assert route.vehicle_id == "V1"
    assert route.max_load_kg <= 400.0
    assert len(route.stops) >= 4  # Depot -> P1 -> P2 -> D1 -> Depot


def test_kpi_calculation(sample_payload):
    shipments = build_shipments(sample_payload["farmers"], sample_payload["buyers"])
    nodes, pairs = build_routing_nodes(sample_payload["depot"], shipments)
    dist_km, dur_min, _ = build_distance_duration_matrix(nodes, use_osrm=False)

    routes = solve_vrp(
        depot=sample_payload["depot"],
        shipments=shipments,
        vehicles=sample_payload["vehicles"],
        distance_matrix_km=dist_km,
        duration_matrix_min=dur_min
    )

    base_dist = baseline_sequential_distance(shipments, dist_km, nodes)
    kpis = calculate_kpis(routes, shipments, base_dist)

    assert kpis.vehicles_used == 1
    assert kpis.total_goods_kg == 350.0
    assert kpis.total_distance_km > 0
    assert kpis.capacity_utilization_pct > 0


def test_fastapi_endpoints():
    client = TestClient(app)

    res_health = client.get("/health")
    assert res_health.status_code == 200
    assert res_health.json() == {"status": "healthy"}

    res_presets = client.get("/api/v1/presets")
    assert res_presets.status_code == 200
    presets_json = res_presets.json()
    assert "pune_cluster" in presets_json
    assert "nashik_cluster" in presets_json

    req_data = {
        "depot": {"id": "D0", "name": "Hub", "lat": 18.52, "lon": 73.85},
        "farmers": [
            {"farmer_id": "F1", "name": "Farmer 1", "lat": 18.50, "lon": 73.80, "product": "Tomato", "supply_kg": 200, "pickup_start": "06:00", "pickup_end": "12:00"}
        ],
        "buyers": [
            {"buyer_id": "B1", "name": "Buyer 1", "lat": 18.56, "lon": 73.91, "product": "Tomato", "demand_kg": 200, "delivery_start": "08:00", "delivery_end": "14:00"}
        ],
        "vehicles": [
            {"vehicle_id": "V1", "capacity_kg": 300, "max_route_min": 540, "fixed_cost": 300.0}
        ],
        "use_osrm": False
    }

    res_opt = client.post("/api/v1/optimize", json=req_data)
    assert res_opt.status_code == 200
    json_data = res_opt.json()
    assert json_data["status"] == "success"
    assert "kpis" in json_data
    assert "routes" in json_data
    assert len(json_data["routes"]) == 1
    assert "geometry_geojson" in json_data["routes"][0]
