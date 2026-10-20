"""Master Model Training and Evaluation Orchestrator for CoconutRisk AI Component 03.
Runs:
1. Transparent Baselines (Persistence, Seasonal Climatology)
2. Classical Models (XGBoost, Random Forest)
3. Autoregressive Benchmark (SARIMAX)
4. PyTorch Deep Sequence Forecasters (LSTM, GRU, TCN)
5. Feature Ablation Analysis
6. Validation-Calibrated Conformal Quantile Computation
7. Model Registry & Metrics Serialization
"""
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from training.prepare import get_data_dir, get_saved_models_dir
from training.train_baselines import run_baselines
from training.train_classical import train_classical_models
from training.train_sarimax import train_sarimax_benchmark
from training.train_deep import train_all_deep_models
from training.evaluate import run_ablation_study, compile_evaluation_report

def main():
    print("=====================================================================")
    print("CoconutRisk AI - C3 Drought Risk Forecasting ML Training Pipeline")
    print("=====================================================================")
    t_start = time.time()
    data_dir = get_data_dir()
    saved_models_dir = get_saved_models_dir()
    print(f"Data Directory: {data_dir}")
    print(f"Artifacts Directory: {saved_models_dir}\n")
    
    # 1. Baselines
    print(">>> 1/5 Running Transparent Baselines...")
    baseline_entries = run_baselines(data_dir=data_dir)
    
    # 2. Classical Models
    print("\n>>> 2/5 Training Classical Models (XGBoost & Random Forest)...")
    classical_entries = train_classical_models(data_dir=data_dir, saved_models_dir=saved_models_dir)
    
    # 3. SARIMAX Benchmark
    print("\n>>> 3/5 Training SARIMAX Autoregressive Benchmark...")
    sarimax_entries = train_sarimax_benchmark(data_dir=data_dir)
    
    # 4. Deep Learning Models (PyTorch)
    print("\n>>> 4/5 Training PyTorch Deep Sequence Models (LSTM, GRU, TCN)...")
    deep_entries = train_all_deep_models(data_dir=data_dir, saved_models_dir=saved_models_dir)
    
    # 5. Ablation Analysis
    print("\n>>> 5/5 Running Feature Ablation Analysis...")
    ablation_entries = run_ablation_study(horizon=1, data_dir=data_dir)
    
    # Compile Report & Model Registry
    all_entries = baseline_entries + classical_entries + sarimax_entries + deep_entries
    report = compile_evaluation_report(all_entries, ablation_entries, saved_models_dir=saved_models_dir)
    
    total_time = round(time.time() - t_start, 2)
    print("\n=====================================================================")
    print(f"C3 ML Training Completed Successfully in {total_time}s!")
    print(f"Total Models Evaluated: {len(all_entries)}")
    print(f"Best Models by Horizon: {list(report['best_models_per_horizon'].keys())}")
    print("=====================================================================")

if __name__ == '__main__':
    main()
