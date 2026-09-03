"""
Folium Map Visualization Module for SIH 2026 Vehicle Route Optimization.
Renders interactive maps with depot, farmer pickup, buyer delivery markers, and vehicle routes.
"""

from typing import List, Optional
import folium
from .models import Depot, RouteSummary


def generate_route_map(
    depot: Depot, routes: List[RouteSummary], output_html_path: Optional[str] = None
) -> folium.Map:
    """
    Generates an interactive Folium map visualizing optimized vehicle routes.
    Saves to output_html_path if provided.
    """
    route_map = folium.Map(
        location=[depot.lat, depot.lon],
        zoom_start=11,
        tiles="OpenStreetMap"
    )

    # Add Depot marker
    folium.Marker(
        [depot.lat, depot.lon],
        tooltip=f"DEPOT: {depot.name}",
        popup=f"<b>{depot.name}</b> (Hub ID: {depot.id})",
        icon=folium.Icon(color="black", icon="home")
    ).add_to(route_map)

    colors = ["blue", "green", "purple", "orange", "darkred", "cadetblue", "darkgreen"]

    for idx, r in enumerate(routes):
        color = colors[idx % len(colors)]
        coords = []

        for stop in r.stops:
            coords.append([stop.latitude, stop.longitude])

            if stop.type == "PICKUP":
                icon_color = "green"
                icon_type = "shopping-cart"
            elif stop.type == "DELIVERY":
                icon_color = "red"
                icon_type = "flag"
            else:
                icon_color = "black"
                icon_type = "home"

            folium.Marker(
                [stop.latitude, stop.longitude],
                tooltip=f"Vehicle {r.vehicle_id} - Stop #{stop.sequence} ({stop.node_key})",
                popup=(
                    f"<b>{stop.label}</b><br/>"
                    f"<b>Type:</b> {stop.type}<br/>"
                    f"<b>Shipment:</b> {stop.shipment_id or 'N/A'}<br/>"
                    f"<b>Arrival:</b> {stop.arrival_hhmm}<br/>"
                    f"<b>Vehicle Load:</b> {stop.load_after_visit_kg:.1f} kg"
                ),
                icon=folium.Icon(color=icon_color, icon=icon_type)
            ).add_to(route_map)

        # Draw vehicle polyline route
        folium.PolyLine(
            coords,
            color=color,
            weight=5,
            opacity=0.8,
            tooltip=f"Route for Vehicle {r.vehicle_id} ({r.distance_km:.1f} km, {r.travel_time_min:.0f} min)"
        ).add_to(route_map)

    if output_html_path:
        route_map.save(output_html_path)

    return route_map
