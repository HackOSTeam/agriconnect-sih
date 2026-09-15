"""
Distance and Duration Matrix Generator for SIH 2026 Vehicle Route Optimization.
Supports OSRM road network API and Haversine formula fallback.
"""

import math
from typing import List, Tuple
import numpy as np
import requests
from .models import RoutingNode

OSRM_BASE_URL = "https://router.project-osrm.org"
ROUTING_PROFILE = "driving"


def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the Great-Circle distance between two points in km."""
    R = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    )
    return 2.0 * R * math.asin(math.sqrt(a))


def build_haversine_matrix(
    coords: List[Tuple[float, float]], assumed_speed_kmph: float = 35.0
) -> Tuple[np.ndarray, np.ndarray]:
    """Calculate distance (km) and estimated duration (minutes) using Haversine formula."""
    n = len(coords)
    distance_km = np.zeros((n, n), dtype=float)
    duration_min = np.zeros((n, n), dtype=float)

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            km = haversine_distance_km(
                coords[i][0], coords[i][1], coords[j][0], coords[j][1]
            )
            distance_km[i, j] = km
            duration_min[i, j] = (km / assumed_speed_kmph) * 60.0

    return distance_km, duration_min


def build_osrm_matrix(
    coords: List[Tuple[float, float]], base_url: str = OSRM_BASE_URL
) -> Tuple[np.ndarray, np.ndarray]:
    """Query OSRM table service for road network distance (km) and travel duration (minutes)."""
    coord_string = ";".join(f"{lon},{lat}" for lat, lon in coords)
    url = f"{base_url}/table/v1/{ROUTING_PROFILE}/{coord_string}?annotations=distance,duration"

    response = requests.get(
        url,
        timeout=15,
        headers={"User-Agent": "SIH-PS33-Route-Optimizer/1.0"}
    )
    response.raise_for_status()

    data = response.json()
    if data.get("code") != "Ok":
        raise RuntimeError(f"OSRM returned error status code: {data.get('code')}")

    distances_m = np.array(data["distances"], dtype=float)
    durations_s = np.array(data["durations"], dtype=float)

    if not np.isfinite(distances_m).all() or not np.isfinite(durations_s).all():
        raise RuntimeError("OSRM response contains invalid non-finite numbers.")

    distance_km = distances_m / 1000.0
    duration_min = durations_s / 60.0

    return distance_km, duration_min


def build_distance_duration_matrix(
    nodes: List[RoutingNode], use_osrm: bool = True
) -> Tuple[np.ndarray, np.ndarray, str]:
    """
    Build distance (km) and duration (minutes) matrices for a list of RoutingNodes.
    Attempts OSRM road lookup first; falls back to Haversine if disabled or unreachable.
    Returns (distance_matrix_km, duration_matrix_min, matrix_source).
    """
    coords = [(node.lat, node.lon) for node in nodes]

    if use_osrm:
        try:
            dist_km, dur_min = build_osrm_matrix(coords)
            return dist_km, dur_min, "OSRM road network"
        except Exception as err:
            dist_km, dur_min = build_haversine_matrix(coords)
            return dist_km, dur_min, f"Haversine fallback (OSRM error: {err})"

    dist_km, dur_min = build_haversine_matrix(coords)
    return dist_km, dur_min, "Haversine distance matrix"


def fetch_osrm_route_geometry(
    stop_coords: List[Tuple[float, float]], base_url: str = OSRM_BASE_URL
) -> List[List[float]]:
    """
    Fetches the exact real-road polyline geometry connecting ordered stops.
    Input coords are [(lat, lon), ...].
    Returns a list of [lat, lon] pairs following the actual street network.
    """
    if len(stop_coords) < 2:
        return [[lat, lon] for lat, lon in stop_coords]

    try:
        coord_string = ";".join(f"{lon},{lat}" for lat, lon in stop_coords)
        url = f"{base_url}/route/v1/{ROUTING_PROFILE}/{coord_string}?overview=full&geometries=geojson"
        response = requests.get(
            url,
            timeout=10,
            headers={"User-Agent": "SIH-PS33-Route-Optimizer/1.0"}
        )
        if response.status_code == 200:
            data = response.json()
            if data.get("code") == "Ok" and len(data.get("routes", [])) > 0:
                geojson_coords = data["routes"][0]["geometry"]["coordinates"]
                # Convert OSRM [lon, lat] to Leaflet-compatible [lat, lon]
                return [[c[1], c[0]] for c in geojson_coords]
    except Exception:
        pass

    # Fallback to straight lines between stop coordinates
    return [[lat, lon] for lat, lon in stop_coords]
