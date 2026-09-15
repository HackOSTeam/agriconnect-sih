import os
import sys
import time
import logging
import joblib
import numpy as np
import pandas as pd
from prophet import Prophet
import xgboost as xgb
from sklearn.multioutput import MultiOutputRegressor

# Suppress Prophet & cmdstanpy logging output for clean execution
logging.getLogger('cmdstanpy').setLevel(logging.ERROR)
logging.getLogger('prophet').setLevel(logging.ERROR)

# Add parent directory to sys.path if not present
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from src.evaluate import calculate_metrics, log_evaluation_metrics
except ImportError:
    from evaluate import calculate_metrics, log_evaluation_metrics

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")


class TargetScaler:
    """
    MinMax target scaler to normalize series values to [0, 1] range.
    Enables consistent model convergence across commodities with different price/volume scales.
    """
    def __init__(self, eps: float = 1e-8):
        self.min_val = 0.0
        self.max_val = 1.0
        self.eps = eps

    def fit_transform(self, y: np.ndarray) -> np.ndarray:
        y_arr = np.asarray(y, dtype=float)
        self.min_val = float(np.min(y_arr))
        self.max_val = float(np.max(y_arr))
        range_val = self.max_val - self.min_val
        if range_val < self.eps:
            range_val = 1.0
        return (y_arr - self.min_val) / range_val

    def transform(self, y: np.ndarray) -> np.ndarray:
        y_arr = np.asarray(y, dtype=float)
        range_val = self.max_val - self.min_val
        if range_val < self.eps:
            range_val = 1.0
        return (y_arr - self.min_val) / range_val

    def inverse_transform(self, y_scaled: np.ndarray) -> np.ndarray:
        y_arr = np.asarray(y_scaled, dtype=float)
        range_val = self.max_val - self.min_val
        if range_val < self.eps:
            range_val = 1.0
        return y_arr * range_val + self.min_val


# ---------------------------------------------------------
# Prophet Forecasting Model
# ---------------------------------------------------------
def train_prophet_model(df: pd.DataFrame, scaler: TargetScaler) -> Prophet:
    """
    Train Facebook Prophet model on normalized time series [ds, y].
    Deterministic configuration for daily agricultural prices & arrival quantities.
    """
    scaled_df = df[['ds']].copy()
    scaled_df['y'] = scaler.transform(df['y'].values)

    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=True,
        seasonality_mode='multiplicative',
        changepoint_prior_scale=0.05,
        interval_width=0.95
    )
    # Fit model on scaled historical data
    model.fit(scaled_df)
    return model


def predict_prophet(model: Prophet, scaler: TargetScaler, horizon_days: int) -> pd.DataFrame:
    """
    Generate future predictions for horizon_days using trained Prophet model.
    Inverse-transforms predictions back to physical units.
    """
    future = model.make_future_dataframe(periods=horizon_days, freq='D')
    forecast = model.predict(future)

    # Inverse transform predictions back to original units
    forecast['yhat'] = scaler.inverse_transform(forecast['yhat'].values).clip(min=0)
    forecast['yhat_lower'] = scaler.inverse_transform(forecast['yhat_lower'].values).clip(min=0)
    forecast['yhat_upper'] = scaler.inverse_transform(forecast['yhat_upper'].values).clip(min=0)

    return forecast[['ds', 'yhat', 'yhat_lower', 'yhat_upper']]


# ---------------------------------------------------------
# XGBoost Direct Multi-Step Forecasting Model
# ---------------------------------------------------------
def create_xgb_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Generate calendar and lag features for XGBoost regression.
    """
    data = df.copy()
    data['month'] = data['ds'].dt.month
    data['dayofweek'] = data['ds'].dt.dayofweek
    data['dayofyear'] = data['ds'].dt.dayofyear

    # Lag features
    data['lag_1'] = data['y'].shift(1)
    data['lag_7'] = data['y'].shift(7)
    data['lag_14'] = data['y'].shift(14)
    data['lag_30'] = data['y'].shift(30)

    # Rolling statistics
    data['rolling_mean_7'] = data['y'].shift(1).rolling(window=7).mean()
    data['rolling_std_7'] = data['y'].shift(1).rolling(window=7).std()
    data['rolling_mean_30'] = data['y'].shift(1).rolling(window=30).mean()

    return data


def train_xgboost_model(df: pd.DataFrame, scaler: TargetScaler, horizon_days: int = 30):
    """
    Train a Direct Multi-Output XGBoost model on normalized features.
    Trains a single MultiOutputRegressor that predicts all horizon steps simultaneously,
    eliminating recursive compounding error accumulation.
    """
    scaled_df = df[['ds']].copy()
    scaled_df['y'] = scaler.transform(df['y'].values)

    feat_df = create_xgb_features(scaled_df).dropna().reset_index(drop=True)
    feature_cols = ['month', 'dayofweek', 'dayofyear', 'lag_1', 'lag_7', 'lag_14', 'lag_30',
                    'rolling_mean_7', 'rolling_std_7', 'rolling_mean_30']

    X = feat_df[feature_cols].values

    # Build direct multi-step target matrix: each column = t+1, t+2, ..., t+horizon prediction
    y_scaled_vals = scaled_df['y'].values
    n = len(feat_df)
    feat_start_idx = len(scaled_df) - n  # offset due to dropna
    y_multi_rows = []
    valid_x_rows = []
    for i in range(n):
        orig_idx = feat_start_idx + i
        future_indices = [orig_idx + h for h in range(1, horizon_days + 1)]
        if max(future_indices) < len(y_scaled_vals):
            y_multi_rows.append([y_scaled_vals[j] for j in future_indices])
            valid_x_rows.append(X[i])

    X_valid = np.array(valid_x_rows)
    y_multi = np.array(y_multi_rows)

    base_model = xgb.XGBRegressor(
        n_estimators=150,
        learning_rate=0.05,
        max_depth=5,
        random_state=42,
        subsample=0.8,
        colsample_bytree=0.8,
        verbosity=0
    )
    model = MultiOutputRegressor(base_model, n_jobs=-1)
    model.fit(X_valid, y_multi)

    # Residual std: average across all horizon outputs on training data
    y_pred_train = model.predict(X_valid)
    residual_std = float(np.std(y_multi - y_pred_train))

    return model, feature_cols, residual_std


def predict_xgboost_direct(model, feature_cols: list, residual_std: float, scaler: TargetScaler, df: pd.DataFrame, horizon_days: int) -> pd.DataFrame:
    """
    Generate all horizon_days forecasts in a single forward pass using the direct multi-output model.
    No recursive accumulation — each step is independently predicted from the same feature row.
    Inverse-transforms forecasts to physical units.
    """
    scaled_series = df[['ds']].copy()
    scaled_series['y'] = scaler.transform(df['y'].values)

    # Build features from last row of known history
    feat_df = create_xgb_features(scaled_series)
    last_row = feat_df.iloc[-1][feature_cols].values.reshape(1, -1)

    # Predict all horizon steps in one shot
    preds_scaled = model.predict(last_row)[0]  # shape (horizon_days,) or (max_horizon,)
    preds_scaled = preds_scaled[:horizon_days]

    last_date = df['ds'].iloc[-1]
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=horizon_days, freq='D')

    # Confidence intervals with growing uncertainty
    horizon_factor = np.sqrt(np.arange(1, horizon_days + 1))
    margin_scaled = 1.96 * residual_std * (1.0 + 0.04 * horizon_factor)

    yhat_lower_scaled = np.maximum(0, preds_scaled - margin_scaled)
    yhat_upper_scaled = preds_scaled + margin_scaled

    # Inverse transform to original physical units
    yhat = scaler.inverse_transform(preds_scaled).clip(min=0)
    yhat_lower = scaler.inverse_transform(yhat_lower_scaled).clip(min=0)
    yhat_upper = scaler.inverse_transform(yhat_upper_scaled).clip(min=0)

    result = pd.DataFrame({
        'ds': future_dates,
        'yhat': yhat,
        'yhat_lower': yhat_lower,
        'yhat_upper': yhat_upper
    })

    # Prepend historical actual values for seamless Plotly rendering
    hist_result = pd.DataFrame({
        'ds': df['ds'].values,
        'yhat': df['y'].values,
        'yhat_lower': df['y'].values,
        'yhat_upper': df['y'].values
    })

    combined = pd.concat([hist_result, result], ignore_index=True)
    return combined


# ---------------------------------------------------------
# Training & Caching Pipeline Interface
# ---------------------------------------------------------
def train_and_evaluate(df: pd.DataFrame, commodity: str, market: str, model_type: str = "prophet", target_col: str = "modal_price", test_ratio: float = 0.15) -> dict:
    """
    Train model with target-scaling, evaluate metrics on holdout test set, and save cached joblib artifact with target-aware naming.
    """
    os.makedirs(MODEL_DIR, exist_ok=True)
    t0 = time.time()

    n_samples = len(df)
    test_size = max(7, int(n_samples * test_ratio))
    train_df = df.iloc[:-test_size].copy()
    test_df = df.iloc[-test_size:].copy()

    # Fit target scaler on full dataset
    scaler = TargetScaler()
    scaler.fit_transform(df['y'].values)

    if model_type.lower() == "prophet":
        # Fit train split scaler & model to evaluate holdout
        train_scaler = TargetScaler()
        train_scaler.fit_transform(train_df['y'].values)
        eval_model = train_prophet_model(train_df, train_scaler)
        eval_forecast = predict_prophet(eval_model, train_scaler, horizon_days=test_size)
        test_pred = eval_forecast.iloc[-test_size:]['yhat'].values

        # Fit full production model
        full_model = train_prophet_model(df, scaler)
        model_artifact = {
            "model": full_model,
            "scaler": scaler,
            "type": "prophet"
        }

    elif model_type.lower() == "xgboost":
        train_scaler = TargetScaler()
        train_scaler.fit_transform(train_df['y'].values)
        # Use max_horizon=test_size for holdout evaluation training
        eval_model, feature_cols, residual_std = train_xgboost_model(train_df, train_scaler, horizon_days=test_size)
        eval_forecast = predict_xgboost_direct(eval_model, feature_cols, residual_std, train_scaler, train_df, horizon_days=test_size)
        test_pred = eval_forecast.iloc[-test_size:]['yhat'].values

        # Production model trained with max horizon of 30 days for flexible forecasting
        full_model, feature_cols, residual_std = train_xgboost_model(df, scaler, horizon_days=30)
        model_artifact = {
            "model": full_model,
            "feature_cols": feature_cols,
            "residual_std": residual_std,
            "scaler": scaler,
            "type": "xgboost"
        }
    else:
        raise ValueError(f"Unsupported model type: '{model_type}'")

    metrics = calculate_metrics(test_df['y'].values, test_pred)
    elapsed_sec = time.time() - t0

    log_evaluation_metrics(commodity, market, f"{model_type}_{target_col}", metrics, elapsed_sec)

    # Save joblib model artifact with target_col in filename to prevent cache contamination
    artifact_filename = f"{commodity.lower()}_{market.lower()}_{target_col.lower()}_{model_type.lower()}.joblib"
    artifact_path = os.path.join(MODEL_DIR, artifact_filename)
    joblib.dump(model_artifact, artifact_path)

    return {
        "metrics": metrics,
        "test_df": test_df,
        "test_pred": test_pred,
        "model_artifact": model_artifact,
        "artifact_path": artifact_path,
        "training_time": elapsed_sec
    }


def get_forecast(df: pd.DataFrame, commodity: str, market: str, model_type: str = "prophet", horizon_days: int = 14, target_col: str = "modal_price", force_retrain: bool = False) -> dict:
    """
    Get forecast for horizon_days using cached model or fresh evaluation.
    Target-aware filename isolates price and quantity model artifacts.
    """
    artifact_filename = f"{commodity.lower()}_{market.lower()}_{target_col.lower()}_{model_type.lower()}.joblib"
    artifact_path = os.path.join(MODEL_DIR, artifact_filename)

    metrics = None
    test_df = None
    test_pred = None

    if force_retrain or not os.path.exists(artifact_path):
        res = train_and_evaluate(df, commodity, market, model_type, target_col=target_col)
        model_artifact = res["model_artifact"]
        metrics = res["metrics"]
        test_df = res["test_df"]
        test_pred = res["test_pred"]
    else:
        try:
            model_artifact = joblib.load(artifact_path)
            # --- OPTIMIZATION: Inference-only holdout evaluation from cached model ---
            # No refit. Use the loaded production model to predict holdout split directly.
            n_samples = len(df)
            test_size = max(7, int(n_samples * 0.15))
            test_df = df.iloc[-test_size:].copy()
            train_df_for_eval = df.iloc[:-test_size].copy()
            scaler_cached = model_artifact["scaler"]
            if model_artifact["type"] == "prophet":
                eval_forecast = predict_prophet(model_artifact["model"], scaler_cached, horizon_days=test_size)
                test_pred = eval_forecast.iloc[-test_size:]['yhat'].values
            else:
                eval_forecast = predict_xgboost_direct(
                    model_artifact["model"],
                    model_artifact["feature_cols"],
                    model_artifact["residual_std"],
                    scaler_cached,
                    train_df_for_eval,
                    horizon_days=test_size
                )
                test_pred = eval_forecast.iloc[-test_size:]['yhat'].values
            metrics = calculate_metrics(test_df['y'].values, test_pred)
        except Exception:
            res = train_and_evaluate(df, commodity, market, model_type, target_col=target_col)
            model_artifact = res["model_artifact"]
            metrics = res["metrics"]
            test_df = res["test_df"]
            test_pred = res["test_pred"]

    scaler = model_artifact["scaler"]

    # Generate future forecast dataframe
    if model_artifact["type"] == "prophet":
        forecast_df = predict_prophet(model_artifact["model"], scaler, horizon_days=horizon_days)
    else:
        forecast_df = predict_xgboost_direct(
            model_artifact["model"],
            model_artifact["feature_cols"],
            model_artifact["residual_std"],
            scaler,
            df,
            horizon_days=horizon_days
        )

    return {
        "forecast_df": forecast_df,
        "metrics": metrics,
        "test_df": test_df,
        "test_pred": test_pred
    }


if __name__ == "__main__":
    from src.data_loader import load_raw_data, preprocess_series
    raw = load_raw_data()
    series = preprocess_series(raw, "Tomato", "Pune", target_col="modal_price")

    print("--- Training Prophet Model (Modal Price) ---")
    p_res = get_forecast(series, "Tomato", "Pune", model_type="prophet", horizon_days=14, target_col="modal_price", force_retrain=True)
    print("Prophet Metrics:", p_res["metrics"])
    print("Prophet Forecast Tail:\n", p_res["forecast_df"].tail())

    print("\n--- Training XGBoost Model (Modal Price) ---")
    x_res = get_forecast(series, "Tomato", "Pune", model_type="xgboost", horizon_days=14, target_col="modal_price", force_retrain=True)
    print("XGBoost Metrics:", x_res["metrics"])
    print("XGBoost Forecast Tail:\n", x_res["forecast_df"].tail())
