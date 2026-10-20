# CoconutRisk AI — Scientific Scope & Data Provenance Notice

> **MANDATORY READING FOR ALL RESEARCHERS AND OPERATORS**

## 1. 100% Synthetic Nature of Data
The accompanying 1981–2025 meteorological time series provided in this repository (525,952 daily records, 17,280 monthly history records, and 9,600 ML rows) is **100% SYNTHETIC COMPUTER SIMULATION**.
- The numbers were generated using stochastic parametric generators to mimic monsoon seasonality and dry-zone rainfall distributions in Sri Lanka.
- **None of the observations represent true recorded weather station data** from the Department of Meteorology of Sri Lanka, NASA POWER, ERA5-Land, or the Coconut Research Institute (CRI).
- **PET (Potential Evapotranspiration) and soil moisture** are heuristic mathematical proxies, not sensor-measured physical quantities.

## 2. Standardized Precipitation Index (SPI-3)
- The Standardized Precipitation Index for a 3-month window (SPI-3) was calculated by fitting a zero-adjusted Gamma distribution over the **synthetic 1981–2010 baseline** period (`dataset/climatology_spi.csv`).
- Category classification boundaries (`Critical ≤ -1.5`, `High ≤ -1.0`, `Medium ≤ -0.5`, `Low > -0.5`) are illustrative software thresholds. They are **not calibrated crop-stress probabilities** for coconut palms (*Cocos nucifera*).

## 3. Geographic Grid Polygons
- `coconut_grid.geojson` contains 32 arbitrary 0.1° squares centered near Sri Lankan reference towns.
- **These polygons DO NOT delineate actual coconut plantations, certified land-use parcels, or soil association maps.**
- The property `geometry_is_surveyed_coconut_plantation: false` is permanently encoded in every feature.

## 4. Operational Boundaries
- **Component 03 Models Meteorological Drought Risk only.**
- It does not diagnose palm crowns (C2), predict national nut market volumes (C1), or map disease vectors (C4).
- The latest observation in the dataset is **December 2025**. Any forecasts for 2026 are dated relative to this historical simulation horizon.
- Never issue real-time disaster warnings or agricultural advisories using this simulated software prototype.
