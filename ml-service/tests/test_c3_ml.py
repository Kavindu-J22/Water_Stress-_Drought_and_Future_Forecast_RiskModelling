"""Comprehensive Unit Tests for Component 03 ML Service.
"""
import sys
import pytest
from pathlib import Path
from fastapi.testclient import TestClient

BASE_DIR = Path(__file__).resolve().parents[1]
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from app.main import app
from app.services.data_service import data_service
from app.services.forecast_service import spi_to_risk_category, compute_target_month
from training.make_intervals import compute_conformal_quantile, evaluate_interval_coverage
import numpy as np

client = TestClient(app)

def test_data_service_integrity():
    locations = data_service.get_locations()
    assert len(locations) == 32, f"Expected 32 locations, got {len(locations)}"
    loc_ids = [l['location_id'] for l in locations]
    assert 'C3_001' in loc_ids
    assert 'C3_032' in loc_ids
    assert len(set(loc_ids)) == 32, "Duplicate location IDs found"
    
    geojson = data_service.get_geojson()
    assert geojson['type'] == 'FeatureCollection'
    assert len(geojson['features']) == 32

def test_risk_category_thresholds():
    assert spi_to_risk_category(-2.1) == 'Critical'
    assert spi_to_risk_category(-1.5) == 'Critical'
    assert spi_to_risk_category(-1.49) == 'High'
    assert spi_to_risk_category(-1.0) == 'High'
    assert spi_to_risk_category(-0.99) == 'Medium'
    assert spi_to_risk_category(-0.5) == 'Medium'
    assert spi_to_risk_category(-0.49) == 'Low'
    assert spi_to_risk_category(0.8) == 'Low'

def test_target_month_arithmetic():
    assert compute_target_month('2025-12', 1) == '2026-01'
    assert compute_target_month('2025-12', 3) == '2026-03'
    assert compute_target_month('2025-12', 6) == '2026-06'
    assert compute_target_month('2024-10', 3) == '2025-01'

def test_conformal_interval_calculation():
    y_val = np.array([0.0, 1.0, -0.5, 0.2, 0.8, -1.2, 0.3, -0.1, 0.5, -0.8])
    y_pred = np.zeros_like(y_val)
    q = compute_conformal_quantile(y_val, y_pred, alpha=0.10)
    assert q > 0.0
    
    y_test = np.array([0.1, -0.2, 0.4, -0.3])
    y_test_pred = np.zeros_like(y_test)
    cov = evaluate_interval_coverage(y_test, y_test_pred, q)
    assert 'empirical_test_coverage_pct' in cov
    assert cov['average_interval_width'] == round(2.0 * q, 4)

def test_api_health():
    res = client.get("/internal/c3/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "UP"
    assert data["is_synthetic"] is True
    assert "disclaimer" in data

def test_api_metadata():
    res = client.get("/internal/c3/metadata")
    assert res.status_code == 200
    data = res.json()
    assert data["locations_count"] == 32
    assert data["is_synthetic"] is True
    assert "SYNTHETIC" in data["disclaimer"]

def test_api_locations():
    res = client.get("/internal/c3/locations")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 32
    for loc in data:
        assert "location_id" in loc
        assert "geometry_caveat" in loc

def test_api_overview():
    res = client.get("/internal/c3/overview?location_id=C3_001")
    assert res.status_code == 200
    data = res.json()
    assert data["location_id"] == "C3_001"
    assert "current_risk" in data
    assert "rainfall_monthly_mm" in data

def test_api_dashboard():
    res = client.get("/internal/c3/dashboard?location_id=C3_001&horizon_months=1")
    assert res.status_code == 200
    data = res.json()
    assert data["horizon_months"] == 1
    assert "forecast_risk" in data
    assert "history" in data
    assert len(data["history"]) > 0

def test_api_invalid_horizon_error():
    res = client.get("/internal/c3/dashboard?location_id=C3_001&horizon_months=5")
    assert res.status_code == 422
    assert res.json()["detail"]["code"] == "INVALID_HORIZON"

def test_report_generation():
    req_payload = {
        "report_type": "drought_risk",
        "horizon_months": 1,
        "format": "csv"
    }
    res = client.post("/internal/c3/reports/generate", json=req_payload)
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert len(res.content) > 50
