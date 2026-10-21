# CoconutRisk AI — Component 03: Comprehensive Technical Specification & Implementation Guide

> **MANDATORY SCIENTIFIC PROVENANCE & DATA NOTICE**  
> Component 03 (**Water Stress, Drought and Future Forecast Risk Modelling**) operates over a **100% synthetic, computer-generated parametric simulation** of meteorological time-series for the period 1981–2025 across 32 representative Sri Lankan coconut-growing study locations. Observation records are anchored at **December 2025 (Historical Simulation Baseline)**. Polygons in `coconut_grid.geojson` are illustrative 0.1° squares centered near reference towns and do NOT represent verified cadastral coconut plantations. All forecasts, risk scores, and uncertainty intervals are derived from reproducible machine learning and PyTorch neural network pipelines.

---

## 1. Executive Summary & Component Scope

Component 03 (C3) provides operational multi-horizon forecasting of meteorological drought risk across Sri Lanka's coconut cultivation regions. The system targets three operational forecasting horizons:
- **Horizon 1 Month ($t+1$):** Short-term operational irrigation scheduling and fertilizer timing.
- **Horizon 3 Months ($t+3$):** Seasonal crop stress mitigation and reserve water allocation.
- **Horizon 6 Months ($t+6$):** Strategic disaster preparedness and national yield risk assessment.

The primary target metric is the **Standardized Precipitation Index over a 3-month rolling accumulation window (SPI-3)**, calibrated against a zero-adjusted two-parameter Gamma distribution over the 1981–2010 synthetic reference baseline.

### Domain Boundaries vs Teammate Components
- **Component 01 (C1 - Crop Yield & Export Value):** C1 forecasts coconut yield counts and national export revenues. C3 serves as the upstream environmental risk provider (feeding predicted SPI-3 and drought anomalies into C1).
- **Component 02 (C2 - Drone & Field Crown Yellowing):** C2 uses computer vision and canopy spectral diagnostics to detect visible foliar chlorosis. C3 does NOT classify drone imagery or infer internal physiological tree water pressure.
- **Component 04 (C4 - Cellular Spatial Disease Spread):** C4 models biological pest movements (e.g., Weligama coconut leaf wilt disease). C3 models regional abiotic moisture stress that may predispose palms to pest vulnerability.

---

## 2. Complete Technology Stack

| Layer | Technologies & Libraries | Key Responsibilities |
|---|---|---|
| **Deep Learning & Sequence ML** | **PyTorch 2.x**, PyTorch TCN, Adam Optimizer, MSELoss, Early Stopping | Sequence modeling (LSTM, GRU, TCN) using 12-month lookback windows. |
| **Classical Machine Learning** | **XGBoost 2.x**, **Scikit-Learn 1.3+**, Statsmodels 0.14+ | Gradient Boosted Trees, Random Forest Ensembles, SARIMAX (1,0,1), and Baselines. |
| **Uncertainty Quantification** | **Split Conformal Prediction (inductive)** | Distribution-free, validation-calibrated 90% confidence prediction intervals. |
| **Scientific Data Processing** | **Pandas 2.x**, **NumPy 1.24+**, **SciPy 1.10+**, **Joblib 1.3+** | Feature engineering, lag computation, rolling stats, and artifact serialization. |
| **ML Inference Engine & API** | **FastAPI 0.100+**, **Uvicorn**, **Pydantic v2**, **ReportLab 4.x** | High-performance async ML inference, OpenAPI documentation, and binary PDF/CSV generation. |
| **API Gateway & Backend** | **Node.js 20+**, **Express 4.19+**, **Helmet 7.x**, **CORS**, **Morgan**, **Axios** | Public reverse proxy, security headers, rate limiting (200 req/min), and modular host mounting. |
| **Relational Persistence** | **PostgreSQL 18.6** (Native `pg.Pool`) & **Supabase Cloud PostgreSQL** | Relational storage for alert dismissals, user thresholds, and report job audit trails. |
| **Web Frontend SPA** | **React 18.3**, **Vite 5.2**, **React Router v6.23**, **Tailwind CSS 3.4** | Modern single-page web application with responsive desktop (1440px) and mobile (375px) layouts. |
| **Spatial & Temporal Visualization** | **Leaflet 1.9**, **React-Leaflet 4.2**, **Recharts 2.12**, **Lucide React** | Interactive 32-polygon Sri Lanka risk map, multi-horizon forecast charts with 90% uncertainty bands. |
| **Testing & Quality Assurance** | **Jest 29.7**, **Supertest 7.0**, **PyTest 7.4+** | End-to-end automated contract tests, ML unit tests, and system smoke test orchestrator. |

---

## 3. Covered Functional Requirements (FR-1 through FR-12) & Implementation

### FR-1: Multi-Horizon Meteorological Drought Forecasting
- **Requirement:** Predict future meteorological drought index (SPI-3) at $t+1$, $t+3$, and $t+6$ months ahead from any monthly issue date.
- **Implementation:** Preprocessing pipelines generate multi-lag environmental feature vectors (1M, 3M, 6M antecedent rainfall, temperature deviations, vapor pressure proxies). Deep models ingest $(B, 12, D)$ sliding lookback sequences. Classical models ingest 17 tabular lag features. Models predict continuous $\widehat{\text{SPI-3}}_{t+h}$.

### FR-2: Distribution-Free Uncertainty Quantification (Conformal Prediction)
- **Requirement:** Provide rigorous, finite-sample calibrated prediction intervals at a 90% nominal confidence level without making Gaussian error assumptions.
- **Implementation:** Implemented Split Conformal Prediction in `ml-service/training/make_intervals.py`. Residual non-conformity scores $s_i = |y_i - \hat{y}_i|$ are computed on a held-out calibration split (2018–2022). The $(1-\alpha)$ empirical quantile $\hat{q}$ is calculated:
  $$\hat{q} = \text{Quantile}\left(\{s_i\}, \frac{\lceil(N+1)(1-\alpha)\rceil}{N}\right), \quad \alpha = 0.10$$
  The prediction interval is $[\hat{y} - \hat{q}, \hat{y} + \hat{q}]$, achieving 87.3%–92.5% empirical coverage on untouched test data.

### FR-3: Spatial Representation Across Sri Lankan Coconut Zones
- **Requirement:** Model and visualize spatial drought distribution across major coconut-growing agro-ecological zones (Wet Zone, Intermediate Zone, Dry Zone).
- **Implementation:** 32 representative geographic sites are indexed with coordinates, districts, and climatic zones in `coconut_grid.geojson`. The frontend renders these with interactive Leaflet polygons, tooltips, and click-to-filter mechanics.

### FR-4: Standardized Drought Risk Categorization
- **Requirement:** Classify continuous SPI-3 predictions into discrete, actionable operational risk tiers.
- **Implementation:** Evaluated against standardized international SPI thresholds:
  - **Critical Risk:** $\text{SPI-3} \le -1.50$ (Severe/Extreme moisture deficit; urgent emergency intervention).
  - **High Risk:** $-1.50 < \text{SPI-3} \le -1.00$ (Moderate drought; planned irrigation mandatory).
  - **Medium Risk:** $-1.00 < \text{SPI-3} \le -0.50$ (Mild moisture stress; monitor soil retention).
  - **Low Risk:** $\text{SPI-3} > -0.50$ (Near normal or wet conditions).

### FR-5: Interactive Temporal Dashboard
- **Requirement:** Enable stakeholders to explore 44 years of historical environmental observations (1981–2025) and future projections.
- **Implementation:** [C3Dashboard.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Dashboard.jsx) integrates Recharts dual-axis line charts showing historical SPI-3, predicted SPI-3, upper/lower 90% uncertainty bands, and reference zero/drought threshold lines.

### FR-6: Spatial GeoJSON Risk Map
- **Requirement:** High-level national geographic view showing current and forecasted drought intensity.
- **Implementation:** [C3RiskMap.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3RiskMap.jsx) renders 32 polygons color-coded by risk category (`#dc2626` Critical, `#ea580c` High, `#eab308` Medium, `#16a34a` Low), with horizon toggles (1M/3M/6M) and site detail inspection cards.

### FR-7: Real-Time Alert Engine & Persistent Dismissal
- **Requirement:** Surface active drought alerts for locations exceeding thresholds and allow users to acknowledge/dismiss them persistently.
- **Implementation:** [C3Alerts.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Alerts.jsx) displays alerts grouped by severity. Dismissals call `POST /api/v1/c3/alerts/:id/dismiss`, which executes an upsert into PostgreSQL table `c3_alert_dismissals`. Dismissed alerts are filtered out of subsequent queries.

### FR-8: Custom Threshold Configuration Modal
- **Requirement:** Allow plantation managers and researchers to adjust alert sensitivity thresholds.
- **Implementation:** Interactive modal in [C3Alerts.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Alerts.jsx) allows updating Critical, High, and Medium SPI cutoff values and notification email. Saved via `POST /api/v1/c3/alerts/settings` into PostgreSQL table `c3_alert_settings`.

### FR-9: On-Demand & Automated Audit Reporting
- **Requirement:** Export formal PDF audit summaries and raw tabular CSV data for downstream analytics.
- **Implementation:** [C3Reports.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Reports.jsx) connects to `POST /reports/generate` and direct streaming `GET /reports/download`. Python ReportLab dynamically generates binary PDFs with tables and headers; CSV exports use `utf-8-sig` encoding (UTF-8 with BOM) for clean Microsoft Excel rendering on Windows.

### FR-10: Multi-Model Benchmark & Feature Ablation Analysis
- **Requirement:** Provide transparency on model selection, algorithmic performance, and feature importance.
- **Implementation:** [C3ModelComparison.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3ModelComparison.jsx) presents the full 24-model benchmark leaderboard, MAE/RMSE error comparison charts, and the 4-condition feature ablation study findings.

### FR-11: C1/C2/C4 Host Platform Mountability
- **Requirement:** Operate both as an independent standalone prototype and as a clean mountable sub-application inside teammate systems.
- **Implementation:** 
  - Frontend: [C3HostIntegrationContext.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/context/C3HostIntegrationContext.jsx) toggles `layoutMode: 'host'`, hiding duplicate standalone headers/footers.
  - Backend: [api/src/app.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/app.js) exports `registerC3Routes(expressApp, { prefix, authMiddleware })`, allowing host Express apps to mount C3 routes with one line of code.

### FR-12: Fault-Tolerant Persistence & Read-Only Graceful Degradation
- **Requirement:** Guarantee application availability even if database connectivity is interrupted.
- **Implementation:** [api/src/db/index.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/db/index.js) monitors `pool.on('error')`. If PostgreSQL drops, the API Gateway immediately falls back to in-memory session cache and marks responses with `"persisted": false` and `"storage": "IN_MEMORY_DEMO"` without throwing unhandled exceptions.

---

## 4. Complete File-by-File Technical Directory

### A. Root Directory & Orchestration

| File Name | Primary Technology | Purpose & Implementation | Communication / Exports |
|---|---|---|---|
| [docker-compose.yml](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/docker-compose.yml) | Docker Compose 3.8 | Multi-container production orchestration. Builds `postgres:15-alpine` (`:5432`), `c3-ml-service` (`:8001`), `c3-api-gateway` (`:8000`), and `c3-frontend` (`:5173`). | Maps ports and network bridges between services. |
| [.env](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/.env) | Dotenv Config | Secret configuration: Local PostgreSQL credentials, Supabase credentials, ports, and internal proxy URLs. | Ignored by git; consumed by `api` and `ml-service`. |
| [.env.example](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/.env.example) | Dotenv Template | Sanitized template tracked in git for new repository clones. | Used to generate `.env` on new machines. |
| [.gitignore](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/.gitignore) | Git Rules | Excludes `node_modules/`, `.env`, `dist/`, `__pycache__/` while whitelisting `saved_models/*` and `research-data/*`. | Controls git tracking. |
| [README.md](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/README.md) | Markdown | Project overview, quickstart, empirical benchmark table, and scientific disclaimer. | Primary user landing documentation. |

---

### B. Backend API Gateway (`api/`)

| File Path | Technology | Purpose & Implementation | How It Works / Key Methods |
|---|---|---|---|
| [api/src/app.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/app.js) | Express, Helmet, CORS | Gateway server initialization on port 8000. Configures security headers, rate limiting (200 req/min), and mounts C3 routes. | Calls `initDb()` on startup; exports `registerC3Routes(app, options)`. |
| [api/src/db/index.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/db/index.js) | `pg.Pool` (PostgreSQL) | Connection pooling (max 10, idle 30s) and automated DDL schema migrations. | Auto-creates tables `c3_alert_dismissals`, `c3_alert_settings`, `c3_report_jobs`. Exposes `query()`, `isPostgresConnected()`. |
| [api/src/models/C3Alert.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/models/C3Alert.js) | SQL (PostgreSQL) | Data access layer for alert dismissals and custom SPI thresholds. | Implements `dismissAlert()` (with `ON CONFLICT DO UPDATE`), `getDismissedAlertIds()`, `getSettings()`, `upsertSettings()`. |
| [api/src/models/C3ReportJob.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/models/C3ReportJob.js) | SQL (PostgreSQL) | Data access layer for report audit logs. | Implements `createJob()` and `getRecentJobs(limit)`. |
| [api/src/controllers/c3.controller.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/controllers/c3.controller.js) | Node.js Express Controller | Business logic for all 16 REST endpoints. Merges ML inference with PostgreSQL persistence. | `getHealth()`, `getOverview()`, `getDashboard()`, `getRiskMap()`, `getAlerts()`, `dismissAlert()`, `saveAlertSettings()`, `generateReport()`, `downloadReport()`. |
| [api/src/routes/c3.routes.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/routes/c3.routes.js) | Express Router | Declares REST route paths and maps them to controller methods. | Maps routes under `/api/v1/c3/*`. |
| [api/src/services/c3MLClient.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/services/c3MLClient.js) | Axios Client | Private HTTP proxy client communicating with Python FastAPI on port 8001. | Methods: `getDashboard()`, `getForecast()`, `getRiskMap()`, `getModels()`, `generateReportStream()`, `exportHistoryStream()`. |
| [api/src/middleware/errorHandler.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/src/middleware/errorHandler.js) | Express Middleware | Global centralized error handler. | Intercepts unhandled errors, formats JSON payloads with status codes, and logs server-side warnings. |
| [api/tests/c3.test.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/api/tests/c3.test.js) | Jest, Supertest | Automated contract test suite. | Validates `/health`, `/metadata`, `/reports`, `/alerts`, invalid horizon error handling, and closes `pool.end()` in `afterAll()`. |

---

### C. Machine Learning Inference Service (`ml-service/app/`)

| File Path | Technology | Purpose & Implementation | How It Works / Key Methods |
|---|---|---|---|
| [ml-service/app/main.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/main.py) | FastAPI, Uvicorn | Python ML web service entry point on port 8001. Configures CORS and OpenAPI Swagger UI. | Boots FastAPI application and mounts `/internal/c3` router. |
| [ml-service/app/routers/c3.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/routers/c3.py) | FastAPI APIRouter | Exposes internal HTTP endpoints for inference, catalog, and report generation. | Endpoints: `/health`, `/metadata`, `/locations`, `/dashboard`, `/history`, `/forecast`, `/risk-map`, `/models`, `/reports/generate`. |
| [ml-service/app/schemas.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/schemas.py) | Pydantic v2 | Strict JSON schema definitions and data validation models. | Schemas: `LocationItem`, `ForecastResponse`, `RiskMapFeatureCollection`, `ModelMetricItem`, `ReportGenerateRequest`. |
| [ml-service/app/services/data_service.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/services/data_service.py) | Pandas, GeoJSON | In-memory data store and spatial query service. | Ingests `research-data/` CSV files and GeoJSON. Computes summary stats, baseline parameters, and site history arrays. |
| [ml-service/app/services/model_registry.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/services/model_registry.py) | Joblib, PyTorch, JSON | Model artifact repository and runtime deserializer. | Loads all 24 model weights (`.pt`, `.joblib`), `preprocessor_h*.joblib` scalers, and conformal quantiles from `saved_models/`. |
| [ml-service/app/services/forecast_service.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/services/forecast_service.py) | PyTorch, NumPy | Real-time multi-horizon inference and uncertainty bounding. | Constructs sliding window feature matrices, evaluates top models (GRU/XGBoost), computes $[\hat{y} - \hat{q}, \hat{y} + \hat{q}]$, and tags risk tiers. |
| [ml-service/app/services/report_generator.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/app/services/report_generator.py) | ReportLab, CSV | Dynamic binary PDF and CSV stream generator. | `generate_pdf_report()` builds styled ReportLab tables; `generate_csv_report()` emits `utf-8-sig` byte streams with BOM for Excel. |
| [ml-service/tests/test_c3_ml.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/tests/test_c3_ml.py) | PyTest, HTTPX | Automated test suite for ML service (11 tests). | Tests data integrity, risk thresholds, target month arithmetic, conformal interval math, API endpoints, and PDF/CSV output. |

---

### D. Machine Learning Training Pipeline (`ml-service/training/`)

| File Path | Technology | Purpose & Implementation | How It Works / Key Methods |
|---|---|---|---|
| [ml-service/training/prepare.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/prepare.py) | Pandas, Scikit-Learn | Data preparation, feature engineering, and chronological splitting. | Splits data chronologically: Train (1981–2017), Val (2018–2022), Test (2023–2025). Fits `RobustScaler` and generates lag features. |
| [ml-service/training/train_baselines.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/train_baselines.py) | NumPy, Pandas | Trains and evaluates Persistence ($y_{t+h}=y_t$) and Climatology (monthly mean) baselines. | Evaluates naive benchmarks for horizons 1M, 3M, 6M. |
| [ml-service/training/train_classical.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/train_classical.py) | XGBoost, Scikit-Learn | Trains Random Forest (100 trees) and XGBoost Regressor (150 trees, max_depth=5). | Optimizes tree algorithms across horizons and serializes `.joblib` checkpoints. |
| [ml-service/training/train_sarimax.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/train_sarimax.py) | Statsmodels | Fits SARIMAX (1,0,1) autoregressive econometric models per location. | Fits stationarity parameters and serializes models in `saved_models/`. |
| [ml-service/training/train_deep.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/train_deep.py) | PyTorch (nn.Module) | Implements and trains PyTorch sequence models: `LSTMForecaster`, `GRUForecaster`, `TCNForecaster`. | Sliding sequence dataset ($T=12$), Adam optimizer (lr=0.001), MSELoss, Early Stopping on validation loss. Saves `.pt` weights. |
| [ml-service/training/make_intervals.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/make_intervals.py) | NumPy, SciPy | Split Conformal calibration pipeline. | Computes validation non-conformity scores and stores the 90% quantile cutoff $\hat{q}$ for every model. |
| [ml-service/training/evaluate.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/evaluate.py) | Scikit-Learn, Pandas | Evaluates all 24 models on untouched test split and runs feature ablation studies. | Generates `saved_models/model_metrics.json` and `saved_models/baseline_evaluation.csv`. |
| [ml-service/training/train_all.py](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/ml-service/training/train_all.py) | Python CLI Orchestrator | Single master script that trains the entire machine learning pipeline end-to-end. | Sequentially runs prepare, baselines, classical, deep, intervals, and evaluate. |

---

### E. Frontend Application (`frontend/src/`)

#### 1. Application Core & Layouts
| File Path | Technology | Purpose & Implementation | Communication / Exports |
|---|---|---|---|
| [frontend/src/main.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/main.jsx) | React 18 DOM | Application bootstrap mounting into `#root`. | Wraps `<App />` inside React strict mode. |
| [frontend/src/App.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/App.jsx) | React Router v6 | Main routing structure and layout wrapping. | Defines routes `/c3`, `/c3/dashboard`, `/c3/map`, `/c3/forecast`, `/c3/models`, `/c3/alerts`, `/c3/reports`. |
| [frontend/src/components/layout/Layout.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/components/layout/Layout.jsx) | React, Tailwind | Global layout shell containing Header, Sidebar, main `<Outlet />`, and Footer. | Checks `layoutMode`: renders full chrome in standalone mode; renders bare container in host mode. |
| [frontend/src/components/layout/Header.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/components/layout/Header.jsx) | React, Lucide | Top navigation bar with active alert notification badge counter, mobile drawer toggle, and system status indicator. | Displays live alert count from `C3HostIntegrationContext`. |
| [frontend/src/components/layout/Sidebar.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/components/layout/Sidebar.jsx) | React, React Router | Collapsible sidebar navigation on desktop (240px) and slide-over drawer on mobile. | Provides links to all 7 C3 pages with active route highlighting. |
| [frontend/src/components/layout/Footer.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/components/layout/Footer.jsx) | React | Global footer containing platform copyright, data provenance disclaimers, and version metadata. | Visible at bottom of all pages. |
| [frontend/src/context/C3HostIntegrationContext.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/context/C3HostIntegrationContext.jsx) | React Context API | Manages host mounting state (`standalone` vs `host`), active alert count, and selected site synchronization. | Exported hook `useC3HostIntegration()` used across components. |
| [frontend/src/services/c3Api.js](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/services/c3Api.js) | Axios | Centralized frontend REST API service communicating with Express Gateway on `:8000`. | Implements methods for health, metadata, dashboard, history, forecast, risk map, models, alert dismissals, threshold updates, and blob downloads. |

#### 2. Pages (`frontend/src/pages/c3/`)
| Page Component | Primary Features & Implementation |
|---|---|
| [C3Overview.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Overview.jsx) | **Executive Overview Page:** Hero banner with distinct action buttons ("Launch Risk Dashboard" & "Explore Geo Risk Map"), 4 ecological KPI indicator cards (SPI-3, Rainfall, Temperature, Soil Moisture Proxy), standard risk category legend, and pipeline status summary. |
| [C3Dashboard.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Dashboard.jsx) | **Interactive Time-Series Explorer:** Recharts dual-axis visualization showing 44-year monthly environmental history, forecasted SPI-3 values, 90% split conformal uncertainty bands, location selector (32 sites), horizon toggles (1M/3M/6M), and drought threshold reference lines. |
| [C3RiskMap.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3RiskMap.jsx) | **Geographic Risk Map:** Leaflet interactive map rendering 32 demonstration polygons over Sri Lanka color-coded by drought risk severity, dynamic tooltips, horizon selectors, layer toggles (Risk Category vs Predicted SPI-3), and site detail inspector card. |
| [C3Forecast.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Forecast.jsx) | **Multi-Horizon Projections:** Comprehensive matrix comparing 1M, 3M, and 6M future forecasts across all 32 locations with sorting, risk filter badges, and 90% uncertainty margin ranges. |
| [C3ModelComparison.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3ModelComparison.jsx) | **Scientific Benchmark Leaderboard:** Held-out test split evaluation table for all 24 models (MAE, RMSE, Recall, Precision, Macro F1, 90% Coverage, Width), graphical MAE/RMSE error comparison charts, and feature ablation sensitivity matrix. |
| [C3Alerts.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Alerts.jsx) | **Operational Alert Notification Center:** Active drought alerts categorized by Critical, High, and Medium severity. Allows 1-click persistent dismissal into PostgreSQL and includes an interactive modal to configure custom SPI threshold cutoffs. |
| [C3Reports.jsx](file:///c:/Users/DELL/Downloads/UD%20Reserch%20009%20-%202026/Water_Stress,_Drought_and_Future_Forecast_RiskModelling/frontend/src/pages/c3/C3Reports.jsx) | **Reports & Analytical Exports:** On-demand generation and downloading of binary ReportLab PDF audit summaries and formatted CSV datasets with automated direct streaming fallback and toast confirmations. |

#### 3. Reusable UI Components (`frontend/src/components/ui/` & `c3/`)
- `Button.jsx`: Accessible button component with primary, secondary, outline, danger, ghost variants, loading spinners, and touch target sizing.
- `Card.jsx`: Container card with headers, subtitles, and border styling.
- `Badge.jsx`: Color-coded status badge for risk categories (Critical, High, Medium, Low).
- `Modal.jsx`: Accessible popup dialog with backdrop blur and escape key handling.
- `HorizonTabs.jsx`: Tab switcher for forecast horizons (1M, 3M, 6M).
- `RiskLegend.jsx`: Visual guide explaining SPI-3 threshold ranges and color schemes.
- `DataOriginBanner.jsx`: Standalone provenance banner component (available on-demand for research screens).

---

### F. Datasets & Assets (`research-data/`)

| File Name | Records / Format | Role in the System |
|---|---|---|
| `c3_daily_environmental_1981_2025.csv` | 525,952 daily records | Synthetic daily meteorological records (precipitation, min/max temp, relative humidity, solar radiation, soil moisture). |
| `c3_monthly_drought_dataset_1981_2025.csv` | 17,280 monthly records | Monthly aggregated history for all 32 demo sites containing calculated SPI-1, SPI-3, rolling means, and risk categories. |
| `c3_ml_forecasting_dataset.csv` | 9,600 feature rows | Tabular multi-horizon training matrix containing multi-lag rainfall, temperature anomalies, and lookahead target SPI-3 values. |
| `coconut_grid.geojson` | 32 GeoJSON features | Geometric 0.1° demonstration square polygons centered near reference towns across Sri Lanka with climate zone tags. |

---

## 5. Empirical Machine Learning Benchmarks & Model Evaluation

### Benchmark Leaderboard (Untouched Held-Out Test Partition 2023–2025, N = 1,152)

| Horizon | Model Name | Architecture | Test MAE | Test RMSE | Drought Recall | Precision | Macro F1 | 90% Conformal Coverage | Avg Width | Train Time |
|:---:|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| **1M** | **GRU** (Top Model) | PyTorch 2-layer Recurrent Gated Unit | **0.3625** | **0.4625** | **0.81** | 0.44 | **0.5635** | **92.53%** | 1.68 | 82.2s |
| **1M** | LSTM | PyTorch 2-layer Long Short-Term Memory | 0.3681 | 0.4660 | 0.79 | 0.45 | 0.5694 | 92.27% | 1.69 | 62.6s |
| **1M** | TCN | Temporal Convolutional Net (Dilated D=1,2,4) | 0.3751 | 0.4728 | 0.77 | 0.43 | 0.5481 | 91.41% | 1.72 | 71.9s |
| **1M** | XGBoost | Gradient Boosted Trees (150 trees) | 0.3865 | 0.4871 | 0.78 | 0.44 | 0.5554 | 91.23% | 1.74 | 0.3s |
| **1M** | Random Forest | Ensemble Decision Trees (100 trees) | 0.4083 | 0.5146 | 0.75 | 0.43 | 0.5512 | 90.02% | 1.81 | 1.1s |
| **1M** | Persistence | Naive Lag Baseline: $y_{t+1} = y_t$ | 0.5076 | 0.6518 | 0.69 | 0.42 | 0.5244 | 91.49% | 2.45 | 0.01s |
| **1M** | SARIMAX | Autoregressive (1,0,1) | 0.5212 | 0.6679 | 0.52 | 0.28 | 0.3483 | 91.49% | 2.50 | 0.8s |
| **1M** | Climatology | Seasonal Baseline: Calendar Mean | 0.8410 | 1.0598 | 0.00 | 0.00 | 0.1690 | 86.46% | 3.48 | 0.01s |
| **3M** | **XGBoost** (Top Model) | Gradient Boosted Trees (150 trees) | **0.7008** | **0.8736** | **0.28** | 0.28 | **0.2789** | **90.71%** | 3.03 | 0.3s |
| **3M** | Random Forest | Ensemble Decision Trees (100 trees) | 0.7013 | 0.8730 | 0.25 | 0.24 | 0.2451 | 91.41% | 3.04 | 0.9s |
| **3M** | TCN | Temporal Convolutional Net (Dilated D=1,2,4) | 0.7079 | 0.8939 | 0.26 | 0.28 | 0.2692 | 90.28% | 3.10 | 81.6s |
| **3M** | GRU | PyTorch 2-layer Recurrent Gated Unit | 0.7252 | 0.9186 | 0.28 | 0.30 | 0.2876 | 88.89% | 3.01 | 91.2s |
| **3M** | Persistence | Naive Lag Baseline: $y_{t+3} = y_t$ | 0.9585 | 1.1968 | 0.27 | 0.36 | 0.3080 | 90.80% | 4.38 | 0.01s |
| **6M** | **XGBoost** (Top Model) | Gradient Boosted Trees (150 trees) | **0.7640** | **0.9605** | **0.21** | 0.22 | **0.2125** | **90.71%** | 3.25 | 0.3s |
| **6M** | Random Forest | Ensemble Decision Trees (100 trees) | 0.7640 | 0.9603 | 0.20 | 0.21 | 0.2065 | 91.58% | 3.26 | 0.9s |
| **6M** | GRU | PyTorch 2-layer Recurrent Gated Unit | 0.7688 | 0.9657 | 0.20 | 0.20 | 0.2014 | 92.01% | 3.27 | 102.8s |
| **6M** | Persistence | Naive Lag Baseline: $y_{t+6} = y_t$ | 1.1381 | 1.4020 | 0.24 | 0.25 | 0.2428 | 89.32% | 4.98 | 0.01s |

### Feature Ablation Sensitivity Analysis (Horizon 1M)
- **Full 17-Variable Model:** Test MAE = `0.3936`, Test RMSE = `0.4938`, Macro F1 = `0.5556`.
- **Ablation 1 (Without Soil Moisture Proxy):** Test MAE = `0.3934` (minimal impact; topsoil moisture is largely co-linear with recent rainfall).
- **Ablation 2 (Without Antecedent Rainfall Lags):** Test MAE degrades sharply to **`0.4453`** ($\Delta\text{MAE} = +0.0517$), proving recent 1M, 3M, and 6M cumulative precipitation deficits are the decisive predictive factor.
- **Ablation 3 (Without Spatial Site Index):** Test MAE = `0.3940` (regional climatic zone dynamics explain spatial variation; site-specific categorical embeddings are redundant).

---

## 6. Verification & Automated Test Commands

To verify that the system is fully operational:

```bash
# 1. Health and Database Connectivity
curl http://localhost:8000/api/v1/c3/health

# 2. Automated Python ML Service PyTest Suite (11/11 tests pass)
python -m pytest ml-service/tests/test_c3_ml.py -v

# 3. Automated Node.js Express Gateway Jest Suite (6/6 tests pass)
cd api && npm test && cd ..

# 4. System End-to-End Smoke Test (5/5 phases pass)
python scripts/smoke_test.py
```
