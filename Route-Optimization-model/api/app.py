import sys
import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure src is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from route_optimizer.models import OptimizationRequest, OptimizationResponse
from route_optimizer.matching import build_shipments
from route_optimizer.matrix import build_distance_duration_matrix
from route_optimizer.solver import solve_vrp, build_routing_nodes
from route_optimizer.kpis import calculate_kpis, baseline_sequential_distance

app = FastAPI(
    title="SIH 2026 PS33 Vehicle Route Optimization API",
    description="Constraint Programming API for Farmer-to-Buyer Multi-Vehicle Pickup and Delivery Routing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PRESETS = {
    "pune_cluster": {
        "title": "Pune Agro-Cluster (Tomato Belt)",
        "description": "4 smallholder farmers in Kothrud, Hinjewadi, Chinchwad & Katraj delivering to Hadapsar wholesale and city retail buyers.",
        "payload": {
            "depot": {"id": "D0", "name": "Pune Central Hub", "lat": 18.5204, "lon": 73.8567},
            "farmers": [
                {"farmer_id": "F01", "name": "Farmer A (Kothrud)", "lat": 18.5074, "lon": 73.8077, "product": "Tomato", "supply_kg": 180, "pickup_start": "06:00", "pickup_end": "10:00", "service_min": 15},
                {"farmer_id": "F02", "name": "Farmer B (Hinjewadi)", "lat": 18.5913, "lon": 73.7389, "product": "Tomato", "supply_kg": 220, "pickup_start": "06:00", "pickup_end": "10:30", "service_min": 15},
                {"farmer_id": "F03", "name": "Farmer C (Chinchwad)", "lat": 18.6298, "lon": 73.7997, "product": "Tomato", "supply_kg": 160, "pickup_start": "06:30", "pickup_end": "11:00", "service_min": 15},
                {"farmer_id": "F04", "name": "Farmer D (Katraj)", "lat": 18.4529, "lon": 73.8553, "product": "Tomato", "supply_kg": 140, "pickup_start": "06:00", "pickup_end": "09:30", "service_min": 15}
            ],
            "buyers": [
                {"buyer_id": "B01", "name": "Wholesale Mandi 1 (Hadapsar)", "lat": 18.5679, "lon": 73.9143, "product": "Tomato", "demand_kg": 250, "delivery_start": "09:00", "delivery_end": "13:00", "service_min": 20},
                {"buyer_id": "B02", "name": "Supermarket DC (Pimple Saudagar)", "lat": 18.6420, "lon": 73.7610, "product": "Tomato", "demand_kg": 220, "delivery_start": "09:00", "delivery_end": "14:00", "service_min": 20},
                {"buyer_id": "B03", "name": "Retail Aggregator (Bibwewadi)", "lat": 18.4770, "lon": 73.8900, "product": "Tomato", "demand_kg": 120, "delivery_start": "08:30", "delivery_end": "12:00", "service_min": 20}
            ],
            "vehicles": [
                {"vehicle_id": "V01", "capacity_kg": 350, "max_route_min": 540, "fixed_cost": 300.0},
                {"vehicle_id": "V02", "capacity_kg": 350, "max_route_min": 540, "fixed_cost": 300.0},
                {"vehicle_id": "V03", "capacity_kg": 300, "max_route_min": 540, "fixed_cost": 300.0}
            ],
            "cost_per_km": 12.0,
            "cost_per_hour": 80.0,
            "solver_time_limit_seconds": 10,
            "use_osrm": True
        }
    },
    "nashik_cluster": {
        "title": "Nashik Agro Hub (Grapes & Onions)",
        "description": "5 regional orchards in Dindori, Ozar, Pimpalgaon delivering to Nashik APMC Mandi and Cold Storage Hubs.",
        "payload": {
            "depot": {"id": "D0", "name": "Nashik APMC Depot", "lat": 19.9975, "lon": 73.7898},
            "farmers": [
                {"farmer_id": "F01", "name": "Dindori Vineyard", "lat": 20.1982, "lon": 73.8344, "product": "Grapes", "supply_kg": 300, "pickup_start": "06:00", "pickup_end": "10:00", "service_min": 15},
                {"farmer_id": "F02", "name": "Ozar Onion Farm", "lat": 20.0894, "lon": 73.9214, "product": "Onion", "supply_kg": 450, "pickup_start": "06:00", "pickup_end": "11:00", "service_min": 15},
                {"farmer_id": "F03", "name": "Pimpalgaon Grape Orchards", "lat": 20.1706, "lon": 74.0416, "product": "Grapes", "supply_kg": 250, "pickup_start": "06:30", "pickup_end": "10:30", "service_min": 15},
                {"farmer_id": "F04", "name": "Deolali Onion Producer", "lat": 19.9328, "lon": 73.8315, "product": "Onion", "supply_kg": 350, "pickup_start": "07:00", "pickup_end": "11:30", "service_min": 15}
            ],
            "buyers": [
                {"buyer_id": "B01", "name": "Nashik Cold Storage Hub", "lat": 19.9850, "lon": 73.7700, "product": "Grapes", "demand_kg": 550, "delivery_start": "09:30", "delivery_end": "15:00", "service_min": 25},
                {"buyer_id": "B02", "name": "Exporters Consolidation Center", "lat": 20.0210, "lon": 73.8150, "product": "Onion", "demand_kg": 500, "delivery_start": "10:00", "delivery_end": "16:00", "service_min": 25},
                {"buyer_id": "B03", "name": "Metro Retail Market", "lat": 19.9600, "lon": 73.7600, "product": "Onion", "demand_kg": 300, "delivery_start": "10:00", "delivery_end": "15:30", "service_min": 20}
            ],
            "vehicles": [
                {"vehicle_id": "TRUCK-1", "capacity_kg": 600, "max_route_min": 540, "fixed_cost": 450.0},
                {"vehicle_id": "TRUCK-2", "capacity_kg": 600, "max_route_min": 540, "fixed_cost": 450.0},
                {"vehicle_id": "TRUCK-3", "capacity_kg": 500, "max_route_min": 540, "fixed_cost": 400.0}
            ],
            "cost_per_km": 14.0,
            "cost_per_hour": 100.0,
            "solver_time_limit_seconds": 10,
            "use_osrm": True
        }
    }
}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


@app.get("/api/v1/presets")
def get_presets():
    """Returns available sample presets for easy demonstration."""
    return PRESETS


@app.post("/api/v1/optimize", response_model=OptimizationResponse)
def optimize_routes(req: OptimizationRequest):
    """
    Accepts depot, farmers, buyers, and vehicle parameters.
    Executes matching, road matrix calculation, and Google OR-Tools PDP-VRPTW optimization.
    """
    try:
        # 1. Matching
        shipments = build_shipments(req.farmers, req.buyers)

        # 2. Nodes
        nodes, pairs = build_routing_nodes(req.depot, shipments)

        # 3. Distance/Duration Matrix
        dist_km, dur_min, matrix_source = build_distance_duration_matrix(
            nodes, use_osrm=req.use_osrm
        )

        # 4. OR-Tools Solver
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

        # 5. KPIs & Baseline Comparison
        base_dist = baseline_sequential_distance(shipments, dist_km, nodes)
        kpis = calculate_kpis(routes, shipments, base_dist)

        return OptimizationResponse(
            status="success",
            matrix_source=matrix_source,
            kpis=kpis,
            routes=routes
        )

    except ValueError as ve:
        raise HTTPException(status_code=400, detail=f"Data matching error: {str(ve)}")
    except RuntimeError as re:
        raise HTTPException(status_code=422, detail=f"Optimization solver error: {str(re)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal optimization error: {str(e)}")


# Mount static UI directory if it exists
UI_DIR = os.path.join(os.path.dirname(__file__), "..", "ui")
if os.path.exists(UI_DIR):
    app.mount("/", StaticFiles(directory=UI_DIR, html=True), name="ui")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
