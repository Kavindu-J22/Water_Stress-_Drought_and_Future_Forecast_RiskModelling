# CoconutRisk AI — Component 03: Water Stress, Drought and Future Forecast Risk Modelling

> **MANDATORY SCIENTIFIC & DATA DISCLAIMER**  
> **100% SYNTHETIC RESEARCH SIMULATION:** The accompanying 1981–2025 meteorological time-series dataset (525,952 daily records, 17,280 monthly history records, and 9,600 forecasting ML rows) is a computer-generated stochastic simulation. It is **NOT** observed weather from the Department of Meteorology of Sri Lanka or CRI. The 0.1° demonstration grid cells in `coconut_grid.geojson` are illustrative polygons centered near reference towns, **NOT** certified coconut plantation boundaries. The latest observation is fixed as of **December 2025 (Historical Demo)**. All forecasts are relative to this baseline. Never use for actual agricultural advisories or physical disaster warnings.

---

## Architecture Overview

Component 03 is an end-to-end production-shaped research prototype composed of three interconnected tiers:

```text
coconutrisk-ai/
├── frontend/               # React 18 + Vite + Tailwind CSS + Recharts + Leaflet
├── api/                    # Node.js 20+ Express Gateway + PostgreSQL (pg pool)
├── ml-service/             # Python 3.10+ FastAPI + PyTorch (LSTM, GRU, TCN) + XGBoost
├── research-data/          # Simulated environmental daily & monthly datasets + GeoJSON
├── scripts/                # Smoke tests and pipeline orchestrators
└── docs/                   # API contract, architecture, and integration guide
```

- **Frontend (`:5173`):** React 18 SPA with 7 dedicated pages (`C3Overview`, `C3Dashboard`, `C3RiskMap`, `C3Forecast`, `C3ModelComparison`, `C3Alerts`, `C3Reports`), real-time Leaflet map, Recharts time-series with 90% conformal bands, and responsive layouts (375px mobile, 768px tablet, 1440px desktop).
- **API Gateway (`:8000`):** Node.js Express server routing `/api/v1/c3/*` to internal ML service, managing PostgreSQL persistence for alert dismissals, custom thresholds, and report jobs, with graceful fallback to read-only demonstration mode when PostgreSQL is offline.
- **ML Service (`:8001`):** Python FastAPI engine serving real model inference, validation-calibrated split conformal intervals (90% nominal coverage), and on-demand PDF/CSV report generation.

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Node.js:** v20.0+ (Tested on Node v22)
- **Python:** 3.10+ with `torch`, `fastapi`, `uvicorn`, `xgboost`, `scikit-learn`, `reportlab`, `pandas`
- **PostgreSQL:** Local instance on port `5432` (`localhost:5432`, db: `coconutrisk_c3`) (gracefully operates in in-memory session mode if offline)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Run Automated Model Training Pipeline
Train all 24 models (Persistence, Climatology, SARIMAX, XGBoost, Random Forest, LSTM, GRU, TCN) across horizons 1M, 3M, and 6M, compute conformal quantiles, run ablation studies, and save checkpoints:
```bash
python ml-service/training/train_all.py
```

### 4. Run Automated Smoke Tests & Unit Tests
```bash
# Python End-to-End System Smoke Test
python scripts/smoke_test.py

# Python ML Service PyTest Suite (11 tests)
python -m pytest ml-service/tests/test_c3_ml.py -v

# Node.js Express Gateway Jest Tests (6 tests)
cd api && npm test
```

### 5. Launch Services

#### Terminal 1: Python ML Service (Port 8001)
```bash
cd ml-service
python app/main.py
# OpenAPI documentation available at: http://localhost:8001/docs
```

#### Terminal 2: Node.js API Gateway (Port 8000)
```bash
cd api
node src/app.js
# Health endpoint: http://localhost:8000/api/v1/c3/health
```

#### Terminal 3: React Frontend (Port 5173)
```bash
cd frontend
npm run dev
# Browser UI available at: http://localhost:5173
```

---

## Docker Deployment (Optional)

Run the entire containerized stack via Docker Compose:
```bash
docker compose up --build
```
This boots PostgreSQL (`:5432`), Python ML Service (`:8001`), Node Express Gateway (`:8000`), and Nginx React Frontend (`:5173`).

---

## Empirical Model Benchmark Results

*Measured on untouched held-out simulated test partition (2023–2025, N=1,152 test samples per horizon)*

| Horizon | Model | Architecture | Test MAE | Test RMSE | Drought Recall | Macro F1 | 90% Conformal Coverage | Train Time |
|:---:|---|---|---:|---:|---:|---:|---:|---:|
| **1M** | **GRU** (Top Model) | Deep Recurrent Sequence | **0.3625** | **0.4625** | 0.81 | **0.5635** | **92.53%** | 82.2s |
| **1M** | LSTM | Deep Recurrent Sequence | 0.3681 | 0.4660 | 0.79 | 0.5694 | 92.27% | 62.6s |
| **1M** | TCN | Temporal Convolutional Network | 0.3751 | 0.4728 | 0.77 | 0.5481 | 91.41% | 71.9s |
| **1M** | XGBoost | Gradient Boosted Trees | 0.3865 | 0.4871 | 0.78 | 0.5554 | 91.23% | 0.3s |
| **1M** | Random Forest | Ensemble Decision Trees | 0.4083 | 0.5146 | 0.75 | 0.5512 | 90.02% | 1.1s |
| **1M** | Persistence | Baseline SPI-3(t) | 0.5076 | 0.6518 | 0.69 | 0.5244 | 91.49% | 0.01s |
| **1M** | SARIMAX | Autoregressive (1,0,1) | 0.5212 | 0.6679 | 0.52 | 0.3483 | 91.49% | 0.8s |
| **1M** | Climatology | Seasonal Baseline (SPI~0) | 0.8410 | 1.0598 | 0.00 | 0.1690 | 86.46% | 0.01s |
| **3M** | **XGBoost** (Top Model) | Gradient Boosted Trees | **0.7008** | **0.8736** | 0.28 | **0.2789** | **90.71%** | 0.3s |
| **3M** | Random Forest | Ensemble Decision Trees | 0.7013 | 0.8730 | 0.25 | 0.2451 | 91.41% | 0.9s |
| **3M** | TCN | Temporal Convolutional Network | 0.7079 | 0.8939 | 0.26 | 0.2692 | 90.28% | 81.6s |
| **3M** | GRU | Deep Recurrent Sequence | 0.7252 | 0.9186 | 0.28 | 0.2876 | 88.89% | 91.2s |
| **3M** | Persistence | Baseline SPI-3(t) | 0.9585 | 1.1968 | 0.27 | 0.3080 | 90.80% | 0.01s |
| **6M** | **XGBoost** (Top Model) | Gradient Boosted Trees | **0.7640** | **0.9605** | 0.21 | **0.2125** | **90.71%** | 0.3s |
| **6M** | Random Forest | Ensemble Decision Trees | 0.7640 | 0.9603 | 0.20 | 0.2065 | 91.58% | 0.9s |
| **6M** | GRU | Deep Recurrent Sequence | 0.7688 | 0.9657 | 0.20 | 0.2014 | 92.01% | 102.8s |
| **6M** | Persistence | Baseline SPI-3(t) | 1.1381 | 1.4020 | 0.24 | 0.2428 | 89.32% | 0.01s |

---

## Feature Ablation Analysis (Horizon 1M)

| Experiment Configuration | Input Features | Test MAE | Macro F1 | Key Research Finding |
|---|:---:|:---:|:---:|---|
| **Full Model** | 17 | 0.3936 | 0.5556 | Best overall multivariate predictive accuracy |
| **Without Soil Moisture** | 16 | 0.3934 | 0.5598 | Minimal impact, suggesting proxy redundancy |
| **Without Rainfall Lags** | 13 | **0.4453** | **0.5319** | **Severe degradation (+0.052 MAE)**; demonstrates critical reliance on lagged rainfall signals |
| **Without Location Index** | 16 | 0.3940 | 0.5554 | Mild impact; macro-climatic patterns dominate localized variations |

---

## Inter-Component Host Integration (C1/C2/C4)

To mount Component 03 into the parent CoconutRisk AI platform:

```jsx
// In Host App Router
import { C3ModuleRoutes } from './c3-frontend/src/App';

<Route path="c3/*" element={<C3ModuleRoutes layoutMode="host" apiBase="/api/v1/c3" />} />
```

```javascript
// In Host Express Server
const { registerC3Routes } = require('./c3-api/src/app');
registerC3Routes(hostExpressApp, { prefix: '/api/v1/c3' });
```

See [docs/INTEGRATION_C1_C2_C4.md](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/docs/INTEGRATION_C1_C2_C4.md) for full details.

---

## Documentation Links
- [REST API Contract Specification](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/docs/API_CONTRACT.md)
- [System Architecture & Data Flow](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/docs/ARCHITECTURE.md)
- [C1/C2/C4 Integration Contract](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/docs/INTEGRATION_C1_C2_C4.md)
- [Scientific Scope & Data Disclaimer](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/docs/DATA_DISCLAIMER.md)
