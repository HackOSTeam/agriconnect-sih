"""
KPI Calculation and Baseline Comparison Module for SIH 2026 Vehicle Route Optimization.
"""

from typing import List
import numpy as np
from .models import RouteSummary, Shipment, KPIs, RoutingNode


def baseline_sequential_distance(
    shipments: List[Shipment], distance_matrix_km: np.ndarray, nodes: List[RoutingNode]
) -> float:
    """
    Calculates distance for a simple baseline sequential route (visits nodes in sequence 0..N).
    Used to calculate percentage improvement of the optimizer.
    """
    node_order = [n.node_id for n in nodes]
    dist = 0.0
    for a, b in zip(node_order[:-1], node_order[1:]):
        dist += distance_matrix_km[a, b]

    if node_order[-1] != 0:
        dist += distance_matrix_km[node_order[-1], 0]

    return dist


def calculate_kpis(
    routes: List[RouteSummary], shipments: List[Shipment], baseline_distance_km: float
) -> KPIs:
    """Calculates summary KPIs across all optimized vehicle routes."""
    vehicles_used = len(routes)
    total_dist_km = sum(r.distance_km for r in routes)
    total_travel_hours = sum(r.travel_time_min for r in routes) / 60.0
    total_goods_kg = sum(s.quantity_kg for s in shipments)
    total_cost_inr = sum(r.estimated_cost_inr for r in routes)

    total_max_load = sum(r.max_load_kg for r in routes)
    total_capacity = sum(r.capacity_kg for r in routes)
    utilization_pct = (total_max_load / total_capacity * 100.0) if total_capacity > 0 else 0.0

    cost_per_kg = (total_cost_inr / total_goods_kg) if total_goods_kg > 0 else 0.0

    dist_saved_pct = (
        ((baseline_distance_km - total_dist_km) / baseline_distance_km * 100.0)
        if baseline_distance_km > 0
        else 0.0
    )

    return KPIs(
        vehicles_used=vehicles_used,
        total_distance_km=round(total_dist_km, 2),
        total_travel_hours=round(total_travel_hours, 2),
        total_goods_kg=round(total_goods_kg, 2),
        capacity_utilization_pct=round(utilization_pct, 2),
        estimated_transport_cost_inr=round(total_cost_inr, 2),
        cost_per_kg_inr=round(cost_per_kg, 2),
        baseline_distance_km=round(baseline_distance_km, 2),
        distance_saved_pct=round(dist_saved_pct, 2)
    )
