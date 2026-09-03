"""
SIH 2026 Vehicle Route Optimization - CLI Demo Runner
Runs end-to-end optimization pipeline and generates interactive map output.
"""

import os
import json
import sys

# Ensure UTF-8 output encoding for Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure src is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from route_optimizer.models import OptimizationRequest, OptimizationResponse
from route_optimizer.matching import build_shipments
from route_optimizer.matrix import build_distance_duration_matrix
from route_optimizer.solver import solve_vrp, build_routing_nodes
from route_optimizer.kpis import calculate_kpis, baseline_sequential_distance
from route_optimizer.visualization import generate_route_map


def run_pipeline(payload_dict: dict) -> dict:
    """Executes the full vehicle routing optimization pipeline."""
    req = OptimizationRequest.model_validate(payload_dict)

    print("Step 1: Matching Farmer Supply to Buyer Demand...")
    shipments = build_shipments(req.farmers, req.buyers)
    print(f" -> Created {len(shipments)} pickup-delivery shipments.")

    print("\nStep 2: Building Routing Nodes...")
    nodes, pairs = build_routing_nodes(req.depot, shipments)
    print(f" -> Total nodes: {len(nodes)} (Depot + {len(pairs)} Pickups + {len(pairs)} Deliveries).")

    print("\nStep 3: Calculating Distance & Travel-Time Matrices...")
    dist_km, dur_min, matrix_source = build_distance_duration_matrix(nodes, use_osrm=req.use_osrm)
    print(f" -> Matrix source: {matrix_source}")

    print("\nStep 4: Solving VRP with Google OR-Tools...")
    routes = solve_vrp(
        depot=req.depot,
        shipments=shipments,
        vehicles=req.vehicles,
        distance_matrix_km=dist_km,
        duration_matrix_min=dur_min,
        cost_per_km=req.cost_per_km,
        cost_per_hour=req.cost_per_hour,
        time_limit_seconds=req.solver_time_limit_seconds
    )
    print(f" -> Solution found! Utilized {len(routes)} vehicles out of {len(req.vehicles)} available.")

    print("\nStep 5: Calculating KPIs & Baseline Comparison...")
    base_dist = baseline_sequential_distance(shipments, dist_km, nodes)
    kpis = calculate_kpis(routes, shipments, base_dist)

    print("\nStep 6: Generating Folium Route Map...")
    map_file = "route_map.html"
    generate_route_map(req.depot, routes, output_html_path=map_file)
    print(f" -> Saved interactive map to '{map_file}'.")

    response = OptimizationResponse(
        status="success",
        matrix_source=matrix_source,
        kpis=kpis,
        routes=routes
    )

    return response.model_dump()


def main():
    payload_path = os.path.join(os.path.dirname(__file__), "data", "sample_payload.json")

    if os.path.exists(payload_path):
        with open(payload_path, "r", encoding="utf-8") as f:
            payload = json.load(f)
    else:
        print("Sample payload file not found!")
        sys.exit(1)

    print("================================================================")
    print("      SIH 2026 PS33 - VEHICLE ROUTE OPTIMIZATION ENGINE         ")
    print("================================================巧===========\n")

    result = run_pipeline(payload)

    print("\n================================================================")
    print("                     OPTIMIZATION RESULT SUMMARY                ")
    print("================================================================")
    print(json.dumps(result["kpis"], indent=2))

    print("\nVehicle Route Details:")
    for r in result["routes"]:
        print(f"\n--- Vehicle {r['vehicle_id']} ---")
        print(f"  Distance: {r['distance_km']} km | Travel Time: {r['travel_time_min']} min | Load Utilization: {r['utilization_pct']}% | Cost: ₹{r['estimated_cost_inr']}")
        print("  Stops:")
        for s in r["stops"]:
            print(f"    Stop {s['sequence']}: [{s['type']:8s}] {s['label']:35s} | ETA: {s['arrival_hhmm']} | Load: {s['load_after_visit_kg']} kg")

    print("\n================================================================")
    print("Optimization Completed Successfully.")


if __name__ == "__main__":
    main()
