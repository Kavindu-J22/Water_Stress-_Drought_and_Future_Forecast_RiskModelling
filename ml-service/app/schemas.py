"""Pydantic request and response schemas for CoconutRisk AI Component 03.
Strict validation and consistent provenance fields on all outputs.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class PredictionInterval(BaseModel):
    lower: Optional[float] = None
    upper: Optional[float] = None

class FeatureDriver(BaseModel):
    feature: str
    association_pct: float

class HealthResponse(BaseModel):
    status: str
    ml_service: str
    models_ready: bool
    data_ready: bool
    trained_models_count: int
    as_of_month: str
    is_synthetic: bool = True
    disclaimer: str

class MetadataResponse(BaseModel):
    component: str = "Component 03: Water Stress, Drought and Future Forecast Risk Modelling"
    platform: str = "CoconutRisk AI"
    is_synthetic: bool = True
    data_origin: str = "SYNTHETIC_SIMULATION"
    as_of_month: str = "2025-12"
    historical_period: str = "1981-01 to 2025-12"
    forecast_horizons_months: List[int] = [1, 3, 6]
    locations_count: int = 32
    model_types: List[str] = ["Persistence", "Seasonal Climatology", "XGBoost", "Random Forest", "SARIMAX", "LSTM", "GRU", "TCN"]
    disclaimer: str = (
        "100% SYNTHETIC RESEARCH DEMONSTRATION — NOT OBSERVED SRI LANKAN WEATHER, "
        "CONFIRMED COCONUT-LAND-USE BOUNDARIES, OR MEASURED COCONUT PHYSIOLOGICAL STRESS. "
        "NEVER USE AS A REAL-WORLD AGRICULTURAL OR METEOROLOGICAL ADVISORY."
    )

class LocationItem(BaseModel):
    location_id: str
    location_name: str
    district: str
    province: str
    latitude: float
    longitude: float
    zone: str
    data_origin: str = "SYNTHETIC_STUDY_SITE"
    geometry_caveat: str = "Illustrative point coordinate near town center — NOT a verified coconut plantation."

class OverviewResponse(BaseModel):
    location_id: str
    location_name: str
    district: str
    province: str
    latitude: float
    longitude: float
    current_risk: str
    latest_month: str
    rainfall_monthly_mm: float
    temperature_c: float
    relative_humidity_pct: float
    solar_radiation_mj_m2: float
    soil_moisture_m3m3: float
    spi_1: float
    spi_3: float
    is_synthetic: bool = True
    data_origin: str = "SYNTHETIC_SIMULATION"
    disclaimer: str

class MonthlyDataPoint(BaseModel):
    month: str
    rainfall_monthly_mm: float
    temperature_c: float
    soil_moisture_m3m3: float
    spi_3: float
    risk_category: str

class ForecastPoint(BaseModel):
    month: str
    predicted_spi3: float
    risk_category: str
    lower_90: float
    upper_90: float

class DashboardResponse(BaseModel):
    location: LocationItem
    latest_month: str
    horizon_months: int
    target_month: str
    current_risk: str
    forecast_risk: str
    current_spi3: float
    predicted_spi3: float
    prediction_interval_90: PredictionInterval
    affected_demo_zones_count: int
    total_demo_zones_count: int = 32
    critical_zones_count: int
    high_zones_count: int
    rainfall_deficit_pct: float
    dry_days_month: int
    rainfall_3m_mm: float
    history: List[MonthlyDataPoint]
    forecast_points: List[ForecastPoint]
    feature_drivers: List[FeatureDriver]
    model_id: str
    model_name: str
    conformal_coverage_pct: float
    is_synthetic: bool = True
    data_origin: str = "SYNTHETIC_SIMULATION"
    disclaimer: str

class ForecastResponse(BaseModel):
    location_id: str
    location_name: str
    issue_month: str
    target_month: str
    horizon_months: int
    predicted_spi3: Optional[float] = None
    risk_category: Optional[str] = None
    prediction_interval_90: PredictionInterval
    model_id: Optional[str] = None
    model_version: Optional[str] = None
    feature_drivers: List[FeatureDriver] = []
    forecast_status: str
    is_synthetic: bool = True
    data_origin: str = "SYNTHETIC_SIMULATION"
    as_of_month: str = "2025-12"
    disclaimer: str

class AllForecastResponse(BaseModel):
    horizon_months: int
    issue_month: str
    target_month: str
    total_locations: int
    forecasts: List[ForecastResponse]
    model_id: str
    model_name: str
    is_synthetic: bool = True
    data_origin: str = "SYNTHETIC_SIMULATION"
    disclaimer: str

class RiskMapResponse(BaseModel):
    type: str = "FeatureCollection"
    horizon_months: int
    layer: str
    target_month: str
    features: List[Dict[str, Any]]
    is_synthetic: bool = True
    disclaimer: str = "ILLUSTRATIVE GRID — NOT VERIFIED COCONUT PLANTATIONS. Every square is an illustrative simulation polygon."

class ModelItem(BaseModel):
    model_id: str
    model_name: str
    algorithm: str
    horizon_months: int
    mae: float
    rmse: float
    drought_recall: Optional[float] = None
    drought_precision: Optional[float] = None
    macro_f1: Optional[float] = None
    conformal_quantile: Optional[float] = None
    empirical_test_coverage_pct: Optional[float] = None
    average_interval_width: Optional[float] = None
    training_time_seconds: Optional[float] = None
    test_samples: int = 1152
    is_baseline: bool = False

class ModelListResponse(BaseModel):
    models: List[ModelItem]
    best_models_per_horizon: Dict[str, Any]
    ablation_study: List[Dict[str, Any]]
    is_synthetic: bool = True
    disclaimer: str

class AlertItem(BaseModel):
    alert_id: str
    location_id: str
    location_name: str
    district: str
    province: str
    severity: str  # Critical, High, Medium, Low
    risk_category: str
    predicted_spi3: float
    issue_month: str
    target_month: str
    horizon_months: int
    message: str
    status: str = "active"  # active, dismissed
    created_at: str
    is_synthetic: bool = True
    disclaimer: str

class AlertSettingsRequest(BaseModel):
    critical_threshold_spi: float = -1.5
    high_threshold_spi: float = -1.0
    medium_threshold_spi: float = -0.5
    notify_email: Optional[str] = None
    enable_notifications: bool = True

class ReportGenerateRequest(BaseModel):
    report_type: str  # drought_risk, environmental_indicators, forecast_accuracy
    location_id: Optional[str] = "ALL"
    horizon_months: int = 1
    format: str = "pdf"  # pdf, csv
