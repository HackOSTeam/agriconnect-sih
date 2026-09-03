"""
Supply-Demand Matching Module for SIH 2026 Vehicle Route Optimization.
Matches farmer supply to buyer demand to form discrete pickup-delivery shipments.
"""

from typing import List
import pandas as pd
from .models import Farmer, Buyer, Shipment, time_to_minutes


def build_shipments(farmers: List[Farmer], buyers: List[Buyer]) -> List[Shipment]:
    """
    Greedy allocation of farmer supply to buyer demand based on product matching
    and delivery deadlines. Returns a list of Shipment objects.
    """
    # Convert input list to working records
    farmers_data = [f.model_dump() for f in farmers]
    buyers_data = [b.model_dump() for b in buyers]

    farmers_df = pd.DataFrame(farmers_data)
    buyers_df = pd.DataFrame(buyers_data)

    farmers_df["remaining_kg"] = farmers_df["supply_kg"].astype(float)
    buyers_df["remaining_demand"] = buyers_df["demand_kg"].astype(float)

    # Sort buyers by delivery deadline (earliest delivery end first)
    buyers_sorted = buyers_df.sort_values(
        by="delivery_end",
        key=lambda col: col.map(time_to_minutes)
    )

    shipments: List[Shipment] = []
    shipment_counter = 1

    for _, buyer in buyers_sorted.iterrows():
        remaining_demand = float(buyer["remaining_demand"])

        # Find compatible farmers with available supply for this product
        compatible = farmers_df[
            (farmers_df["product"] == buyer["product"]) &
            (farmers_df["remaining_kg"] > 0)
        ].sort_values(
            by="pickup_end",
            key=lambda col: col.map(time_to_minutes)
        )

        for farmer_idx, farmer in compatible.iterrows():
            if remaining_demand <= 0:
                break

            alloc = min(float(farmer["remaining_kg"]), remaining_demand)
            if alloc <= 0:
                continue

            shipments.append(Shipment(
                shipment_id=f"S{shipment_counter:02d}",
                product=buyer["product"],
                quantity_kg=alloc,
                farmer_id=farmer["farmer_id"],
                farmer_name=farmer["name"],
                pickup_lat=farmer["lat"],
                pickup_lon=farmer["lon"],
                pickup_start=farmer["pickup_start"],
                pickup_end=farmer["pickup_end"],
                pickup_service_min=int(farmer["service_min"]),
                buyer_id=buyer["buyer_id"],
                buyer_name=buyer["name"],
                delivery_lat=buyer["lat"],
                delivery_lon=buyer["lon"],
                delivery_start=buyer["delivery_start"],
                delivery_end=buyer["delivery_end"],
                delivery_service_min=int(buyer["service_min"])
            ))

            farmers_df.loc[farmer_idx, "remaining_kg"] -= alloc
            remaining_demand -= alloc
            shipment_counter += 1

        if remaining_demand > 0.001:
            raise ValueError(
                f"Unmatched demand for buyer {buyer['buyer_id']} ({buyer['name']}). "
                f"Deficit: {remaining_demand:.1f} kg of {buyer['product']}"
            )

    return shipments
