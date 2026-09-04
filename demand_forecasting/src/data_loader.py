import os
import pandas as pd
import numpy as np

DEFAULT_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "raw_prices.csv")

def load_raw_data(csv_path: str = DEFAULT_DATA_PATH) -> pd.DataFrame:
    """
    Load raw price CSV exported from AGMARKNET / data.gov.in.
    Normalizes column headers to lowercase snake_case.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset CSV not found at: {csv_path}")
    
    df = pd.read_csv(csv_path)
    # Standardize column headers
    df.columns = [col.strip().lower().replace(" ", "_") for col in df.columns]
    
    # Parse date column
    date_col = next((c for c in df.columns if "date" in c), None)
    if date_col is None:
        raise ValueError("Could not locate date column in raw dataset CSV.")
    
    df['arrival_date'] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=['arrival_date'])
    df = df.sort_values('arrival_date').reset_index(drop=True)
    return df

def get_available_commodities(df: pd.DataFrame) -> list:
    """Return sorted list of unique commodities available in dataset."""
    if 'commodity' not in df.columns:
        return []
    return sorted(df['commodity'].dropna().unique().tolist())

def get_available_markets(df: pd.DataFrame, commodity: str = None) -> list:
    """Return sorted list of unique markets available, optionally filtered by commodity."""
    filtered_df = df
    if commodity and 'commodity' in df.columns:
        filtered_df = df[df['commodity'].str.lower() == commodity.lower()]
    
    if 'market' not in filtered_df.columns:
        return []
    return sorted(filtered_df['market'].dropna().unique().tolist())

def preprocess_series(df: pd.DataFrame, commodity: str, market: str, target_col: str = "modal_price", clip_outliers: bool = True) -> pd.DataFrame:
    """
    Filter dataset for specific commodity and market, reindex to complete daily frequency,
    interpolates date gaps with forward-fill and linear interpolation.
    Optionally applies rolling outlier smoothing to handle raw data shocks.
    
    Returns DataFrame with columns ['ds', 'y'] ready for Prophet and XGBoost training.
    """
    # Filter
    sub_df = df[(df['commodity'].str.lower() == commodity.lower()) & 
                (df['market'].str.lower() == market.lower())].copy()
    
    if sub_df.empty:
        raise ValueError(f"No records found for Commodity: '{commodity}', Market: '{market}'")
    
    # Group by date in case of multiple entries per date
    grouped = sub_df.groupby('arrival_date')[target_col].mean().reset_index()
    
    # Create complete daily date range to handle missing dates/gaps
    min_date = grouped['arrival_date'].min()
    max_date = grouped['arrival_date'].max()
    full_idx = pd.date_range(start=min_date, end=max_date, freq='D', name='ds')
    
    grouped = grouped.rename(columns={'arrival_date': 'ds', target_col: 'y'})
    grouped = grouped.set_index('ds').reindex(full_idx)
    
    # Simple, non-distorting interpolation (forward fill + linear interpolation for inner gaps)
    grouped['y'] = grouped['y'].interpolate(method='linear').ffill().bfill()
    
    # Outlier smoothing using rolling IQR bounds if requested
    if clip_outliers and len(grouped) >= 14:
        roll_med = grouped['y'].rolling(window=30, min_periods=7, center=True).median()
        roll_q25 = grouped['y'].rolling(window=30, min_periods=7, center=True).quantile(0.25)
        roll_q75 = grouped['y'].rolling(window=30, min_periods=7, center=True).quantile(0.75)
        iqr = roll_q75 - roll_q25
        lower_bound = (roll_med - 3.0 * iqr).clip(lower=0)
        upper_bound = roll_med + 3.0 * iqr
        # Fill missing rolling bounds with global series bounds
        global_med = grouped['y'].median()
        global_iqr = grouped['y'].quantile(0.75) - grouped['y'].quantile(0.25)
        lower_bound = lower_bound.fillna(max(0, global_med - 3.0 * global_iqr))
        upper_bound = upper_bound.fillna(global_med + 3.0 * global_iqr)
        
        grouped['y'] = grouped['y'].clip(lower=lower_bound, upper=upper_bound)
    
    clean_df = grouped.reset_index()
    clean_df['commodity'] = commodity
    clean_df['market'] = market
    return clean_df

if __name__ == "__main__":
    df = load_raw_data()
    print("Available commodities:", get_available_commodities(df))
    print("Available markets for Tomato:", get_available_markets(df, "Tomato"))
    series = preprocess_series(df, "Tomato", "Pune")
    print("Processed series head:\n", series.head())
