# Synthetic Dataset Quality Report

**RESULT: PASS — automated structural checks only.**

> These checks do not establish correctness of real climate records or plantation drought predictions. Every observation is simulated.

- Daily rows: **525,952**
- Historical monthly rows: **17,280**
- Forecasting monthly rows: **9,600**
- Illustrative Sri Lanka locations: **32**
- Climate simulation history: **1981–2025**
- SPI climatology: **synthetic 1981–2010**
- Forecast horizons: **1, 3, 6 months**
- Numerical ranges and date uniqueness: **PASS**
- Daily-to-monthly rainfall reconciliation: **PASS**
- Target-month chronological split and missing future labels: **PASS**

## Current-risk class distribution in model-ready dataset

| Risk class | Records |
|---|---:|
| Critical | 1,107 |
| High | 1,228 |
| Low | 5,584 |
| Medium | 1,681 |

## Actual test-baseline metrics computed on *synthetic* data

| Horizon | Algorithm | N | MAE | RMSE |
|---:|---|---:|---:|---:|
| 1 | Persistence_SPI3 | 1152 | 0.50757 | 0.65179 |
| 1 | Seasonal_Climatology_SPI3 | 1152 | 0.84102 | 1.05985 |
| 3 | Persistence_SPI3 | 1152 | 0.95851 | 1.19679 |
| 3 | Seasonal_Climatology_SPI3 | 1152 | 0.84102 | 1.05985 |
| 6 | Persistence_SPI3 | 1152 | 1.13805 | 1.40197 |
| 6 | Seasonal_Climatology_SPI3 | 1152 | 0.84102 | 1.05985 |

## Exclusions and limitations

- No real CHIRPS, NASA POWER, ERA5-Land, CRI, weather-station or field-stress observations are present.
- The synthetic `coconut_grid.geojson` uses illustrative rectangles near selected towns, not mapped plantations.
- PET and soil moisture are simulated proxies, not measured physiological or physical quantities.
- SPI fits and evaluation metrics assess simulation behavior, not observed Sri Lankan drought forecasting skill.
- Deep learning / ML models have **not yet been trained** in this kit. The master prompt instructs your coding agent to implement and train them.
- Complete responsive frontend and functioning live backend are **not included yet**; the master prompt specifies their implementation.
