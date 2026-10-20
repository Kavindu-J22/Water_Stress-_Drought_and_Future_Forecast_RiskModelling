# CoconutRisk AI — Component 03 Final Implementation Kit

## Start here

**Included today:** actual generated, reproducible **synthetic** environmental demonstration dataset (525,952 daily records, 17,280 monthly history records, 9,600 ML monthly records), 32 illustrative geographic sites, 1/3/6-month-ahead future SPI-3 targets and chronological splits, baseline comparison results computed from simulation, a complete implementation master prompt, data dictionary, quality report, dataset generator and validation test.

**NOT included or claimed as completed today:** trained LSTM/GRU/TCN models, trained XGBoost/SARIMAX, Node Express API, Python FastAPI service, MongoDB integration, React frontend, real weather field measurements, verified coconut plantation polygons, or scientific validation. The coding-agent master prompt requests that these software components be implemented and tested. Any data-driven model trained on this dataset is a *synthetic-data demonstration*.

## What to do

1. Extract this ZIP into your coding project root.
2. Open **`C3_COMPLETE_IMPLEMENTATION_MASTER_PROMPT.md`**. Paste the full text into an AI coding agent (ChatGPT Work / Cursor / Claude Code / another coding environment), with the unzipped kit available as files.
3. Ask the coding agent to implement the entire monorepo. Require live tests, actual saved model checkpoints, verified backend API endpoints and responsive frontend screenshots before calling it complete.
4. In the resulting monorepo, begin with `ml-service` model training, then `api` and `frontend`; the exact commands are specified in the master prompt and should be written to the finished codebase README.
5. Display the **synthetic simulation disclaimer** in every dashboard, API prediction, report and export.

## Data files

| Path | Purpose | Status |
|---|---|---|
| dataset/environmental_daily.csv.gz | Daily simulated environmental variables 1981–2025 | GENERATED |
| dataset/environmental_daily_preview.csv | First 200 rows of daily file | GENERATED |
| dataset/monthly_reference_1981_2025.csv | Historical monthly simulated environmental records and SPI-1/SPI-3 | GENERATED |
| dataset/drought_monthly_ml.csv | 2001–2025 prediction-ready monthly features/targets | GENERATED |
| dataset/climatology_spi.csv | Fixed 1981–2010 synthetic Gamma parameters, monthly by location | GENERATED |
| dataset/coconut_grid.geojson | 32 synthetic 0.1-degree illustrative squares | GENERATED, NOT TRUE PLANTATIONS |
| dataset/locations_demo.csv | Approximate town reference coordinates (not surveyed plantations) | GENERATED |
| dataset/dataset_splits_summary.csv | Target-date based splits by horizon | GENERATED |
| dataset/baseline_evaluation.csv | Computed baseline test errors (SIMULATED) | GENERATED |
| dataset/source_manifest.csv | Traceable data-origin and public source options | GENERATED |
| dataset/generation_metadata.json | Generator seed and generation date | GENERATED |
| model_ready/{train,validation,test}_h{1,3,6}.csv | 9 horizon-scoped sets; targets cannot cross split boundaries | GENERATED |
| documentation/data_dictionary.xlsx | Field-level variable descriptions and constraints | GENERATED |
| documentation/data_quality_report.pdf | Generated structural QA evidence (NOT field validity) | GENERATED |
| scripts/generate_synthetic_dataset.py | Reproduce all dataset records with stable seed | GENERATED |
| scripts/validate_dataset.py | Validate and produce quality report metadata | GENERATED |
| reference_prompts/*.txt | Uploaded C3 frontend + responsive references | INCLUDED |

### Research limits

- These **are not observed weather records**, despite the geographical town names. Rainfall, temperature, relative humidity, solar radiation, PET proxy and soil-moisture proxy are simulation outputs.
- `coconut_grid.geojson` does **not** prove actual coconut growing areas. A future scientifically grounded version must use an authorized, verified coconut land-use layer.
- `SPI-3` is computed using a reference fit to **synthetic 1981–2010 rainfall**. Its risk classes are demo thresholds and **not** measured crop stress.
- The data finish at **2025-12**; do not call the newest observation 'current' in October 2026 or later.
- No deep learning experiments have run in this package. `baseline_evaluation.csv` is the only computed error metric file here, and only for simple baselines on simulation.
- **Parquet is not included** because pyarrow/fastparquet is not installed in the creation runtime. Use compressed `environmental_daily.csv.gz` directly; it can be converted after installing pyarrow in your own environment.

## Validate/rebuild

```bash
python scripts/validate_dataset.py
python scripts/generate_synthetic_dataset.py
python scripts/validate_dataset.py
```

Python dependencies for rebuilding include `numpy` and `scipy`. A source `pip install -r requirements_data.txt` file is included. Generator will rewrite data files using a deterministic numeric seed; the generation timestamp is intentionally non-deterministic.

## User-facing integration compatibility

The user's reference frontend spec names seven C3 pages and uses Vite/React/Tailwind/Router v6/Recharts/Leaflet/Lucide. The master prompt preserves those names and UI colors. It upgrades three old prototype constraints: mock-only axios → functional APIs; mock data only → trained-model-backed simulated dataset; no integration → host-importable C3 module with no C1/C2/C4 collisions.

## Next task for the coding agent

Paste `C3_COMPLETE_IMPLEMENTATION_MASTER_PROMPT.md` and instruct the agent to **actually build the monorepo, train/evaluate the models, execute tests and show resulting API/UI evidence**. Do not accept fake success notices, imagined model scores or frontend-only components.
