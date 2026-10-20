"""Feature preparation and preprocessing for CoconutRisk AI Component 03.
FITS SCALERS AND ENCODERS EXCLUSIVELY ON TRAINING RECORDS.
"""
import os
import math
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.preprocessing import StandardScaler

FEATURE_COLS = [
    'rainfall_monthly_mm',
    'temperature_c',
    'relative_humidity_pct',
    'solar_radiation_mj_m2_total',
    'pet_proxy_monthly_mm',
    'soil_moisture_m3m3',
    'dry_days_month',
    'dry_days_30d',
    'rainfall_3m_mm',
    'rainfall_lag_1_mm',
    'rainfall_lag_3_mm',
    'rainfall_anomaly_mm',
    'spi_1',
    'spi_3'
]

def get_data_dir():
    candidates = [
        Path(__file__).resolve().parents[2] / 'research-data',
        Path(__file__).resolve().parents[1] / 'research-data',
        Path('research-data'),
        Path('../research-data'),
        Path('C3_Final_Dataset'),
        Path('../C3_Final_Dataset')
    ]
    for c in candidates:
        if (c / 'model_ready').exists():
            return c
    raise FileNotFoundError("Could not find research-data or C3_Final_Dataset directory")

def get_saved_models_dir():
    candidates = [
        Path(__file__).resolve().parents[1] / 'saved_models',
        Path('ml-service/saved_models'),
        Path('saved_models')
    ]
    for c in candidates:
        c.mkdir(parents=True, exist_ok=True)
        return c
    out = Path('saved_models')
    out.mkdir(parents=True, exist_ok=True)
    return out

def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Extract month from forecast_issue_month YYYY-MM
    months = df['forecast_issue_month'].apply(lambda x: int(str(x)[5:7])).values
    df['month_sin'] = np.sin(2 * np.pi * months / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * months / 12.0)
    return df

def get_location_mapping(data_dir: Path):
    loc_file = data_dir / 'dataset' / 'locations_demo.csv'
    loc_df = pd.read_csv(loc_file)
    loc_ids = sorted(loc_df['location_id'].unique())
    id_to_idx = {loc_id: idx for idx, loc_id in enumerate(loc_ids)}
    idx_to_id = {idx: loc_id for idx, loc_id in enumerate(loc_ids)}
    return id_to_idx, idx_to_id, loc_df

def prepare_tabular_data(horizon: int, data_dir: Path = None):
    """Load horizon-specific train, val, test datasets and fit scaler strictly on train."""
    if data_dir is None:
        data_dir = get_data_dir()
    
    train_path = data_dir / 'model_ready' / f'train_h{horizon}.csv'
    val_path = data_dir / 'model_ready' / f'validation_h{horizon}.csv'
    test_path = data_dir / 'model_ready' / f'test_h{horizon}.csv'
    
    df_train = pd.read_csv(train_path)
    df_val = pd.read_csv(val_path)
    df_test = pd.read_csv(test_path)
    
    df_train = add_derived_features(df_train)
    df_val = add_derived_features(df_val)
    df_test = add_derived_features(df_test)
    
    id_to_idx, _, _ = get_location_mapping(data_dir)
    for df in (df_train, df_val, df_test):
        df['loc_idx'] = df['location_id'].map(id_to_idx)
    
    # Fit scaler strictly on train set
    scaler = StandardScaler()
    scaler.fit(df_train[FEATURE_COLS])
    
    scaled_feature_cols = [f'{col}_scaled' for col in FEATURE_COLS]
    
    for df in (df_train, df_val, df_test):
        scaled_vals = scaler.transform(df[FEATURE_COLS])
        for idx, col in enumerate(scaled_feature_cols):
            df[col] = scaled_vals[:, idx]
            
    input_feature_cols = scaled_feature_cols + ['month_sin', 'month_cos', 'loc_idx']
    target_col = f'target_spi3_h{horizon}'
    
    return {
        'df_train': df_train,
        'df_val': df_val,
        'df_test': df_test,
        'scaler': scaler,
        'raw_features': FEATURE_COLS,
        'scaled_features': scaled_feature_cols,
        'input_features': input_feature_cols,
        'target_col': target_col,
        'id_to_idx': id_to_idx
    }

def prepare_sequence_data(horizon: int, lookback: int = 12, data_dir: Path = None):
    """Prepare chronological sequences for PyTorch sequence models (LSTM, GRU, TCN).
    Historical monthly records from monthly_reference_1981_2025.csv provide antecedent context.
    Targets strictly respect train, val, and test splits.
    """
    if data_dir is None:
        data_dir = get_data_dir()
        
    id_to_idx, _, _ = get_location_mapping(data_dir)
    hist_path = data_dir / 'dataset' / 'monthly_reference_1981_2025.csv'
    df_hist = pd.read_csv(hist_path)
    df_hist = add_derived_features(df_hist)
    df_hist['loc_idx'] = df_hist['location_id'].map(id_to_idx)
    
    # Scale based strictly on train partition
    train_mask = df_hist[f'split_h{horizon}'] == 'TRAIN'
    scaler = StandardScaler()
    scaler.fit(df_hist.loc[train_mask, FEATURE_COLS])
    
    scaled_feature_cols = [f'{col}_scaled' for col in FEATURE_COLS]
    scaled_vals = scaler.transform(df_hist[FEATURE_COLS])
    for idx, col in enumerate(scaled_feature_cols):
        df_hist[col] = scaled_vals[:, idx]
        
    seq_features = scaled_feature_cols + ['month_sin', 'month_cos']
    
    # Build indexed historical lookup for fast sequence extraction
    df_hist = df_hist.sort_values(['location_id', 'forecast_issue_month']).reset_index(drop=True)
    grouped = {loc_id: group.reset_index(drop=True) for loc_id, group in df_hist.groupby('location_id')}
    
    def extract_dataset(split_name: str):
        X_seqs = []
        loc_indices = []
        y_targets = []
        meta_rows = []
        
        split_path = data_dir / 'model_ready' / f'{split_name}_h{horizon}.csv'
        split_df = pd.read_csv(split_path)
        
        target_col = f'target_spi3_h{horizon}'
        
        for _, row in split_df.iterrows():
            loc_id = row['location_id']
            issue_month = row['forecast_issue_month']
            loc_group = grouped[loc_id]
            
            # Find index of issue month in historical record
            matches = loc_group.index[loc_group['forecast_issue_month'] == issue_month].tolist()
            if not matches:
                continue
            curr_idx = matches[0]
            if curr_idx + 1 < lookback:
                # If lookback exceeds start, pad with earliest available
                pad_len = lookback - (curr_idx + 1)
                first_slice = loc_group.iloc[0:curr_idx + 1][seq_features].values
                pad_vals = np.repeat(first_slice[:1], pad_len, axis=0)
                seq = np.vstack([pad_vals, first_slice])
            else:
                seq = loc_group.iloc[curr_idx - lookback + 1 : curr_idx + 1][seq_features].values
                
            X_seqs.append(seq)
            loc_indices.append(id_to_idx[loc_id])
            y_targets.append(float(row[target_col]))
            meta_rows.append({
                'location_id': loc_id,
                'forecast_issue_month': issue_month,
                'target_month': row[f'target_month_h{horizon}'],
                'target_spi3': float(row[target_col]),
                'spi_3_current': float(row['spi_3'])
            })
            
        return (
            np.array(X_seqs, dtype=np.float32),
            np.array(loc_indices, dtype=np.int64),
            np.array(y_targets, dtype=np.float32),
            pd.DataFrame(meta_rows)
        )
        
    X_train, loc_train, y_train, meta_train = extract_dataset('train')
    X_val, loc_val, y_val, meta_val = extract_dataset('validation')
    X_test, loc_test, y_test, meta_test = extract_dataset('test')
    
    return {
        'X_train': X_train, 'loc_train': loc_train, 'y_train': y_train, 'meta_train': meta_train,
        'X_val': X_val, 'loc_val': loc_val, 'y_val': y_val, 'meta_val': meta_val,
        'X_test': X_test, 'loc_test': loc_test, 'y_test': y_test, 'meta_test': meta_test,
        'scaler': scaler,
        'seq_features': seq_features,
        'lookback': lookback,
        'id_to_idx': id_to_idx
    }

if __name__ == '__main__':
    data_dir = get_data_dir()
    print("Testing data preparation from:", data_dir)
    res_tab = prepare_tabular_data(horizon=1, data_dir=data_dir)
    print(f"Tabular H1 shapes: Train={res_tab['df_train'].shape}, Val={res_tab['df_val'].shape}, Test={res_tab['df_test'].shape}")
    res_seq = prepare_sequence_data(horizon=1, lookback=12, data_dir=data_dir)
    print(f"Sequence H1 shapes: X_train={res_seq['X_train'].shape}, X_val={res_seq['X_val'].shape}, X_test={res_seq['X_test'].shape}")
