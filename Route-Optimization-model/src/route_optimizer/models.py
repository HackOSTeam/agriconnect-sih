"""
Data models and schemas for SIH 2026 Vehicle Route Optimization.
"""

from typing import List, Optional, Tuple
from pydantic import BaseModel, Field


def time_to_minutes(hhmm: str) -> int:
    """Convert HH:MM string to minutes past midnight."""
    h, m = map(int, hhmm.split(":"))
    return h * 60 + m


def minutes_to_hhmm(minutes: float) -> str:
    """Convert minutes past midnight to HH:MM string."""
    m_int = int(round(minutes)) % (24 * 60)
    h = m_int // 60
    m = m_int % 60
    return f"{h:02d}:{m:02d}"


class Depot(BaseModel):
    id: str = "D0"
    name: str = "Central Depot"
    lat: float
    lon: float


class Farmer(BaseModel):
    farmer_id: str
    name: str
    lat: float
    lon: float
    product: str
    supply_kg: float
    pickup_start: str = "06:00"
    pickup_end: str = "12:00"
    service_min: int = 15


class Buyer(BaseModel):
    buyer_id: str
    name: str
    lat: float
    lon: float
    product: str
    demand_kg: float
    delivery_start: str = "08:00"
    delivery_end: str = "16:00"
    service_min: int = 20


class Vehicle(BaseModel):
    vehicle_id: str
    capacity_kg: float
    max_route_min: int = 540
    fixed_cost: float = 300.0


class Shipment(BaseModel):
    shipment_id: str
    product: str
    quantity_kg: float
    farmer_id: str
    farmer_name: str
    pickup_lat: float
    pickup_lon: float
    pickup_start: str
    pickup_end: str
    pickup_service_min: int
    buyer_id: str
    buyer_name: str
    delivery_lat: float
    delivery_lon: float
    delivery_start: str
    delivery_end: str
    delivery_service_min: int


class RoutingNode(BaseModel):
    node_id: int
    node_key: str
    type: str  # DEPOT, PICKUP, DELIVERY
    label: str
    lat: float
    lon: float
    load_change_kg: int
    time_window: List[int]  # [start_min, end_min]
    service_min: int
    shipment_id: Optional[str] = None


class RouteStop(BaseModel):
    sequence: int
    node_id: int
    node_key: str
    type: str
    label: str
    shipment_id: Optional[str] = None
    arrival_min: int
    arrival_hhmm: str
    load_after_visit_kg: float
    latitude: float
    longitude: float


class RouteSummary(BaseModel):
    vehicle_id: str
    distance_km: float
    travel_time_min: float
    max_load_kg: float
    capacity_kg: float
    utilization_pct: float
    estimated_cost_inr: float
    stops: List[RouteStop] = Field(default_factory=list)
    geometry_geojson: List[List[float]] = Field(default_factory=list)


class KPIs(BaseModel):
    vehicles_used: int
    total_distance_km: float
    total_travel_hours: float
    total_goods_kg: float
    capacity_utilization_pct: float
    estimated_transport_cost_inr: float
    cost_per_kg_inr: float
    baseline_distance_km: float
    distance_saved_pct: float


class OptimizationRequest(BaseModel):
    depot: Depot
    farmers: List[Farmer]
    buyers: List[Buyer]
    vehicles: List[Vehicle]
    cost_per_km: float = 12.0
    cost_per_hour: float = 80.0
    solver_time_limit_seconds: int = 10
    use_osrm: bool = True


class OptimizationResponse(BaseModel):
    status: str
    matrix_source: str
    kpis: KPIs
    routes: List[RouteSummary]
