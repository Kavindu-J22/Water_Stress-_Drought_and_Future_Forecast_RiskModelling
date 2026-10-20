"""Transparent Baselines: Persistence and Seasonal Climatology.
Evaluates per-horizon test performance strictly on untouched test partitions.
"""
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path

# Ensure ml-service root is in sys.path
BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from sklearn.metrics import mean_absolute_error, mean_squared_error, f1_score, precision_score, recall_score, confusion_matrix
from training.prepare import get_data_dir, prepare_tabular_data
from training.make_intervals import compute_conformal_quantile, evaluate_interval_coverage

RISK_CATEGORIES = ['Low', 'Medium', 'High', 'Critical']

def spi_to_risk_category(spi_val: float) -> str:
    if spi_val <= -1.5:
        return 'Critical'
    elif spi_val <= -1.0:
        return 'High'
    elif spi_val <= -0.5:
        return 'Medium'
    else:
        return 'Low'

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    
    # Drought event defined as SPI-3 <= -1.0 (High or Critical)
    drought_true = (y_true <= -1.0).astype(int)
    drought_pred = (y_pred <= -1.0).astype(int)
    
    recall = float(recall_score(drought_true, drought_pred, zero_division=0))
    precision = float(precision_score(drought_true, drought_pred, zero_division=0))
    
    # Multiclass category metrics
    cats_true = [spi_to_risk_category(val) for val in y_true]
    cats_pred = [spi_to_risk_category(val) for val in y_pred]
    macro_f1 = float(f1_score(cats_true, cats_pred, labels=RISK_CATEGORIES, average='macro', zero_division=0))
    
    cm = confusion_matrix(cats_true, cats_pred, labels=RISK_CATEGORIES).tolist()
    
    return {
        'mae': round(mae, 5),
        'rmse': round(rmse, 5),
        'drought_recall': round(recall, 4),
        'drought_precision': round(precision, 4),
        'macro_f1': round(macro_f1, 4),
        'confusion_matrix': cm,
        'confusion_labels': RISK_CATEGORIES,
        'test_samples': len(y_true)
    }

def run_baselines(data_dir: Path = None):
    if data_dir is None:
        data_dir = get_data_dir()
    
    results = []
    
    for h in [1, 3, 6]:
        data = prepare_tabular_data(horizon=h, data_dir=data_dir)
        df_val = data['df_val']
        df_test = data['df_test']
        target_col = data['target_col']
        
        y_val = df_val[target_col].values
        y_test = df_test[target_col].values
        
        # 1. Persistence Baseline: forecast = current spi_3
        y_val_persist = df_val['spi_3'].values
        y_test_persist = df_test['spi_3'].values
        
        persist_quantile = compute_conformal_quantile(y_val, y_val_persist)
        persist_cov = evaluate_interval_coverage(y_test, y_test_persist, persist_quantile)
        persist_eval = evaluate_predictions(y_test, y_test_persist)
        
        results.append({
            'model_id': f'persistence_h{h}',
            'model_name': 'Persistence',
            'algorithm': 'Persistence (SPI-3(t))',
            'horizon_months': h,
            'is_baseline': True,
            **persist_eval,
            **persist_cov,
            'training_time_seconds': 0.01,
            'data_origin': 'SYNTHETIC_SIMULATION',
            'disclaimer': 'Synthetic demonstration results — not validated on observed weather'
        })
        
        # 2. Climatology Baseline: forecast = 0.0
        y_val_clim = np.zeros_like(y_val)
        y_test_clim = np.zeros_like(y_test)
        
        clim_quantile = compute_conformal_quantile(y_val, y_val_clim)
        clim_cov = evaluate_interval_coverage(y_test, y_test_clim, clim_quantile)
        clim_eval = evaluate_predictions(y_test, y_test_clim)
        
        results.append({
            'model_id': f'climatology_h{h}',
            'model_name': 'Seasonal Climatology',
            'algorithm': 'Seasonal Climatology (SPI-3 ~ 0)',
            'horizon_months': h,
            'is_baseline': True,
            **clim_eval,
            **clim_cov,
            'training_time_seconds': 0.01,
            'data_origin': 'SYNTHETIC_SIMULATION',
            'disclaimer': 'Synthetic demonstration results — not validated on observed weather'
        })
        
    return results

if __name__ == '__main__':
    res = run_baselines()
    print("Baseline Evaluation Results:")
    for r in res:
        print(f"H{r['horizon_months']} {r['model_name']:22}: MAE={r['mae']:.4f}, RMSE={r['rmse']:.4f}, MacroF1={r['macro_f1']:.4f}, Conformal90%Cov={r['empirical_test_coverage_pct']}%")
