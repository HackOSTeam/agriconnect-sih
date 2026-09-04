# Agricultural Demand & Price Forecasting Module (SIH 2026, PS 26033)

Standalone AI-driven price and arrival demand forecasting tool for agricultural commodities in Indian markets, built for the **Smart India Hackathon 2026 (Problem Statement 26033)**.

---

## 📌 Data Provenance & Citation

> [!IMPORTANT]
> **Authorized Government Dataset Citation**
> - **Dataset Name:** Current Daily Price of Various Commodities from Various Markets (Mandi)
> - **Primary Source:** AGMARKNET Portal, Directorate of Marketing & Inspection, Ministry of Agriculture & Farmers Welfare, Government of India.
> - **Data Access Platform:** [data.gov.in](https://data.gov.in/) (Open Government Data OGD Platform India).
> - **Governing Policy:** National Data Sharing and Accessibility Policy (NDSAP).
> - **Export Date:** August 31, 2026.
> - **Storage Location:** `data/raw_prices.csv` (local deterministic dataset archive).

---

## 🚀 Quickstart - How to Run

To launch the interactive GUI in 1 command:

```bash
# Navigate into the demand_forecasting folder
cd demand_forecasting

# Run the Streamlit application
streamlit run app.py
```

---

## 📂 Project Architecture

```
demand_forecasting/
├── data/
│   └── raw_prices.csv          # Authentic AGMARKNET daily market price archive
├── src/
│   ├── __init__.py             # Package initializer
│   ├── data_loader.py          # Data cleaning, reindexing, gap interpolation
│   ├── model.py                # Prophet & XGBoost model training, prediction, joblib caching
│   └── evaluate.py             # MAE, MAPE, RMSE evaluation metrics calculation
├── models/                     # Saved joblib model artifacts & evaluation logs
├── app.py                      # Interactive Streamlit GUI application
├── requirements.txt            # Dependency specification
└── README.md                   # Documentation & dataset citation
```

---

## ⚙️ Model Architecture & Features

1. **Primary Forecasting Algorithm (Facebook Prophet)**:
   - Captures weekly and yearly agricultural price seasonality, harvest cycles, and market trend shifts.
   - Outputs 95% confidence intervals (`yhat_lower`, `yhat_upper`).
2. **Fallback / Comparison Algorithm (XGBoost Regression)**:
   - Uses temporal lag features (`lag_1`, `lag_7`, `lag_14`, `lag_30`, `rolling_mean_7`) to model price momentum.
   - Multi-step recursive forecasting with residual uncertainty estimation.
3. **Deterministic & Cached Performance**:
   - Fixed random seeds ensure identical inputs yield identical predictions every execution.
   - Models are serialized to disk (`models/*.joblib`) to eliminate redundant retraining during GUI interactions.
4. **Evaluation Metrics**:
   - Evaluated on holdout test set (last 15% chronological split):
     - **MAE** (Mean Absolute Error)
     - **MAPE** (Mean Absolute Percentage Error - typically ~5-10%)

---

## 🛠️ Backend API Integration Guide

This standalone module is designed for direct backend consumption. To query predictions from FastAPI or Django:

```python
from src.data_loader import load_raw_data, preprocess_series
from src.model import get_forecast

# 1. Load cleaned market series
raw_df = load_raw_data("data/raw_prices.csv")
series = preprocess_series(raw_df, commodity="Tomato", market="Pune")

# 2. Generate 14-day price forecast
res = get_forecast(series, commodity="Tomato", market="Pune", model_type="prophet", horizon_days=14)

forecast_df = res["forecast_df"]  # DataFrame with ['ds', 'yhat', 'yhat_lower', 'yhat_upper']
metrics = res["metrics"]          # Dict with {'MAE': float, 'MAPE': float}
```
