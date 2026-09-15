import os
import json
import numpy as np
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
LOG_PATH = os.path.join(MODEL_DIR, "training_log.json")

def calculate_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    """
    Calculate MAE, MAPE (%), RMSE, SMAPE (%), and NMAE (%) evaluation metrics.
    SMAPE & NMAE provide scale-independent comparative accuracy across commodities and markets.
    """
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    
    # Avoid division by zero in MAPE
    mask = y_true != 0
    if not np.any(mask):
        mape = 0.0
    else:
        mape = np.mean(np.abs((y_true[mask] - y_pred[mask]) / y_true[mask])) * 100.0
        
    mae = np.mean(np.abs(y_true - y_pred))
    rmse = np.sqrt(np.mean((y_true - y_pred) ** 2))
    
    # Symmetric MAPE (SMAPE)
    denom = (np.abs(y_true) + np.abs(y_pred)) / 2.0
    valid_denom = denom != 0
    if not np.any(valid_denom):
        smape = 0.0
    else:
        smape = np.mean(np.abs(y_true[valid_denom] - y_pred[valid_denom]) / denom[valid_denom]) * 50.0
        
    # Normalized MAE (NMAE = MAE / mean(y_true))
    mean_true = np.mean(np.abs(y_true))
    nmae = (mae / mean_true * 100.0) if mean_true != 0 else 0.0
    
    return {
        "MAE": round(float(mae), 2),
        "MAPE": round(float(mape), 2),
        "RMSE": round(float(rmse), 2),
        "SMAPE": round(float(smape), 2),
        "NMAE": round(float(nmae), 2)
    }

def log_evaluation_metrics(commodity: str, market: str, model_name: str, metrics: dict, training_time_sec: float):
    """
    Persists model evaluation metrics to a JSON log file.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    entry = {
        "timestamp": pd.Timestamp.now().isoformat(),
        "commodity": commodity,
        "market": market,
        "model": model_name,
        "metrics": metrics,
        "training_time_sec": round(training_time_sec, 3)
    }
    
    logs = []
    if os.path.exists(LOG_PATH):
        try:
            with open(LOG_PATH, "r") as f:
                logs = json.load(f)
        except Exception:
            logs = []
            
    logs.append(entry)
    with open(LOG_PATH, "w") as f:
        json.dump(logs, f, indent=2)

if __name__ == "__main__":
    y_true = np.array([2000, 2100, 2200, 2150, 2300])
    y_pred = np.array([2050, 2080, 2180, 2200, 2250])
    res = calculate_metrics(y_true, y_pred)
    print("Sample Metrics:", res)
