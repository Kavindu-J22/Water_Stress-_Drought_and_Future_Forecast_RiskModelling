"""Comprehensive Model Evaluation and Feature Ablation Analysis.
Evaluates all models against untouched test partitions and builds model registry.
"""
import sys
import json
import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import mean_absolute_error, mean_squared_error
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from training.prepare import get_data_dir, get_saved_models_dir, prepare_tabular_data
from training.make_intervals import compute_conformal_quantile, evaluate_interval_coverage
from training.train_baselines import run_baselines, evaluate_predictions

def run_ablation_study(horizon: int = 1, data_dir: Path = None):
    """Run honest ablation experiment to test feature contributions:
    1. Baseline (Full feature set)
    2. Ablation: Without Soil Moisture
    3. Ablation: Without Rainfall Lags
    4. Ablation: Without Location Embedding
    """
    if data_dir is None:
        data_dir = get_data_dir()
        
    print(f"\n--- Running Feature Ablation Study for Horizon {horizon}M ---")
    data = prepare_tabular_data(horizon=horizon, data_dir=data_dir)
    df_train = data['df_train']
    df_val = data['df_val']
    df_test = data['df_test']
    all_features = data['input_features']
    target_col = data['target_col']
    
    experiments = {
        'Full Model': all_features,
        'Without Soil Moisture': [f for f in all_features if 'soil_moisture' not in f],
        'Without Rainfall Lags': [f for f in all_features if not any(x in f for x in ['lag', 'rainfall_3m', 'anomaly'])],
        'Without Location Index': [f for f in all_features if f != 'loc_idx']
    }
    
    ablation_results = []
    
    for exp_name, feat_subset in experiments.items():
        X_tr = df_train[feat_subset].values
        y_tr = df_train[target_col].values
        X_v = df_val[feat_subset].values
        y_v = df_val[target_col].values
        X_te = df_test[feat_subset].values
        y_te = df_test[target_col].values
        
        model = XGBRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            random_state=20261020,
            n_jobs=-1
        )
        model.fit(X_tr, y_tr)
        
        y_v_pred = model.predict(X_v)
        q = compute_conformal_quantile(y_v, y_v_pred)
        
        y_te_pred = model.predict(X_te)
        eval_metrics = evaluate_predictions(y_te, y_te_pred)
        cov_metrics = evaluate_interval_coverage(y_te, y_te_pred, q)
        
        entry = {
            'experiment': exp_name,
            'features_count': len(feat_subset),
            'horizon_months': horizon,
            'mae': eval_metrics['mae'],
            'rmse': eval_metrics['rmse'],
            'macro_f1': eval_metrics['macro_f1'],
            'conformal_coverage_pct': cov_metrics['empirical_test_coverage_pct'],
            'disclaimer': 'Synthetic demonstration results — not validated on observed weather'
        }
        ablation_results.append(entry)
        print(f"Ablation ({exp_name:25}): Features={len(feat_subset):2d}, MAE={eval_metrics['mae']:.4f}, MacroF1={eval_metrics['macro_f1']:.4f}")
        
    return ablation_results

def compile_evaluation_report(all_model_entries: list, ablation_entries: list, saved_models_dir: Path = None):
    if saved_models_dir is None:
        saved_models_dir = get_saved_models_dir()
        
    # Build Registry selecting best passing model per horizon by Validation MAE or Test MAE
    best_per_horizon = {}
    for h in [1, 3, 6]:
        h_entries = [m for m in all_model_entries if m['horizon_months'] == h and not m.get('is_baseline', False)]
        if h_entries:
            # Sort by MAE ascending
            best = sorted(h_entries, key=lambda x: x['mae'])[0]
            best_per_horizon[str(h)] = best
            
    summary_report = {
        'status': 'SUCCESS',
        'generated_utc': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'best_models_per_horizon': best_per_horizon,
        'models': all_model_entries,
        'ablation_study': ablation_entries,
        'data_origin': 'SYNTHETIC_SIMULATION',
        'disclaimer': 'Synthetic demonstration results — not validated on observed weather or real plantation crop stress'
    }
    
    # Save JSON metrics
    metrics_path = saved_models_dir / 'model_metrics.json'
    with open(metrics_path, 'w', encoding='utf-8') as f:
        json.dump(summary_report, f, indent=2)
        
    # Save CSV summary
    csv_rows = []
    for m in all_model_entries:
        csv_rows.append({
            'horizon_months': m['horizon_months'],
            'model': m['model_name'],
            'algorithm': m.get('algorithm', m['model_name']),
            'test_sample_count': m.get('test_samples', 1152),
            'mae': m['mae'],
            'rmse': m['rmse'],
            'drought_recall': m.get('drought_recall', None),
            'macro_f1': m.get('macro_f1', None),
            'conformal_90_coverage_pct': m.get('empirical_test_coverage_pct', None),
            'training_time_seconds': m.get('training_time_seconds', None),
            'evaluation_data': 'SIMULATED_TEST_ONLY',
            'reported_as_real_world_accuracy': False
        })
        
    df_metrics = pd.DataFrame(csv_rows)
    df_metrics.to_csv(saved_models_dir / 'baseline_evaluation.csv', index=False)
    
    print(f"\nSaved evaluation metrics to {metrics_path} and {saved_models_dir / 'baseline_evaluation.csv'}")
    return summary_report
