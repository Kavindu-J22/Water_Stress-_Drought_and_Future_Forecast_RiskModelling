"""Validation-Calibrated Split Conformal Prediction Intervals.
Target nominal coverage: 90% (alpha=0.10).
Calibration set: Validation set (strictly separated from training and test).
Evaluated on untouched Test set to report empirical coverage.
"""
import numpy as np
from typing import Dict, Tuple

def compute_conformal_quantile(y_val: np.ndarray, y_val_pred: np.ndarray, alpha: float = 0.10) -> float:
    """Compute split conformal quantile from validation set errors."""
    n = len(y_val)
    if n == 0:
        return 1.0
    abs_errors = np.abs(y_val - y_val_pred)
    # Finite-sample correction factor: ceil((n + 1) * (1 - alpha)) / n
    level = min(1.0, np.ceil((n + 1) * (1.0 - alpha)) / n)
    quantile_val = float(np.quantile(abs_errors, level, method='higher'))
    return quantile_val

def evaluate_interval_coverage(
    y_test: np.ndarray, 
    y_test_pred: np.ndarray, 
    quantile_val: float
) -> Dict[str, float]:
    """Evaluate empirical coverage and average width on test set."""
    lower = y_test_pred - quantile_val
    upper = y_test_pred + quantile_val
    covered = (y_test >= lower) & (y_test <= upper)
    empirical_coverage = float(np.mean(covered) * 100.0)
    avg_width = float(2.0 * quantile_val)
    return {
        'conformal_quantile': round(quantile_val, 4),
        'empirical_test_coverage_pct': round(empirical_coverage, 2),
        'average_interval_width': round(avg_width, 4),
        'nominal_coverage_pct': 90.0
    }
