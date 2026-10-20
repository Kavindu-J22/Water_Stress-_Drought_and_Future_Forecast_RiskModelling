"""End-to-End System Smoke Test for CoconutRisk AI Component 03.
Validates dataset, model artifacts, inference calculations, and report generation.
"""
import sys
import json
import torch
import joblib
import pandas as pd
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'ml-service'))

from app.services.data_service import data_service
from app.services.model_registry import model_registry
from app.services.forecast_service import forecast_service
from app.services.report_generator import generate_pdf_report, generate_csv_report

def main():
    print("==================================================================")
    print("CoconutRisk AI - C3 Smoke Test & System Health Verification")
    print("==================================================================")

    # 1. Dataset Verification
    print("\n[1/5] Verifying Simulated Dataset Integrity...")
    locations = data_service.get_locations()
    assert len(locations) == 32, f"Expected 32 locations, found {len(locations)}"
    print(f"  [PASS] {len(locations)} Study Locations Loaded Successfully")

    latest_month = data_service.as_of_month
    assert latest_month == "2025-12", f"Expected as_of_month 2025-12, got {latest_month}"
    print(f"  [PASS] As-Of Issue Baseline: {latest_month}")

    # 2. Model Artifacts Verification
    print("\n[2/5] Verifying Trained Model Artifacts in Registry...")
    model_registry.reload()
    assert model_registry.is_ready(), "Model registry reports models are not ready!"
    models = model_registry.get_models()
    print(f"  [PASS] {len(models)} Models Evaluated & Cataloged in Registry:")
    for h in [1, 3, 6]:
        best = model_registry.get_best_models_per_horizon().get(str(h))
        print(f"    - Horizon {h}M Top Model: {best['model_name']} (MAE={best['mae']:.4f}, 90% Conformal Cov={best['empirical_test_coverage_pct']}%)")

    # 3. Forecast Inference Verification
    print("\n[3/5] Testing Multi-Horizon Forecast Inference...")
    for h in [1, 3, 6]:
        fc = forecast_service.compute_single_forecast("C3_003", horizon_months=h)
        assert fc["forecast_status"] == "READY", f"Forecast status not READY: {fc['forecast_status']}"
        assert fc["predicted_spi3"] is not None, "Predicted SPI-3 is None!"
        assert fc["risk_category"] in ["Critical", "High", "Medium", "Low"], f"Invalid risk category: {fc['risk_category']}"
        assert fc["prediction_interval_90"]["lower"] is not None, "Conformal lower bound is None!"
        assert fc["prediction_interval_90"]["upper"] is not None, "Conformal upper bound is None!"
        print(f"  [PASS] H{h}M Kurunegala (C3_003) -> Target: {fc['target_month']} | SPI-3: {fc['predicted_spi3']} ({fc['risk_category']}) | 90% Band: [{fc['prediction_interval_90']['lower']}, {fc['prediction_interval_90']['upper']}]")

    # 4. Geo Risk Map Verification
    print("\n[4/5] Testing GeoJSON 32-Zone Risk Map...")
    map_res = forecast_service.get_risk_map(horizon_months=1, layer="risk")
    assert map_res["type"] == "FeatureCollection"
    assert len(map_res["features"]) == 32
    assert map_res["disclaimer"] is not None
    print(f"  [PASS] GeoJSON FeatureCollection generated with {len(map_res['features'])} illustrative polygons")

    # 5. Report Generation Verification
    print("\n[5/5] Testing Binary PDF & CSV Report Generators...")
    pdf_bytes, pdf_name = generate_pdf_report("drought_risk", horizon_months=1)
    assert len(pdf_bytes) > 1000, "Generated PDF is empty or corrupt!"
    print(f"  [PASS] PDF Report Generated ({pdf_name}, {len(pdf_bytes):,} bytes)")

    csv_bytes, csv_name = generate_csv_report("forecast_accuracy", horizon_months=1)
    assert len(csv_bytes) > 200, "Generated CSV is empty!"
    print(f"  [PASS] CSV Report Generated ({csv_name}, {len(csv_bytes):,} bytes)")

    print("\n==================================================================")
    print("ALL SMOKE TESTS PASSED! C3 ML & DATA PIPELINE OPERATIONAL!")
    print("==================================================================")

if __name__ == "__main__":
    main()
