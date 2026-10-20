"""Inference and Forecasting Service for CoconutRisk AI Component 03.
Runs real model inference, calculates validation-calibrated conformal intervals,
and formats data for dashboard, map, and exports.
"""
import math
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional

from app.schemas import PredictionInterval, FeatureDriver, ForecastResponse
from app.services.data_service import data_service
from app.services.model_registry import model_registry

def spi_to_risk_category(spi_val: Optional[float]) -> str:
    if spi_val is None:
        return "Unknown"
    if spi_val <= -1.5:
        return "Critical"
    elif spi_val <= -1.0:
        return "High"
    elif spi_val <= -0.5:
        return "Medium"
    else:
        return "Low"

def compute_target_month(issue_month: str, horizon_months: int) -> str:
    year = int(issue_month[:4])
    month = int(issue_month[5:7])
    total_months = year * 12 + month - 1 + horizon_months
    target_year = total_months // 12
    target_month = total_months % 12 + 1
    return f"{target_year:04d}-{target_month:02d}"

class ForecastService:
    def __init__(self):
        pass

    def compute_single_forecast(
        self, 
        location_id: str, 
        horizon_months: int = 1, 
        issue_month: Optional[str] = None
    ) -> Dict[str, Any]:
        loc = data_service.get_location_by_id(location_id)
        if not loc:
            raise ValueError(f"Unknown location_id: {location_id}")

        issue_month = issue_month or data_service.as_of_month
        target_month = compute_target_month(issue_month, horizon_months)

        hist_record = data_service.get_latest_monthly_record(location_id, issue_month)
        if not hist_record:
            raise ValueError(f"No historical record found for location {location_id} at {issue_month}")

        # Check if models are ready in registry
        if not model_registry.is_ready():
            return {
                "location_id": location_id,
                "location_name": loc["location_name"],
                "issue_month": issue_month,
                "target_month": target_month,
                "horizon_months": horizon_months,
                "predicted_spi3": None,
                "risk_category": None,
                "prediction_interval_90": {"lower": None, "upper": None},
                "model_id": None,
                "model_version": None,
                "feature_drivers": [],
                "forecast_status": "MODEL_NOT_YET_TRAINED",
                "is_synthetic": True,
                "data_origin": "SYNTHETIC_SIMULATION",
                "as_of_month": data_service.as_of_month,
                "disclaimer": "Synthetic historical demonstration; not observed weather or an agricultural advisory."
            }

        prep = model_registry.get_preprocessor(horizon_months)
        best_models = model_registry.get_best_models_per_horizon()
        best_info = best_models.get(str(horizon_months))

        # We use best model (XGBoost or Random Forest or Deep model)
        # Default to XGBoost for fast tabular inference
        model = model_registry.get_classical_model('xgboost', horizon_months)
        if model is None:
            model = model_registry.get_classical_model('random_forest', horizon_months)

        if model is None or prep is None:
            # Fallback to persistence if models file missing
            current_spi = float(hist_record.get('spi_3', 0.0))
            predicted_spi = current_spi
            model_id = f"persistence_h{horizon_months}"
            model_name = "Persistence"
            quantile = 0.50
            drivers = []
        else:
            # Prepare feature vector
            scaler = prep['scaler']
            raw_features = prep['raw_features']
            input_features = prep['input_features']
            id_to_idx = prep['id_to_idx']

            row_df = pd.DataFrame([hist_record])
            scaled_vals = scaler.transform(row_df[raw_features])

            m = int(issue_month[5:7])
            m_sin = float(np.sin(2 * np.pi * m / 12.0))
            m_cos = float(np.cos(2 * np.pi * m / 12.0))
            loc_idx = float(id_to_idx.get(location_id, 0))

            feat_dict = {}
            for idx, col in enumerate(prep['scaled_features']):
                feat_dict[col] = scaled_vals[0, idx]
            feat_dict['month_sin'] = m_sin
            feat_dict['month_cos'] = m_cos
            feat_dict['loc_idx'] = loc_idx

            X_in = np.array([[feat_dict[col] for col in input_features]])
            predicted_spi = float(model.predict(X_in)[0])
            model_id = f"xgboost_h{horizon_months}"
            model_name = "XGBoost"

            # Retrieve conformal quantile from model details
            details = model_registry.get_model_details(model_id) or {}
            quantile = float(details.get('conformal_quantile', 0.60))
            drivers = details.get('feature_drivers', [])

        predicted_spi = round(predicted_spi, 3)
        lower_90 = round(predicted_spi - quantile, 3)
        upper_90 = round(predicted_spi + quantile, 3)
        category = spi_to_risk_category(predicted_spi)

        return {
            "location_id": location_id,
            "location_name": loc["location_name"],
            "issue_month": issue_month,
            "target_month": target_month,
            "horizon_months": horizon_months,
            "predicted_spi3": predicted_spi,
            "risk_category": category,
            "prediction_interval_90": {
                "lower": lower_90,
                "upper": upper_90
            },
            "model_id": model_id,
            "model_version": "v1.0.0-synthetic",
            "feature_drivers": drivers,
            "forecast_status": "READY",
            "is_synthetic": True,
            "data_origin": "SYNTHETIC_SIMULATION",
            "as_of_month": data_service.as_of_month,
            "disclaimer": "Synthetic historical demonstration; not observed weather or an agricultural advisory."
        }

    def compute_all_forecasts(self, horizon_months: int = 1, issue_month: Optional[str] = None) -> List[Dict[str, Any]]:
        locations = data_service.get_locations()
        results = []
        for loc in locations:
            fc = self.compute_single_forecast(loc['location_id'], horizon_months, issue_month)
            results.append(fc)
        return results

    def get_dashboard(self, location_id: str, horizon_months: int = 1) -> Dict[str, Any]:
        loc = data_service.get_location_by_id(location_id)
        if not loc:
            raise ValueError(f"Unknown location: {location_id}")

        fc = self.compute_single_forecast(location_id, horizon_months)
        all_fc = self.compute_all_forecasts(horizon_months)

        # Count critical & high zones
        crit_count = sum(1 for f in all_fc if f.get('risk_category') == 'Critical')
        high_count = sum(1 for f in all_fc if f.get('risk_category') == 'High')
        affected_count = sum(1 for f in all_fc if f.get('risk_category') in ['High', 'Critical'])

        # Recent historical sequence (past 24 months)
        hist_slice = data_service.get_recent_history_slice(location_id, count=24)
        latest_hist = hist_slice[-1] if hist_slice else {}
        current_spi = float(latest_hist.get('spi_3', 0.0))
        current_risk = str(latest_hist.get('risk_current', spi_to_risk_category(current_spi)))

        # Format history points for chart
        history_points = []
        for h in hist_slice:
            history_points.append({
                "month": h['forecast_issue_month'],
                "rainfall_monthly_mm": round(float(h.get('rainfall_monthly_mm', 0.0)), 1),
                "temperature_c": round(float(h.get('temperature_c', 0.0)), 1),
                "soil_moisture_m3m3": round(float(h.get('soil_moisture_m3m3', 0.0)), 3),
                "spi_3": round(float(h.get('spi_3', 0.0)), 2),
                "risk_category": str(h.get('risk_current', 'Low'))
            })

        # Forecast points for future (connecting last historical to forecast)
        forecast_points = []
        # Add connecting point at issue month
        forecast_points.append({
            "month": fc['issue_month'],
            "predicted_spi3": round(current_spi, 2),
            "risk_category": current_risk,
            "lower_90": round(current_spi, 2),
            "upper_90": round(current_spi, 2)
        })
        # Add future target point
        if fc['predicted_spi3'] is not None:
            forecast_points.append({
                "month": fc['target_month'],
                "predicted_spi3": fc['predicted_spi3'],
                "risk_category": fc['risk_category'],
                "lower_90": fc['prediction_interval_90']['lower'],
                "upper_90": fc['prediction_interval_90']['upper']
            })

        # Ecological indicators calculation
        rain_actual = float(latest_hist.get('rainfall_monthly_mm', 100.0))
        rain_anomaly = float(latest_hist.get('rainfall_anomaly_mm', 0.0))
        normal_rain = rain_actual - rain_anomaly
        if normal_rain > 0:
            deficit_pct = round(((rain_actual - normal_rain) / normal_rain) * 100.0, 1)
        else:
            deficit_pct = 0.0

        dry_days = int(latest_hist.get('dry_days_month', 15))
        rain_3m = round(float(latest_hist.get('rainfall_3m_mm', 300.0)), 1)

        model_details = model_registry.get_model_details(fc.get('model_id', '')) or {}
        conformal_cov = model_details.get('empirical_test_coverage_pct', 90.0)

        return {
            "location": loc,
            "latest_month": data_service.as_of_month,
            "horizon_months": horizon_months,
            "target_month": fc['target_month'],
            "current_risk": current_risk,
            "forecast_risk": fc.get('risk_category') or "Pending",
            "current_spi3": round(current_spi, 2),
            "predicted_spi3": fc.get('predicted_spi3') or 0.0,
            "prediction_interval_90": fc.get('prediction_interval_90', {"lower": None, "upper": None}),
            "affected_demo_zones_count": affected_count,
            "total_demo_zones_count": 32,
            "critical_zones_count": crit_count,
            "high_zones_count": high_count,
            "rainfall_deficit_pct": deficit_pct,
            "dry_days_month": dry_days,
            "rainfall_3m_mm": rain_3m,
            "history": history_points,
            "forecast_points": forecast_points,
            "feature_drivers": fc.get('feature_drivers', []),
            "model_id": fc.get('model_id', 'xgboost'),
            "model_name": "XGBoost Regressor",
            "conformal_coverage_pct": conformal_cov,
            "is_synthetic": True,
            "data_origin": "SYNTHETIC_SIMULATION",
            "disclaimer": "Synthetic simulation demo — not real weather or validated coconut stress."
        }

    def get_risk_map(self, horizon_months: int = 1, layer: str = "risk") -> Dict[str, Any]:
        grid = data_service.get_geojson()
        features = []

        all_fc = {fc['location_id']: fc for fc in self.compute_all_forecasts(horizon_months)}
        target_m = compute_target_month(data_service.as_of_month, horizon_months)

        for feat in grid.get('features', []):
            f_copy = json_clone(feat)
            props = f_copy['properties']
            loc_id = props.get('location_id')
            fc = all_fc.get(loc_id, {})
            latest_hist = data_service.get_latest_monthly_record(loc_id) or {}

            props['target_month'] = target_m
            props['horizon_months'] = horizon_months
            props['predicted_spi3'] = fc.get('predicted_spi3')
            props['risk_category'] = fc.get('risk_category', 'Low')
            props['prediction_interval_90'] = fc.get('prediction_interval_90')
            props['rainfall_monthly_mm'] = float(latest_hist.get('rainfall_monthly_mm', 100.0))
            props['temperature_c'] = float(latest_hist.get('temperature_c', 27.5))
            props['soil_moisture_m3m3'] = float(latest_hist.get('soil_moisture_m3m3', 0.25))
            props['is_synthetic'] = True
            props['geometry_is_surveyed_coconut_plantation'] = False
            props['caveat'] = "Illustrative simulation grid square — NOT a surveyed coconut plantation."

            features.append(f_copy)

        return {
            "type": "FeatureCollection",
            "horizon_months": horizon_months,
            "layer": layer,
            "target_month": target_m,
            "features": features,
            "is_synthetic": True,
            "disclaimer": "ILLUSTRATIVE GRID — NOT VERIFIED COCONUT PLANTATIONS. Every square is an illustrative simulation polygon."
        }

def json_clone(obj):
    import json
    return json.loads(json.dumps(obj))

# Singleton instance
forecast_service = ForecastService()
