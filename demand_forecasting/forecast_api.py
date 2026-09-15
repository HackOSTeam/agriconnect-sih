"""
forecast_api.py  ─  AgriConnect × Demand Forecasting Bridge
============================================================
A lightweight FastAPI service that wraps the Prophet + XGBoost
forecasting engine and exposes farmer / consumer-friendly insight
endpoints consumed by the AgriConnect frontend.

How to run (standalone, port 8001):
    uvicorn forecast_api:app --host 0.0.0.0 --port 8001 --reload

Or import and mount into AgriConnect backend/main.py:
    from forecast_api import forecast_router
    app.include_router(forecast_router)
"""

import os
import sys
import logging

from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List

# ---------------------------------------------------------------------------
# Path bootstrap — make demand_forecasting src importable whether this file
# lives in demand_forecasting/ root OR is imported from backend/main.py
# ---------------------------------------------------------------------------
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
if _THIS_DIR not in sys.path:
    sys.path.insert(0, _THIS_DIR)

try:
    from src.data_loader import load_raw_data, get_available_commodities, get_available_markets, preprocess_series
    from src.model import get_forecast
except ImportError as e:
    raise RuntimeError(
        f"Cannot import demand_forecasting src modules. "
        f"Make sure forecast_api.py is placed inside the demand_forecasting/ folder. "
        f"Original error: {e}"
    )

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("forecast_api")

# ---------------------------------------------------------------------------
# Pre-load data once at startup (shared across all requests)
# ---------------------------------------------------------------------------
_raw_df = None

def _get_raw_df():
    global _raw_df
    if _raw_df is None:
        _raw_df = load_raw_data()
    return _raw_df


# ---------------------------------------------------------------------------
# Pydantic request model
# ---------------------------------------------------------------------------
class ForecastRequest(BaseModel):
    commodity: str
    market: str
    horizon_days: int = 14
    target: str = "modal_price"   # "modal_price" | "arrival_quantity"
    model_type: str = "prophet"   # "prophet" | "xgboost"


# ---------------------------------------------------------------------------
# Helper: build the user-friendly insight dict (no math exposed)
# ---------------------------------------------------------------------------
def _build_insight(
    commodity: str,
    market: str,
    horizon_days: int,
    target: str,
    model_type: str,
) -> dict:
    raw_df = _get_raw_df()
    processed_df = preprocess_series(raw_df, commodity, market, target_col=target)

    res = get_forecast(
        df=processed_df,
        commodity=commodity,
        market=market,
        model_type=model_type,
        horizon_days=horizon_days,
        target_col=target,
        force_retrain=False,
    )

    forecast_df = res["forecast_df"]
    hist_last_date = processed_df["ds"].iloc[-1]
    hist_last_val = float(processed_df["y"].iloc[-1])

    future_df = forecast_df[forecast_df["ds"] > hist_last_date].copy()
    if future_df.empty:
        raise ValueError("Forecast produced no future data points.")

    # Sparkline — daily predicted values for the horizon
    sparkline = [round(float(v), 1) for v in future_df["yhat"].tolist()]

    predicted_end = float(future_df["yhat"].iloc[-1])
    price_change = predicted_end - hist_last_val
    pct_change = (price_change / hist_last_val * 100) if hist_last_val != 0 else 0.0

    # Price direction category
    if pct_change > 3:
        direction = "rising"
    elif pct_change < -3:
        direction = "falling"
    else:
        direction = "stable"

    # Confidence band — price range for the forecast horizon
    band_low = round(float(future_df["yhat_lower"].min()), 1)
    band_high = round(float(future_df["yhat_upper"].max()), 1)

    # Supply pressure (arrival quantity heuristic)
    try:
        arr_df = preprocess_series(raw_df, commodity, market, target_col="arrival_quantity")
        arr_res = get_forecast(
            df=arr_df,
            commodity=commodity,
            market=market,
            model_type="prophet",
            horizon_days=horizon_days,
            target_col="arrival_quantity",
            force_retrain=False,
        )
        arr_future = arr_res["forecast_df"][arr_res["forecast_df"]["ds"] > hist_last_date]
        arr_mean_hist = float(arr_df["y"].mean())
        arr_mean_fut = float(arr_future["yhat"].mean()) if not arr_future.empty else arr_mean_hist
        supply_ratio = arr_mean_fut / arr_mean_hist if arr_mean_hist > 0 else 1.0
        if supply_ratio > 1.15:
            supply_pressure = "high"
        elif supply_ratio < 0.85:
            supply_pressure = "low"
        else:
            supply_pressure = "moderate"
    except Exception:
        supply_pressure = "moderate"

    # Farmer advice
    if target == "modal_price":
        if direction == "rising":
            advice_farmer = (
                f"Hold stock if you have storage — {commodity} prices at {market} are projected "
                f"to rise by ₹{abs(price_change):,.0f} ({abs(pct_change):.1f}%) over {horizon_days} days."
            )
            advice_buyer = (
                f"Prices are expected to rise. Procure bulk early to lock in current rates."
            )
        elif direction == "falling":
            advice_farmer = (
                f"Consider selling now — {commodity} prices may ease by "
                f"₹{abs(price_change):,.0f} ({abs(pct_change):.1f}%) over {horizon_days} days."
            )
            advice_buyer = (
                f"Prices are expected to soften. Buy on demand and avoid large early stocking."
            )
        else:
            advice_farmer = (
                f"{commodity} prices at {market} are expected to remain stable "
                f"over the next {horizon_days} days. Good time for steady sales."
            )
            advice_buyer = (
                f"Market is stable. Buy as per regular demand — no sharp price swings expected."
            )
    else:
        if direction == "rising":
            advice_farmer = f"Arrival volumes are expected to increase — plan logistics and storage capacity."
            advice_buyer = f"Higher supply expected. Good procurement window."
        elif direction == "falling":
            advice_farmer = f"Supply may tighten — consider adjusting pricing upward."
            advice_buyer = f"Lower arrivals expected. Secure stock early to avoid shortage."
        else:
            advice_farmer = f"Supply levels are projected to remain stable over {horizon_days} days."
            advice_buyer = f"Supply is steady. Regular procurement schedule is fine."

    is_price = target == "modal_price"
    unit = "₹/Quintal" if is_price else "Tonnes"

    return {
        "commodity": commodity,
        "market": market,
        "horizon_days": horizon_days,
        "target": target,
        "unit": unit,
        "current_value": round(hist_last_val, 1),
        "predicted_value": round(predicted_end, 1),
        "change_amount": round(price_change, 1),
        "change_pct": round(pct_change, 1),
        "direction": direction,             # "rising" | "falling" | "stable"
        "supply_pressure": supply_pressure, # "high" | "moderate" | "low"
        "price_band": {"low": band_low, "high": band_high},
        "sparkline": sparkline,
        "advice_farmer": advice_farmer,
        "advice_buyer": advice_buyer,
        "data_source": "AGMARKNET / data.gov.in (NDSAP)",
    }


# ---------------------------------------------------------------------------
# Router (re-usable when mounted into AgriConnect main.py)
# ---------------------------------------------------------------------------
forecast_router = APIRouter(prefix="/api/forecast", tags=["Demand Forecasting"])


@forecast_router.get("/commodities", summary="List available commodities")
def list_commodities():
    """Return sorted list of commodities present in the AGMARKNET dataset."""
    try:
        raw_df = _get_raw_df()
        return {"commodities": get_available_commodities(raw_df)}
    except Exception as e:
        logger.error(f"Failed to list commodities: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@forecast_router.get("/markets", summary="List markets for a commodity")
def list_markets(commodity: str = Query(..., description="Commodity name, e.g. Tomato")):
    """Return sorted list of mandi markets for a given commodity."""
    try:
        raw_df = _get_raw_df()
        markets = get_available_markets(raw_df, commodity)
        if not markets:
            raise HTTPException(status_code=404, detail=f"No markets found for commodity '{commodity}'")
        return {"commodity": commodity, "markets": markets}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to list markets for {commodity}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@forecast_router.post("/predict", summary="Get farmer/buyer-friendly price forecast")
def predict_forecast(req: ForecastRequest):
    """
    Run the AI forecast and return a user-friendly insight card.
    No raw statistics are exposed — only direction, advice, and sparkline.
    """
    valid_targets = ["modal_price", "arrival_quantity"]
    if req.target not in valid_targets:
        raise HTTPException(status_code=400, detail=f"target must be one of {valid_targets}")
    if req.horizon_days < 7 or req.horizon_days > 30:
        raise HTTPException(status_code=400, detail="horizon_days must be between 7 and 30")

    try:
        insight = _build_insight(
            commodity=req.commodity,
            market=req.market,
            horizon_days=req.horizon_days,
            target=req.target,
            model_type=req.model_type,
        )
        return insight
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Forecast error for {req.commodity}/{req.market}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Forecast engine error: {str(e)}")


@forecast_router.get("/quick", summary="Quick forecast for a single commodity+market")
def quick_forecast(
    commodity: str = Query(...),
    market: str = Query(...),
    horizon_days: int = Query(14, ge=7, le=30),
    target: str = Query("modal_price"),
):
    """GET version of /predict for easy frontend use without a request body."""
    try:
        insight = _build_insight(commodity, market, horizon_days, target, "prophet")
        return insight
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Quick forecast error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Standalone app (when run directly: uvicorn forecast_api:app --port 8001)
# ---------------------------------------------------------------------------
app = FastAPI(
    title="AgriConnect Demand Forecasting API",
    description="AI price & arrival forecasting for farmers and buyers.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(forecast_router)


@app.get("/")
def health():
    return {"status": "ok", "service": "AgriConnect Forecast API", "version": "1.0.0"}
