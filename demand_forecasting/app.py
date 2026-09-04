import os
import sys
import pandas as pd
import numpy as np
import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
from datetime import datetime

# Add module path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.data_loader import load_raw_data, get_available_commodities, get_available_markets, preprocess_series
from src.model import get_forecast

# ---------------------------------------------------------
# Streamlit Page Configuration & Clean High-Visibility Theme
# ---------------------------------------------------------
st.set_page_config(
    page_title="AgriDemand AI - Demand & Price Forecasting",
    page_icon="🌾",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Simple, High-Visibility Dark Styling
st.markdown("""
    <style>
    /* Main Canvas Background & Base Text */
    .stApp {
        background-color: #0f172a;
        color: #f8fafc;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #1e293b !important;
        border-right: 1px solid #334155;
    }
    
    /* High-Visibility Metric Cards */
    .stMetric {
        background-color: #1e293b;
        border: 1px solid #475569;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .stMetricLabel {
        color: #cbd5e1 !important;
        font-size: 0.85rem !important;
        font-weight: 700 !important;
        text-transform: uppercase;
    }
    .stMetricValue {
        color: #38bdf8 !important;
        font-size: 1.75rem !important;
        font-weight: 800 !important;
    }
    
    /* Provenance Banner */
    .provenance-card {
        background-color: #1e293b;
        border-left: 5px solid #0284c7;
        border-right: 1px solid #334155;
        border-top: 1px solid #334155;
        border-bottom: 1px solid #334155;
        padding: 14px 18px;
        border-radius: 6px;
        margin-bottom: 20px;
        font-size: 0.92rem;
        color: #f1f5f9;
        line-height: 1.5;
    }
    
    /* Insight & Callout Card */
    .insight-card {
        background-color: #1e293b;
        border: 1px solid #38bdf8;
        padding: 18px;
        border-radius: 8px;
        margin-top: 15px;
        margin-bottom: 15px;
        color: #f8fafc;
    }
    
    .badge-gov {
        background-color: #0284c7;
        color: #ffffff;
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        display: inline-block;
        margin-bottom: 8px;
    }
    </style>
""", unsafe_allow_html=True)

# Header Section
st.markdown('<span class="badge-gov">Authorized Data Source: AGMARKNET / data.gov.in (NDSAP)</span>', unsafe_allow_html=True)
st.title("🌾 Agricultural Demand & Price Forecasting Module")
st.caption("SIH 2026 (PS 26033) - Standalone Predictive Analytics Engine")

# Data Provenance Banner
st.markdown("""
<div class="provenance-card">
    <b>🏛️ Data Citation & Provenance:</b> Standardized official dataset sourced from Directorate of Marketing & Inspection (AGMARKNET portal, Ministry of Agriculture & Farmers Welfare, Govt. of India) via <b>data.gov.in</b>. The model runs deterministically against local cached market records.
</div>
""", unsafe_allow_html=True)

# ---------------------------------------------------------
# Data Ingestion with Streamlit Caching
# ---------------------------------------------------------
@st.cache_data
def fetch_data():
    try:
        return load_raw_data()
    except Exception as e:
        st.error(f"Failed to load dataset: {str(e)}")
        return None

raw_df = fetch_data()

if raw_df is None or raw_df.empty:
    st.error("No data available to train forecasting models. Please ensure `data/raw_prices.csv` exists.")
    st.stop()

# ---------------------------------------------------------
# Sidebar Controls
# ---------------------------------------------------------
st.sidebar.markdown("### ⚙️ Forecast Controls")

commodities = get_available_commodities(raw_df)
selected_commodity = st.sidebar.selectbox("Select Commodity", options=commodities, index=0)

markets = get_available_markets(raw_df, selected_commodity)
selected_market = st.sidebar.selectbox("Select Market / Mandi", options=markets, index=0)

target_metric = st.sidebar.radio(
    "Target Variable",
    options=["Modal Price (₹/Quintal)", "Arrival Quantity (Tonnes)"],
    index=0
)
target_col = "modal_price" if "Modal Price" in target_metric else "arrival_quantity"
unit_str = "₹/Quintal" if target_col == "modal_price" else "Tonnes"

horizon_days = st.sidebar.slider("Forecast Horizon (Days)", min_value=7, max_value=30, value=14, step=1)

model_choice = st.sidebar.selectbox(
    "Forecasting Algorithm",
    options=["Prophet (Recommended)", "XGBoost (Fallback)", "Compare Both Models"],
    index=0
)

# Visual Overlay Toggles
st.sidebar.markdown("---")
st.sidebar.markdown("### 📍 Chart Display Layers")
show_harvest_markers = st.sidebar.checkbox("🌾 Show Harvest Season Markers", value=True)
show_climate_markers = st.sidebar.checkbox("🌧️ Show Climate/Monsoon Shortages", value=True)
show_confidence_band = st.sidebar.checkbox("🛡️ Show 95% Confidence Band", value=True)

force_retrain = st.sidebar.checkbox("Force Retrain Model", value=False, help="Bypasses joblib cache and retrains the model.")
run_button = st.sidebar.button("🚀 Refresh Forecast", use_container_width=True, type="primary")

# ---------------------------------------------------------
# Processing & Forecasting
# ---------------------------------------------------------
try:
    processed_df = preprocess_series(raw_df, selected_commodity, selected_market, target_col=target_col)
except Exception as e:
    st.error(f"Input Validation Error: {str(e)}")
    st.stop()

model_type_key = "prophet" if "Prophet" in model_choice else ("xgboost" if "XGBoost" in model_choice else "compare")

with st.spinner(f"Computing forecast for {selected_commodity} at {selected_market}..."):
    if model_type_key in ["prophet", "xgboost"]:
        forecast_res = get_forecast(
            df=processed_df,
            commodity=selected_commodity,
            market=selected_market,
            model_type=model_type_key,
            horizon_days=horizon_days,
            target_col=target_col,
            force_retrain=force_retrain
        )
        secondary_res = None
    else:
        forecast_res = get_forecast(processed_df, selected_commodity, selected_market, "prophet", horizon_days, target_col=target_col, force_retrain=force_retrain)
        secondary_res = get_forecast(processed_df, selected_commodity, selected_market, "xgboost", horizon_days, target_col=target_col, force_retrain=force_retrain)

metrics = forecast_res["metrics"]
forecast_df = forecast_res["forecast_df"]

hist_last_date = processed_df['ds'].iloc[-1]
hist_last_val = processed_df['y'].iloc[-1]

future_df = forecast_df[forecast_df['ds'] > hist_last_date]
end_pred_val = future_df['yhat'].iloc[-1]
price_change = end_pred_val - hist_last_val
pct_change = (price_change / hist_last_val) * 100

# ---------------------------------------------------------
# Executive Summary Metrics Panel
# ---------------------------------------------------------
st.markdown(f"### 📊 Dashboard Summary — {selected_commodity} ({selected_market} Mandi)")

c1, c2, c3, c4, c5, c6 = st.columns(6)
with c1:
    st.metric("Latest Observed", f"{hist_last_val:,.1f} {unit_str}")
with c2:
    st.metric(
        f"{horizon_days}-Day Target",
        f"{end_pred_val:,.1f} {unit_str}",
        delta=f"{price_change:+.1f} ({pct_change:+.1f}%)"
    )
with c3:
    st.metric("MAE (Avg Error)", f"{metrics['MAE']} {unit_str}")
with c4:
    st.metric("SMAPE (Symmetric %)", f"{metrics.get('SMAPE', metrics['MAPE'])}%")
with c5:
    st.metric("NMAE (Scale-Norm %)", f"{metrics.get('NMAE', 0.0)}%")
with c6:
    status_label = "Prophet" if model_type_key == "prophet" else ("XGBoost" if model_type_key == "xgboost" else "Prophet vs XGBoost")
    st.metric("Active Model", status_label)

st.markdown("---")

# ---------------------------------------------------------
# Main Interactive Plotly Chart with Clean Event Markers
# ---------------------------------------------------------
st.markdown("### 📈 Time Series Forecast & Seasonal Event Map")

fig = go.Figure()

# 1. Historical Actual Line (High visibility cyan)
fig.add_trace(go.Scatter(
    x=processed_df['ds'],
    y=processed_df['y'],
    mode='lines',
    name='Historical Actuals',
    line=dict(color='#38bdf8', width=2.5),
    hovertemplate='<b>Date:</b> %{x|%Y-%m-%d}<br><b>Observed:</b> %{y:,.1f} ' + unit_str + '<extra></extra>'
))

# 2. Validation Holdout Line
if forecast_res["test_df"] is not None and forecast_res["test_pred"] is not None:
    fig.add_trace(go.Scatter(
        x=forecast_res["test_df"]['ds'],
        y=forecast_res["test_pred"],
        mode='lines',
        name='Validation Fit (Holdout)',
        line=dict(color='#f59e0b', width=2, dash='dot'),
        hovertemplate='<b>Date:</b> %{x|%Y-%m-%d}<br><b>Holdout Fit:</b> %{y:,.1f} ' + unit_str + '<extra></extra>'
    ))

# 3. Future Horizon Forecast Line (Vibrant Emerald)
fig.add_trace(go.Scatter(
    x=future_df['ds'],
    y=future_df['yhat'],
    mode='lines+markers',
    name=f'{horizon_days}-Day AI Forecast',
    line=dict(color='#10b981', width=3.5),
    marker=dict(size=6, color='#34d399'),
    hovertemplate='<b>Forecast Date:</b> %{x|%Y-%m-%d}<br><b>Predicted:</b> %{y:,.1f} ' + unit_str + '<extra></extra>'
))

# 4. Confidence Interval Band
if show_confidence_band:
    fig.add_trace(go.Scatter(
        x=future_df['ds'],
        y=future_df['yhat_upper'],
        mode='lines',
        line=dict(width=0),
        showlegend=False,
        hoverinfo='skip'
    ))
    fig.add_trace(go.Scatter(
        x=future_df['ds'],
        y=future_df['yhat_lower'],
        mode='lines',
        fill='tonexty',
        fillcolor='rgba(16, 185, 129, 0.2)',
        name='95% Confidence Band',
        line=dict(width=0),
        hovertemplate='<b>95% Interval:</b> [%{y:,.1f} - Upper]<extra></extra>'
    ))

# 5. Secondary Model Comparison
if secondary_res is not None:
    sec_future = secondary_res["forecast_df"][secondary_res["forecast_df"]['ds'] > hist_last_date]
    fig.add_trace(go.Scatter(
        x=sec_future['ds'],
        y=sec_future['yhat'],
        mode='lines',
        name=f'XGBoost Comparison (MAPE: {secondary_res["metrics"]["MAPE"]}%)',
        line=dict(color='#ec4899', width=2.5, dash='dash'),
        hovertemplate='<b>XGBoost Forecast:</b> %{y:,.1f} ' + unit_str + '<extra></extra>'
    ))

# 6. High-Visibility Event Markers
if show_harvest_markers:
    harvest_months = [11, 12] if selected_commodity.lower() == "onion" else [1, 2]
    harvest_dates = processed_df[processed_df['ds'].dt.month.isin(harvest_months)].iloc[::45]
    if not harvest_dates.empty:
        fig.add_trace(go.Scatter(
            x=harvest_dates['ds'],
            y=harvest_dates['y'],
            mode='markers+text',
            name='🌾 Harvest Peak',
            marker=dict(size=11, color='#eab308', symbol='star', line=dict(color='#ffffff', width=1)),
            text=['Harvest Arrival Peak'] * len(harvest_dates),
            textposition="bottom center",
            textfont=dict(color="#fef08a", size=10),
            hovertemplate='<b>🌾 Harvest Season:</b> High supply arrival<extra></extra>'
        ))

if show_climate_markers:
    lean_months = [7, 8] if selected_commodity.lower() == "tomato" else [9, 10]
    lean_dates = processed_df[processed_df['ds'].dt.month.isin(lean_months)].iloc[::45]
    if not lean_dates.empty:
        fig.add_trace(go.Scatter(
            x=lean_dates['ds'],
            y=lean_dates['y'],
            mode='markers+text',
            name='🌧️ Monsoon Shortage',
            marker=dict(size=11, color='#ef4444', symbol='diamond', line=dict(color='#ffffff', width=1)),
            text=['Monsoon Shortage'] * len(lean_dates),
            textposition="top center",
            textfont=dict(color="#fca5a5", size=10),
            hovertemplate='<b>🌧️ Climate/Lean Shortage:</b> Supply deficit & price spike<extra></extra>'
        ))

# Vertical line separating history and forecast
fig.add_vline(
    x=hist_last_date.timestamp() * 1000,
    line_width=2,
    line_dash="dash",
    line_color="#38bdf8",
    annotation_text="← History | AI Forecast →",
    annotation_position="top left",
    annotation_font=dict(color="#38bdf8", size=11)
)

fig.update_layout(
    template='plotly_dark',
    paper_bgcolor='rgba(15, 23, 42, 0)',
    plot_bgcolor='rgba(30, 41, 59, 0.7)',
    height=520,
    margin=dict(l=20, r=20, t=50, b=20),
    legend=dict(
        orientation="h",
        yanchor="bottom",
        y=1.02,
        xanchor="right",
        x=1,
        font=dict(size=11, color="#f8fafc")
    ),
    xaxis=dict(
        showgrid=True,
        gridcolor='#334155',
        title="Calendar Date",
        tickfont=dict(color='#f8fafc')
    ),
    yaxis=dict(
        showgrid=True,
        gridcolor='#334155',
        title=f"{target_metric}",
        tickfont=dict(color='#f8fafc')
    ),
    hovermode='x unified'
)

st.plotly_chart(fig, use_container_width=True)

# ---------------------------------------------------------
# Data Visualizations & Analytical Tabs
# ---------------------------------------------------------
st.markdown("---")
st.markdown("### 🔍 Data Visuals & Market Intelligence")

tab_visual1, tab_visual2, tab_visual3, tab_table = st.tabs([
    "📊 Monthly Seasonality Distribution",
    "⚖️ Supply vs Price Correlation",
    "⚠️ Volatility & Risk Assessment",
    "📋 Forecast Table & CSV Export"
])

with tab_visual1:
    st.markdown("##### Monthly Price & Arrival Distribution (2024–2026)")
    monthly_df = processed_df.copy()
    monthly_df['Month_Name'] = monthly_df['ds'].dt.strftime('%b')
    monthly_df['Month_Num'] = monthly_df['ds'].dt.month
    monthly_df = monthly_df.sort_values('Month_Num')
    
    fig_month = px.box(
        monthly_df,
        x='Month_Name',
        y='y',
        color='Month_Name',
        points="outliers",
        labels={'y': target_metric, 'Month_Name': 'Month'},
        color_discrete_sequence=px.colors.sequential.Tealgrn
    )
    fig_month.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(15, 23, 42, 0)',
        plot_bgcolor='rgba(30, 41, 59, 0.5)',
        height=360,
        showlegend=False,
        margin=dict(l=10, r=10, t=30, b=10),
        xaxis=dict(tickfont=dict(color='#f8fafc')),
        yaxis=dict(tickfont=dict(color='#f8fafc'))
    )
    st.plotly_chart(fig_month, use_container_width=True)

with tab_visual2:
    st.markdown("##### Microeconomic Supply vs Price Correlation")
    p_df = preprocess_series(raw_df, selected_commodity, selected_market, "modal_price")
    a_df = preprocess_series(raw_df, selected_commodity, selected_market, "arrival_quantity")
    
    merged_series = pd.merge(p_df[['ds', 'y']], a_df[['ds', 'y']], on='ds', suffixes=('_price', '_arrival'))
    
    fig_corr = go.Figure()
    fig_corr.add_trace(go.Scatter(
        x=merged_series['ds'],
        y=merged_series['y_price'],
        name='Modal Price (₹/Quintal)',
        line=dict(color='#38bdf8', width=2)
    ))
    fig_corr.add_trace(go.Scatter(
        x=merged_series['ds'],
        y=merged_series['y_arrival'],
        name='Arrival Volume (Tonnes)',
        line=dict(color='#f59e0b', width=2, dash='dash'),
        yaxis='y2'
    ))
    
    fig_corr.update_layout(
        template='plotly_dark',
        paper_bgcolor='rgba(15, 23, 42, 0)',
        plot_bgcolor='rgba(30, 41, 59, 0.5)',
        height=360,
        margin=dict(l=10, r=10, t=30, b=10),
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1, font=dict(color="#f8fafc")),
        xaxis=dict(tickfont=dict(color='#f8fafc')),
        yaxis=dict(title=dict(text="Modal Price (₹/Quintal)", font=dict(color="#38bdf8")), tickfont=dict(color="#38bdf8")),
        yaxis2=dict(title=dict(text="Arrival Volume (Tonnes)", font=dict(color="#f59e0b")), tickfont=dict(color="#f59e0b"), overlaying='y', side='right')
    )
    st.plotly_chart(fig_corr, use_container_width=True)

with tab_visual3:
    st.markdown("##### Market Risk & Volatility Assessment")
    
    mean_val = processed_df['y'].mean()
    std_val = processed_df['y'].std()
    cv_volatility = (std_val / mean_val) * 100
    
    min_future = future_df['yhat_lower'].min()
    max_future = future_df['yhat_upper'].max()
    avg_future = future_df['yhat'].mean()
    
    risk_level = "🔴 High Volatility" if cv_volatility > 25 else ("🟡 Moderate Risk" if cv_volatility > 15 else "🟢 Stable Market")
    
    rc1, rc2, rc3 = st.columns(3)
    with rc1:
        st.metric("Price Volatility (CV)", f"{cv_volatility:.1f}%", delta=risk_level)
    with rc2:
        st.metric(f"Expected {horizon_days}-Day Range", f"₹{min_future:,.0f} - ₹{max_future:,.0f}")
    with rc3:
        st.metric("Projected Mean Value", f"{avg_future:,.1f} {unit_str}")
        
    st.markdown(f"""
    <div class="insight-card">
        <h4 style="color: #38bdf8; margin-top:0;">💡 Market Intelligence & Actionable Insights</h4>
        <ul style="line-height: 1.7; font-size: 0.95rem;">
            <li><b>Price Trajectory:</b> Over the next {horizon_days} days, {selected_commodity} in {selected_market} Mandi is projected to shift by <b>{pct_change:+.1f}%</b>.</li>
            <li><b>Supply Risk Assessment:</b> Current market volatility index is rated <b>{risk_level}</b>.</li>
            <li><b>Recommendation for Farmers:</b> {"Hold stock for peak pricing window if storage is available." if price_change > 0 else "Stagger shipments to avoid post-harvest price dips."}</li>
            <li><b>Recommendation for Bulk Buyers:</b> {"Procure bulk orders early before projected price increase." if price_change > 0 else "Buy on demand as prices are expected to ease."}</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

with tab_table:
    st.markdown("##### Forecast Data Table")
    disp_df = future_df.copy()
    disp_df['ds'] = disp_df['ds'].dt.strftime('%Y-%m-%d')
    disp_df = disp_df.rename(columns={
        'ds': 'Date',
        'yhat': f'Predicted {unit_str}',
        'yhat_lower': f'Lower Bound 95% ({unit_str})',
        'yhat_upper': f'Upper Bound 95% ({unit_str})'
    })
    
    disp_df[f'Predicted {unit_str}'] = disp_df[f'Predicted {unit_str}'].round(1)
    disp_df[f'Lower Bound 95% ({unit_str})'] = disp_df[f'Lower Bound 95% ({unit_str})'].round(1)
    disp_df[f'Upper Bound 95% ({unit_str})'] = disp_df[f'Upper Bound 95% ({unit_str})'].round(1)
    
    st.dataframe(disp_df, use_container_width=True)
    
    csv_data = disp_df.to_csv(index=False).encode('utf-8')
    st.download_button(
        label="📥 Download Forecast CSV",
        data=csv_data,
        file_name=f"{selected_commodity}_{selected_market}_forecast_{horizon_days}d.csv",
        mime="text/csv"
    )
