"""Train Classical Machine Learning Models: XGBoost and Random Forest.
Fits strictly on TRAIN set, calibrates conformal intervals on VALIDATION,
and evaluates once on untouched TEST set.
"""
import sys
import time
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from training.prepare import get_data_dir, get_saved_models_dir, prepare_tabular_data
from training.make_intervals import compute_conformal_quantile, evaluate_interval_coverage
from training.train_baselines import evaluate_predictions, RISK_CATEGORIES, spi_to_risk_category

def train_classical_models(data_dir: Path = None, saved_models_dir: Path = None):
    if data_dir is None:
        data_dir = get_data_dir()
    if saved_models_dir is None:
        saved_models_dir = get_saved_models_dir()
        
    results = []
    
    for h in [1, 3, 6]:
        print(f"\n--- Training Classical Models for Horizon {h}M ---")
        data = prepare_tabular_data(horizon=h, data_dir=data_dir)
        df_train = data['df_train']
        df_val = data['df_val']
        df_test = data['df_test']
        input_cols = data['input_features']
        target_col = data['target_col']
        scaler = data['scaler']
        
        # Save preprocessor
        prep_path = saved_models_dir / f'preprocessor_h{h}.joblib'
        joblib.dump({
            'scaler': scaler,
            'input_features': input_cols,
            'raw_features': data['raw_features'],
            'scaled_features': data['scaled_features'],
            'id_to_idx': data['id_to_idx'],
            'horizon': h
        }, prep_path)
        
        X_train = df_train[input_cols].values
        y_train = df_train[target_col].values
        
        X_val = df_val[input_cols].values
        y_val = df_val[target_col].values
        
        X_test = df_test[input_cols].values
        y_test = df_test[target_col].values
        
        # 1. XGBoost Regressor
        print(f"Fitting XGBoost H{h}...")
        t0 = time.time()
        xgb = XGBRegressor(
            n_estimators=150,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=20261020,
            n_jobs=-1
        )
        xgb.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
        t_xgb = round(time.time() - t0, 3)
        
        # Validation Conformal Calibration
        y_val_xgb = xgb.predict(X_val)
        xgb_quantile = compute_conformal_quantile(y_val, y_val_xgb)
        
        # Test Evaluation
        y_test_xgb = xgb.predict(X_test)
        xgb_eval = evaluate_predictions(y_test, y_test_xgb)
        xgb_cov = evaluate_interval_coverage(y_test, y_test_xgb, xgb_quantile)
        
        # Feature Associations (normalized %)
        feat_importances = xgb.feature_importances_
        sum_imp = float(np.sum(feat_importances)) or 1.0
        feat_drivers = [
            {'feature': col, 'association_pct': round(float(imp / sum_imp * 100.0), 2)}
            for col, imp in zip(input_cols, feat_importances)
        ]
        feat_drivers.sort(key=lambda x: x['association_pct'], reverse=True)
        
        xgb_model_path = saved_models_dir / f'xgboost_h{h}.joblib'
        joblib.dump(xgb, xgb_model_path)
        
        xgb_entry = {
            'model_id': f'xgboost_h{h}',
            'model_name': 'XGBoost',
            'algorithm': 'Gradient Boosted Decision Trees (XGBoost)',
            'horizon_months': h,
            'is_baseline': False,
            'artifact_file': f'xgboost_h{h}.joblib',
            **xgb_eval,
            **xgb_cov,
            'training_time_seconds': t_xgb,
            'feature_drivers': feat_drivers[:8],
            'hyperparameters': {
                'n_estimators': 150, 'max_depth': 4, 'learning_rate': 0.05,
                'subsample': 0.8, 'colsample_bytree': 0.8
            },
            'data_origin': 'SYNTHETIC_SIMULATION',
            'disclaimer': 'Synthetic demonstration results — not validated on observed weather'
        }
        results.append(xgb_entry)
        print(f"XGBoost H{h}: MAE={xgb_eval['mae']:.4f}, RMSE={xgb_eval['rmse']:.4f}, MacroF1={xgb_eval['macro_f1']:.4f}, Conformal90%Cov={xgb_cov['empirical_test_coverage_pct']}%")
        
        # 2. Random Forest Regressor
        print(f"Fitting Random Forest H{h}...")
        t0 = time.time()
        rf = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            min_samples_split=4,
            random_state=20261020,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)
        t_rf = round(time.time() - t0, 3)
        
        # Validation Conformal Calibration
        y_val_rf = rf.predict(X_val)
        rf_quantile = compute_conformal_quantile(y_val, y_val_rf)
        
        # Test Evaluation
        y_test_rf = rf.predict(X_test)
        rf_eval = evaluate_predictions(y_test, y_test_rf)
        rf_cov = evaluate_interval_coverage(y_test, y_test_rf, rf_quantile)
        
        rf_feat_importances = rf.feature_importances_
        rf_sum_imp = float(np.sum(rf_feat_importances)) or 1.0
        rf_feat_drivers = [
            {'feature': col, 'association_pct': round(float(imp / rf_sum_imp * 100.0), 2)}
            for col, imp in zip(input_cols, rf_feat_importances)
        ]
        rf_feat_drivers.sort(key=lambda x: x['association_pct'], reverse=True)
        
        rf_model_path = saved_models_dir / f'random_forest_h{h}.joblib'
        joblib.dump(rf, rf_model_path)
        
        rf_entry = {
            'model_id': f'random_forest_h{h}',
            'model_name': 'Random Forest',
            'algorithm': 'Random Forest Regressor (Ensemble Trees)',
            'horizon_months': h,
            'is_baseline': False,
            'artifact_file': f'random_forest_h{h}.joblib',
            **rf_eval,
            **rf_cov,
            'training_time_seconds': t_rf,
            'feature_drivers': rf_feat_drivers[:8],
            'hyperparameters': {
                'n_estimators': 100, 'max_depth': 8, 'min_samples_split': 4
            },
            'data_origin': 'SYNTHETIC_SIMULATION',
            'disclaimer': 'Synthetic demonstration results — not validated on observed weather'
        }
        results.append(rf_entry)
        print(f"Random Forest H{h}: MAE={rf_eval['mae']:.4f}, RMSE={rf_eval['rmse']:.4f}, MacroF1={rf_eval['macro_f1']:.4f}, Conformal90%Cov={rf_cov['empirical_test_coverage_pct']}%")
        
    return results

if __name__ == '__main__':
    train_classical_models()
