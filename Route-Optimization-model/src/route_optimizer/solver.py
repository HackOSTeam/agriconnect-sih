"""
Google OR-Tools VRP Solver Module for SIH 2026 Vehicle Route Optimization.
Implements multi-vehicle Pickup and Delivery with Capacity and Time Windows (PDP-VRPTW).
"""

from typing import List, Tuple, Dict, Any
import numpy as np
from ortools.constraint_solver import pywrapcp, routing_enums_pb2

from .models import (
    Depot, Vehicle, Shipment, RoutingNode, RouteStop, RouteSummary,
    time_to_minutes, minutes_to_hhmm
)
from .matrix import fetch_osrm_route_geometry

MINUTES_PER_DAY = 24 * 60


def build_routing_nodes(depot: Depot, shipments: List[Shipment]) -> Tuple[List[RoutingNode], List[Tuple[int, int]]]:
    """
    Constructs a list of RoutingNodes from depot and shipments.
    Node 0: Depot
    Node 1..N: Pickups and Deliveries for each shipment.
    Returns (nodes_list, pickup_delivery_pairs).
    """
    nodes: List[RoutingNode] = [
        RoutingNode(
            node_id=0,
            node_key="DEPOT",
            type="DEPOT",
            label=depot.name,
            lat=depot.lat,
            lon=depot.lon,
            load_change_kg=0,
            time_window=[0, MINUTES_PER_DAY],
            service_min=0,
            shipment_id=None
        )
    ]

    pairs: List[Tuple[int, int]] = []
    next_node_id = 1

    for s in shipments:
        pickup_node_id = next_node_id
        next_node_id += 1

        nodes.append(RoutingNode(
            node_id=pickup_node_id,
            node_key=f"{s.shipment_id}_P",
            type="PICKUP",
            label=f"{s.farmer_name} ({s.farmer_id})",
            lat=s.pickup_lat,
            lon=s.pickup_lon,
            load_change_kg=int(round(s.quantity_kg)),
            time_window=[time_to_minutes(s.pickup_start), time_to_minutes(s.pickup_end)],
            service_min=s.pickup_service_min,
            shipment_id=s.shipment_id
        ))

        delivery_node_id = next_node_id
        next_node_id += 1

        nodes.append(RoutingNode(
            node_id=delivery_node_id,
            node_key=f"{s.shipment_id}_D",
            type="DELIVERY",
            label=f"{s.buyer_name} ({s.buyer_id})",
            lat=s.delivery_lat,
            lon=s.delivery_lon,
            load_change_kg=-int(round(s.quantity_kg)),
            time_window=[time_to_minutes(s.delivery_start), time_to_minutes(s.delivery_end)],
            service_min=s.delivery_service_min,
            shipment_id=s.shipment_id
        ))

        pairs.append((pickup_node_id, delivery_node_id))

    return nodes, pairs


def solve_vrp(
    depot: Depot,
    shipments: List[Shipment],
    vehicles: List[Vehicle],
    distance_matrix_km: np.ndarray,
    duration_matrix_min: np.ndarray,
    cost_per_km: float = 12.0,
    cost_per_hour: float = 80.0,
    time_limit_seconds: int = 10
) -> List[RouteSummary]:
    """
    Solves the multi-vehicle pickup & delivery routing problem using Google OR-Tools.
    Returns a list of RouteSummary objects representing optimized routes.
    """
    nodes, pickup_delivery_pairs = build_routing_nodes(depot, shipments)

    num_nodes = len(nodes)
    num_vehicles = len(vehicles)
    depot_node_id = 0

    capacities = [int(v.capacity_kg) for v in vehicles]
    max_route_minutes = [int(v.max_route_min) for v in vehicles]

    manager = pywrapcp.RoutingIndexManager(num_nodes, num_vehicles, depot_node_id)
    routing = pywrapcp.RoutingModel(manager)

    # 1. Distance Transit Callback & Arc Cost Evaluator
    def distance_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        return int(round(distance_matrix_km[from_node, to_node] * 1000))

    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

    # 2. Capacity Dimension
    load_changes = [n.load_change_kg for n in nodes]

    def demand_callback(from_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        return load_changes[from_node]

    demand_callback_index = routing.RegisterUnaryTransitCallback(demand_callback)
    routing.AddDimensionWithVehicleCapacity(
        demand_callback_index,
        0,  # null capacity slack
        capacities,  # vehicle capacities
        True,  # start load at zero
        "Capacity"
    )
    capacity_dimension = routing.GetDimensionOrDie("Capacity")

    # 3. Time Dimension (Travel time + Service time)
    service_times = [n.service_min for n in nodes]

    def total_time_callback(from_index: int, to_index: int) -> int:
        from_node = manager.IndexToNode(from_index)
        to_node = manager.IndexToNode(to_index)
        travel = duration_matrix_min[from_node, to_node]
        service = service_times[from_node]
        return int(round(travel + service))

    time_callback_index = routing.RegisterTransitCallback(total_time_callback)

    routing.AddDimension(
        time_callback_index,
        MINUTES_PER_DAY,  # max waiting time allowed
        MINUTES_PER_DAY,  # max route duration horizon (24h)
        False,            # start at time 0
        "Time"
    )
    time_dimension = routing.GetDimensionOrDie("Time")
    time_dimension.SetGlobalSpanCostCoefficient(10)

    # 4. Node Time Window Constraints
    for node in nodes:
        index = manager.NodeToIndex(node.node_id)
        start, end = node.time_window
        time_dimension.CumulVar(index).SetRange(int(start), int(end))

    # 5. Vehicle Settings (Fixed costs & Max route duration)
    for v_idx in range(num_vehicles):
        start_index = routing.Start(v_idx)
        end_index = routing.End(v_idx)

        time_dimension.CumulVar(start_index).SetRange(0, MINUTES_PER_DAY)
        time_dimension.CumulVar(end_index).SetRange(0, MINUTES_PER_DAY)

        # Enforce maximum shift duration if configured
        if max_route_minutes[v_idx] < MINUTES_PER_DAY:
            routing.solver().Add(
                time_dimension.CumulVar(end_index) - time_dimension.CumulVar(start_index)
                <= max_route_minutes[v_idx]
            )

        fixed_cost = int(round(vehicles[v_idx].fixed_cost))
        routing.SetFixedCostOfVehicle(fixed_cost, v_idx)

    # 6. Pickup & Delivery Constraints
    solver = routing.solver()
    for p_node, d_node in pickup_delivery_pairs:
        p_index = manager.NodeToIndex(p_node)
        d_index = manager.NodeToIndex(d_node)

        routing.AddPickupAndDelivery(p_index, d_index)

        # Same vehicle constraint
        solver.Add(routing.VehicleVar(p_index) == routing.VehicleVar(d_index))

        # Pickup before delivery precedence constraint
        solver.Add(time_dimension.CumulVar(p_index) <= time_dimension.CumulVar(d_index))

    # 7. Search Parameters
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC
    )
    search_parameters.local_search_metaheuristic = (
        routing_enums_pb2.LocalSearchMetaheuristic.GUIDED_LOCAL_SEARCH
    )
    search_parameters.time_limit.seconds = int(time_limit_seconds)

    # Solve
    solution = routing.SolveWithParameters(search_parameters)

    if solution is None:
        raise RuntimeError(
            "No feasible route solution found. Try increasing vehicle capacities, "
            "adding vehicles to the fleet, or widening time windows."
        )

    # 8. Extract Solution Routes
    node_by_id = {n.node_id: n for n in nodes}
    route_summaries: List[RouteSummary] = []

    for v_idx in range(num_vehicles):
        index = routing.Start(v_idx)
        if routing.IsEnd(solution.Value(routing.NextVar(index))):
            continue  # Vehicle unused

        vehicle = vehicles[v_idx]
        stops: List[RouteStop] = []
        route_dist_km = 0.0
        route_travel_min = 0.0
        previous_index = None

        while not routing.IsEnd(index):
            node_id = manager.IndexToNode(index)
            node = node_by_id[node_id]

            arrival_min = int(solution.Min(time_dimension.CumulVar(index)))
            load_after = float(solution.Value(capacity_dimension.CumulVar(index)))

            stops.append(RouteStop(
                sequence=len(stops) + 1,
                node_id=node_id,
                node_key=node.node_key,
                type=node.type,
                label=node.label,
                shipment_id=node.shipment_id,
                arrival_min=arrival_min,
                arrival_hhmm=minutes_to_hhmm(arrival_min),
                load_after_visit_kg=load_after,
                latitude=node.lat,
                longitude=node.lon
            ))

            if previous_index is not None:
                prev_node = manager.IndexToNode(previous_index)
                route_dist_km += distance_matrix_km[prev_node, node_id]
                route_travel_min += duration_matrix_min[prev_node, node_id]

            previous_index = index
            index = solution.Value(routing.NextVar(index))

        # Final end node (depot return)
        end_node_id = manager.IndexToNode(index)
        end_node = node_by_id[end_node_id]

        arrival_min = int(solution.Min(time_dimension.CumulVar(index)))
        load_after = float(solution.Value(capacity_dimension.CumulVar(index)))

        stops.append(RouteStop(
            sequence=len(stops) + 1,
            node_id=end_node_id,
            node_key=end_node.node_key,
            type=end_node.type,
            label=end_node.label,
            shipment_id=end_node.shipment_id,
            arrival_min=arrival_min,
            arrival_hhmm=minutes_to_hhmm(arrival_min),
            load_after_visit_kg=load_after,
            latitude=end_node.lat,
            longitude=end_node.lon
        ))

        if previous_index is not None:
            prev_node = manager.IndexToNode(previous_index)
            route_dist_km += distance_matrix_km[prev_node, end_node_id]
            route_travel_min += duration_matrix_min[prev_node, end_node_id]

        max_load = max(s.load_after_visit_kg for s in stops)
        capacity = float(vehicle.capacity_kg)
        est_cost = (
            route_dist_km * cost_per_km
            + (route_travel_min / 60.0) * cost_per_hour
            + float(vehicle.fixed_cost)
        )

        stop_coords = [(s.latitude, s.longitude) for s in stops]
        geometry_geojson = fetch_osrm_route_geometry(stop_coords)

        route_summaries.append(RouteSummary(
            vehicle_id=vehicle.vehicle_id,
            distance_km=round(route_dist_km, 2),
            travel_time_min=round(route_travel_min, 1),
            max_load_kg=round(max_load, 1),
            capacity_kg=round(capacity, 1),
            utilization_pct=round((max_load / capacity) * 100.0, 2),
            estimated_cost_inr=round(est_cost, 2),
            stops=stops,
            geometry_geojson=geometry_geojson
        ))

    return route_summaries
