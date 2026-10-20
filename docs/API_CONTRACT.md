# CoconutRisk AI — Component 03 API Contract Specification

> **PROVENANCE NOTICE:** All API responses and model outputs represent a **100% SYNTHETIC RESEARCH SIMULATION** (1981–2025). Observations are fixed as of **December 2025 (Historical Demo)**. Do not interpret outputs as certified real-world weather or plantation physiological advisories.

## Base URLs
- Public API Gateway (Node.js Express): `http://localhost:8000/api/v1/c3`
- Internal ML Service (Python FastAPI): `http://localhost:8001/internal/c3`

---

## 1. System Health & Metadata

### `GET /health`
Returns service status, model readiness, and PostgreSQL persistence mode.
- **Response 200 OK:**
```json
{
  "status": "UP",
  "node_gateway": "operational",
  "ml_service": "operational",
  "postgresql": "CONNECTED",
  "database_engine": "PostgreSQL",
  "persistence_mode": "FULL_PERSISTENCE",
  "artifacts_status": "TRAINED_MODELS_READY",
  "trained_models_count": 24,
  "as_of_month": "2025-12",
  "is_synthetic": true,
  "disclaimer": "Simulated demonstration environment. No real weather or measured coconut tree water stress."
}
```

### `GET /metadata`
Returns platform metadata, historical bounds, and scientific boundaries.

---

## 2. Study Locations & Overview

### `GET /locations`
Returns all 32 representative Sri Lankan demonstration sites with approximate town coordinates and geometry disclaimer.
- **Response 200 OK:** Array of `LocationItem`:
```json
[
  {
    "location_id": "C3_003",
    "location_name": "Kurunegala",
    "district": "Kurunegala",
    "province": "North Western",
    "latitude": 7.4863,
    "longitude": 80.3647,
    "zone": "TRANS",
    "data_origin": "SYNTHETIC_STUDY_SITE",
    "geometry_caveat": "Illustrative point coordinate near town center — NOT a verified coconut plantation."
  }
]
```

### `GET /overview?location_id=C3_003`
Returns summary environmental metrics and current drought risk for hero banner widgets.

---

## 3. Interactive Dashboard & Time-Series History

### `GET /dashboard?location_id=C3_003&horizon_months=1`
Primary payload powering the interactive dashboard.
- **Parameters:**
  - `location_id` (string, required, e.g. `C3_001` to `C3_032`)
  - `horizon_months` (int, required: `1`, `3`, or `6`)
- **Response 200 OK:**
```json
{
  "location": { "location_id": "C3_003", "location_name": "Kurunegala", "district": "Kurunegala", "province": "North Western" },
  "latest_month": "2025-12",
  "horizon_months": 1,
  "target_month": "2026-01",
  "current_risk": "Low",
  "forecast_risk": "Low",
  "current_spi3": -0.35,
  "predicted_spi3": -0.45,
  "prediction_interval_90": { "lower": -1.30, "upper": 0.39 },
  "affected_demo_zones_count": 4,
  "total_demo_zones_count": 32,
  "critical_zones_count": 1,
  "high_zones_count": 3,
  "rainfall_deficit_pct": -8.5,
  "dry_days_month": 16,
  "rainfall_3m_mm": 348.5,
  "history": [
    { "month": "2025-11", "rainfall_monthly_mm": 180.2, "temperature_c": 27.2, "soil_moisture_m3m3": 0.34, "spi_3": -0.21, "risk_category": "Low" }
  ],
  "forecast_points": [
    { "month": "2026-01", "predicted_spi3": -0.45, "risk_category": "Low", "lower_90": -1.30, "upper_90": 0.39 }
  ],
  "feature_drivers": [
    { "feature": "spi_3_scaled", "association_pct": 32.4 },
    { "feature": "rainfall_3m_mm_scaled", "association_pct": 21.1 }
  ],
  "model_id": "xgboost_h1",
  "model_name": "XGBoost Regressor",
  "conformal_coverage_pct": 91.23,
  "is_synthetic": true
}
```

---

## 4. Forecasting Endpoints

### `GET /forecast?location_id=C3_003&horizon_months=1|3|6`
Single-location prediction. If models are untrained, returns `forecast_status: "MODEL_NOT_YET_TRAINED"` with null predictions.

### `GET /forecast/all?horizon_months=1|3|6`
Batch forecasts across all 32 locations.

---

## 5. GeoJSON Risk Map

### `GET /risk-map?horizon_months=1|3|6&layer=risk|rainfall|temperature`
Returns standard GeoJSON `FeatureCollection` with 32 polygon cells and explicit `is_synthetic: true` on each feature.

---

## 6. Model Registry & Evaluation

### `GET /models`
Lists all trained algorithms (Persistence, Climatology, SARIMAX, XGBoost, Random Forest, LSTM, GRU, TCN) with real held-out test set MAE, RMSE, F1, and conformal coverage metrics.

### `GET /models/{model_id}/details`
Detailed parameters, feature list, and conformal quantiles for a specific model checkpoint.

---

## 7. Alerts Engine

### `GET /alerts?status=active`
Returns threshold-triggered alerts.

### `POST /alerts/{alert_id}/dismiss`
Persists alert dismissal into MongoDB (or session memory in read-only mode).
- **Body:** `{ "location_id": "C3_003" }`
- **Response 200 OK:**
```json
{
  "alert_id": "ALT_202512_001",
  "status": "dismissed",
  "persisted": true,
  "storage": "MONGODB",
  "message": "Alert successfully dismissed and persisted."
}
```

### `POST /alerts/settings`
Updates custom SPI-3 thresholds.
- **Body:** `{ "critical_threshold_spi": -1.5, "high_threshold_spi": -1.0, "medium_threshold_spi": -0.5 }`

---

## 8. Reports & Data Exports

### `GET /reports`
Lists available report templates and recent jobs.

### `POST /reports/generate`
Generates binary PDF or CSV file stream.
- **Body:** `{ "report_type": "drought_risk", "horizon_months": 1, "format": "pdf" }`
- **Response 200 OK:** `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="..."`

### `GET /export/history.csv`
Streams simulated historical CSV records.

### `GET /export/forecast.csv?horizon_months=1|3|6`
Streams real trained model inference CSV with prediction intervals.
