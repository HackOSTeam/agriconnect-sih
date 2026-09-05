"""
route_api.py  ─  AgriConnect × Vehicle Route Optimization Bridge
================================================================
FastAPI APIRouter that wraps Google OR-Tools PDP-VRPTW multi-vehicle
route optimization engine, road network matrix generator, and live
AgriConnect order dispatcher.
"""

import os
import sys
import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends

# ---------------------------------------------------------------------------
# Dynamic Python Path Bootstrap for Route-Optimization-model
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_CANDIDATE_SRC_PATHS = [
    os.path.normpath(os.path.join(_THIS_DIR, "..", "Route-Optimization-model", "src")),
    os.path.normpath(os.path.join(_THIS_DIR, "Route-Optimization-model", "src")),
    os.path.normpath(os.path.join(_THIS_DIR, "..", "..", "Route-Optimization-model", "src")),
]

for p in _CANDIDATE_SRC_PATHS:
    if os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from route_optimizer.models import (
        OptimizationRequest, OptimizationResponse,
        Depot, Farmer, Buyer, Vehicle, Shipment
    )
    from route_optimizer.matching import build_shipments
    from route_optimizer.matrix import build_distance_duration_matrix
    from route_optimizer.solver import solve_vrp, build_routing_nodes
    from route_optimizer.kpis import calculate_kpis, baseline_sequential_distance
    from route_optimizer.visualization import generate_route_map
except ImportError as err:
    raise RuntimeError(
        f"Cannot import route_optimizer package. Ensure Route-Optimization-model/src is accessible. "
        f"Error: {err}"
    )

logger = logging.getLogger("agriconnect.route")

route_router = APIRouter(tags=["Route Optimization"])

# ---------------------------------------------------------------------------
# Default Demonstration Preset Scenarios
# ---------------------------------------------------------------------------
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
        "description": "4 regional producers in Dindori, Ozar, Pimpalgaon delivering to Nashik APMC Mandi and Cold Storage Hubs.",
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


def _execute_optimization(req: OptimizationRequest) -> OptimizationResponse:
    """Core optimization logic handler."""
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


# ---------------------------------------------------------------------------
# API Endpoints (Mounted at both /api/v1/* and /api/route/* for full compatibility)
# ---------------------------------------------------------------------------

@route_router.get("/api/v1/presets")
@route_router.get("/api/route/presets")
def get_presets():
    """Returns available sample presets for easy demonstration."""
    return PRESETS


@route_router.post("/api/v1/optimize", response_model=OptimizationResponse)
@route_router.post("/api/route/optimize", response_model=OptimizationResponse)
def optimize_routes(req: OptimizationRequest):
    """
    Accepts depot, farmers, buyers, and vehicle parameters.
    Executes matching, road matrix calculation, and Google OR-Tools PDP-VRPTW optimization.
    """
    try:
        return _execute_optimization(req)
    except ValueError as ve:
        logger.warning(f"Route matching error: {ve}")
        raise HTTPException(status_code=400, detail=f"Data matching error: {str(ve)}")
    except RuntimeError as re:
        logger.warning(f"Route solver error: {re}")
        raise HTTPException(status_code=422, detail=f"Optimization solver error: {str(re)}")
    except Exception as e:
        logger.error(f"Internal optimization error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal optimization error: {str(e)}")


@route_router.get("/api/route/live-orders")
def get_live_orders_payload():
    """
    Scans the AgriConnect database for active orders and compiles a ready-to-optimize
    payload from live farmers and buyers. Falls back to sample cluster if database is empty.
    """
    try:
        import database, models
        db = database.SessionLocal()
        orders = db.query(models.Order).filter(
            models.Order.status.in_(["placed", "confirmed", "pending farmer confirmation", "accepted", "Pending"])
        ).all()
        
        if not orders:
            # Fallback with informative notice
            pune = PRESETS["pune_cluster"]["payload"]
            db.close()
            return {
                "source": "preset_fallback",
                "message": "No active placed orders in database; displaying Pune Agro-Cluster demonstration payload.",
                "payload": pune
            }
        
        # Build dynamic farmer & buyer lists from database
        farmers_map = {}
        buyers_map = {}

        # Default geo-cluster centers around Pune/Maharashtra belt
        sample_coords = [
            (18.5074, 73.8077), (18.5913, 73.7389), (18.6298, 73.7997),
            (18.4529, 73.8553), (18.5679, 73.9143), (18.6420, 73.7610)
        ]

        for idx, o in enumerate(orders):
            p_name = o.crop_name or "Produce"
            qty = float(o.quantity_kg or 100)
            
            # Farmer node
            f_key = f"F_{o.farmer_name or f'Farmer_{idx+1}'}"
            if f_key not in farmers_map:
                coord = sample_coords[len(farmers_map) % len(sample_coords)]
                farmers_map[f_key] = {
                    "farmer_id": f"F{len(farmers_map)+1:02d}",
                    "name": o.farmer_name or f"Farmer {len(farmers_map)+1}",
                    "lat": coord[0],
                    "lon": coord[1],
                    "product": p_name,
                    "supply_kg": qty,
                    "pickup_start": "06:00",
                    "pickup_end": "11:00",
                    "service_min": 15
                }
            else:
                farmers_map[f_key]["supply_kg"] += qty

            # Buyer node
            b_key = f"B_{o.buyer_name or f'Buyer_{idx+1}'}"
            if b_key not in buyers_map:
                coord = sample_coords[(len(buyers_map) + 3) % len(sample_coords)]
                buyers_map[b_key] = {
                    "buyer_id": f"B{len(buyers_map)+1:02d}",
                    "name": o.buyer_name or f"Buyer {len(buyers_map)+1}",
                    "lat": coord[0],
                    "lon": coord[1],
                    "product": p_name,
                    "demand_kg": qty,
                    "delivery_start": "09:00",
                    "delivery_end": "15:00",
                    "service_min": 20
                }
            else:
                buyers_map[b_key]["demand_kg"] += qty

        db.close()

        total_goods = sum(f["supply_kg"] for f in farmers_map.values())
        vehicles_count = max(2, int(total_goods // 350) + 1)
        vehicles = [
            {"vehicle_id": f"V{i+1:02d}", "capacity_kg": 400.0, "max_route_min": 540, "fixed_cost": 350.0}
            for i in range(vehicles_count)
        ]

        payload = {
            "depot": {"id": "D0", "name": "AgriConnect Central Hub (Pune)", "lat": 18.5204, "lon": 73.8567},
            "farmers": list(farmers_map.values()),
            "buyers": list(buyers_map.values()),
            "vehicles": vehicles,
            "cost_per_km": 12.0,
            "cost_per_hour": 80.0,
            "solver_time_limit_seconds": 10,
            "use_osrm": True
        }

        return {
            "source": "live_database",
            "message": f"Successfully compiled {len(orders)} active orders into {len(farmers_map)} pickup and {len(buyers_map)} delivery nodes.",
            "payload": payload
        }

    except Exception as e:
        logger.warning(f"Error compiling live orders payload: {e}")
        return {
            "source": "preset_fallback",
            "message": f"Live order scan encountered issue ({e}); displaying Pune Agro-Cluster demonstration payload.",
            "payload": PRESETS["pune_cluster"]["payload"]
        }
