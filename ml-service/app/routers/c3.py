"""FastAPI Router for CoconutRisk AI Component 03: Internal C3 ML Service.
All endpoints prefixed under /internal/c3/.
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse, Response

from app.schemas import (
    HealthResponse, MetadataResponse, LocationItem, OverviewResponse,
    DashboardResponse, ForecastResponse, AllForecastResponse, RiskMapResponse,
    ModelListResponse, ModelItem, AlertItem, ReportGenerateRequest
)
from app.services.data_service import data_service
from app.services.model_registry import model_registry
from app.services.forecast_service import forecast_service, spi_to_risk_category
from app.services.report_generator import generate_pdf_report, generate_csv_report

router = APIRouter(prefix="/internal/c3", tags=["Component 03 ML Service"])

@router.get("/health", response_model=HealthResponse)
def get_health():
    model_registry.reload()
    ready = model_registry.is_ready()
    count = len(model_registry.get_models())
    return HealthResponse(
        status="UP",
        ml_service="operational",
        models_ready=ready,
        data_ready=True,
        trained_models_count=count,
        as_of_month=data_service.as_of_month,
        is_synthetic=True,
        disclaimer="Simulated demonstration environment. No real weather or measured coconut stress."
    )

@router.get("/metadata", response_model=MetadataResponse)
def get_metadata():
    return MetadataResponse()

@router.get("/locations", response_model=List[LocationItem])
def get_locations():
    locations = data_service.get_locations()
    out = []
    for loc in locations:
        out.append(LocationItem(
            location_id=loc['location_id'],
            location_name=loc['location_name'],
            district=loc['district'],
            province=loc['province'],
            latitude=loc['latitude'],
            longitude=loc['longitude'],
            zone=loc['zone'],
            data_origin="SYNTHETIC_STUDY_SITE",
            geometry_caveat="Illustrative point coordinate near town center — NOT a verified coconut plantation."
        ))
    return out

@router.get("/overview", response_model=OverviewResponse)
def get_overview(location_id: str = Query("C3_001", description="Location ID (e.g. C3_001 to C3_032)")):
    loc = data_service.get_location_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail={"code": "LOCATION_NOT_FOUND", "message": f"Location {location_id} not found"})

    rec = data_service.get_latest_monthly_record(location_id)
    if not rec:
        raise HTTPException(status_code=404, detail={"code": "DATA_NOT_FOUND", "message": f"No records found for {location_id}"})

    spi3 = float(rec.get('spi_3', 0.0))
    risk = str(rec.get('risk_current', spi_to_risk_category(spi3)))

    return OverviewResponse(
        location_id=loc['location_id'],
        location_name=loc['location_name'],
        district=loc['district'],
        province=loc['province'],
        latitude=loc['latitude'],
        longitude=loc['longitude'],
        current_risk=risk,
        latest_month=data_service.as_of_month,
        rainfall_monthly_mm=round(float(rec.get('rainfall_monthly_mm', 0.0)), 1),
        temperature_c=round(float(rec.get('temperature_c', 0.0)), 1),
        relative_humidity_pct=round(float(rec.get('relative_humidity_pct', 0.0)), 1),
        solar_radiation_mj_m2=round(float(rec.get('solar_radiation_mj_m2_total', 0.0)), 1),
        soil_moisture_m3m3=round(float(rec.get('soil_moisture_m3m3', 0.0)), 3),
        spi_1=round(float(rec.get('spi_1', 0.0)), 2),
        spi_3=round(spi3, 2),
        is_synthetic=True,
        data_origin="SYNTHETIC_SIMULATION",
        disclaimer="Simulated research data only. Not official weather or agricultural advisories."
    )

@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    location_id: str = Query("C3_001", description="Location ID (C3_001 to C3_032)"),
    horizon_months: int = Query(1, description="Forecast horizon in months: 1, 3, or 6")
):
    if horizon_months not in (1, 3, 6):
        raise HTTPException(status_code=422, detail={"code": "INVALID_HORIZON", "message": "Horizon must be 1, 3, or 6 months"})
    try:
        return forecast_service.get_dashboard(location_id, horizon_months)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": str(e)})

@router.get("/history")
def get_history(
    location_id: str = Query("C3_001"),
    from_month: Optional[str] = Query(None, alias="from"),
    to_month: Optional[str] = Query(None, alias="to")
):
    loc = data_service.get_location_by_id(location_id)
    if not loc:
        raise HTTPException(status_code=404, detail={"code": "LOCATION_NOT_FOUND", "message": f"Location {location_id} not found"})
    records = data_service.get_history(location_id, from_month, to_month)
    return {
        "location_id": location_id,
        "location_name": loc["location_name"],
        "count": len(records),
        "from": from_month,
        "to": to_month,
        "records": records,
        "is_synthetic": True,
        "data_origin": "SYNTHETIC_SIMULATION"
    }

@router.get("/forecast", response_model=ForecastResponse)
def get_forecast(
    location_id: str = Query("C3_001"),
    horizon_months: int = Query(1),
    issue_month: Optional[str] = Query(None)
):
    if horizon_months not in (1, 3, 6):
        raise HTTPException(status_code=422, detail={"code": "INVALID_HORIZON", "message": "Horizon must be 1, 3, or 6 months"})
    try:
        return forecast_service.compute_single_forecast(location_id, horizon_months, issue_month)
    except ValueError as e:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": str(e)})

@router.get("/forecast/all", response_model=AllForecastResponse)
def get_forecast_all(
    horizon_months: int = Query(1),
    issue_month: Optional[str] = Query(None)
):
    if horizon_months not in (1, 3, 6):
        raise HTTPException(status_code=422, detail={"code": "INVALID_HORIZON", "message": "Horizon must be 1, 3, or 6 months"})
    forecasts = forecast_service.compute_all_forecasts(horizon_months, issue_month)
    target_m = forecasts[0]['target_month'] if forecasts else ""
    return AllForecastResponse(
        horizon_months=horizon_months,
        issue_month=issue_month or data_service.as_of_month,
        target_month=target_m,
        total_locations=len(forecasts),
        forecasts=forecasts,
        model_id=f"xgboost_h{horizon_months}",
        model_name="XGBoost Regressor",
        is_synthetic=True,
        data_origin="SYNTHETIC_SIMULATION",
        disclaimer="Synthetic demonstration forecasts — not validated on observed weather."
    )

@router.get("/risk-map", response_model=RiskMapResponse)
def get_risk_map(
    horizon_months: int = Query(1),
    layer: str = Query("risk", description="risk, rainfall, or temperature")
):
    if horizon_months not in (1, 3, 6):
        raise HTTPException(status_code=422, detail={"code": "INVALID_HORIZON", "message": "Horizon must be 1, 3, or 6 months"})
    return forecast_service.get_risk_map(horizon_months, layer)

@router.get("/models", response_model=ModelListResponse)
def get_models():
    model_registry.reload()
    models = model_registry.get_models()
    best_models = model_registry.get_best_models_per_horizon()
    ablation = model_registry.get_ablation_study()
    return ModelListResponse(
        models=models,
        best_models_per_horizon=best_models,
        ablation_study=ablation,
        is_synthetic=True,
        disclaimer="Synthetic demonstration results — not validated on observed weather or real plantation crop stress."
    )

@router.get("/models/{model_id}/details")
def get_model_details(model_id: str):
    model_registry.reload()
    details = model_registry.get_model_details(model_id)
    if not details:
        raise HTTPException(status_code=404, detail={"code": "MODEL_NOT_FOUND", "message": f"Model {model_id} not found in registry"})
    return details

@router.get("/alerts", response_model=List[AlertItem])
def get_alerts(status: str = Query("active")):
    # Threshold generated demo alerts based on latest forecast
    all_fc = forecast_service.compute_all_forecasts(horizon_months=1)
    alerts = []
    alert_idx = 1
    for fc in all_fc:
        risk = fc.get('risk_category', 'Low')
        if risk in ['Critical', 'High', 'Medium']:
            loc = data_service.get_location_by_id(fc['location_id']) or {}
            msg = f"Projected {risk} environmental drought condition for {fc['location_name']} in {fc['target_month']} (Predicted SPI-3: {fc['predicted_spi3']})."
            alerts.append(AlertItem(
                alert_id=f"ALT_202512_{alert_idx:03d}",
                location_id=fc['location_id'],
                location_name=fc['location_name'],
                district=loc.get('district', ''),
                province=loc.get('province', ''),
                severity=risk,
                risk_category=risk,
                predicted_spi3=float(fc.get('predicted_spi3', 0.0)),
                issue_month=fc['issue_month'],
                target_month=fc['target_month'],
                horizon_months=1,
                message=msg,
                status="active",
                created_at="2025-12-31T23:59:59Z",
                is_synthetic=True,
                disclaimer="Simulated demonstration alert based on synthetic modeling. NOT an official physical disaster warning."
            ))
            alert_idx += 1
    return alerts

@router.post("/reports/generate")
def generate_report(req: ReportGenerateRequest):
    if req.format.lower() == 'csv':
        content_bytes, filename = generate_csv_report(req.report_type, req.horizon_months)
        return Response(
            content=content_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )
    else:
        content_bytes, filename = generate_pdf_report(req.report_type, req.horizon_months)
        return Response(
            content=content_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'}
        )

@router.get("/export/history.csv")
def export_history_csv(location_id: Optional[str] = None):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["# CoconutRisk AI - Simulated Historical Environmental Records (1981-2025)"])
    writer.writerow(["# NOTICE: 100% SYNTHETIC SIMULATION — NOT REAL SRI LANKAN WEATHER"])
    
    locations = [data_service.get_location_by_id(location_id)] if location_id else data_service.get_locations()
    writer.writerow([
        "location_id", "location_name", "forecast_issue_month", "rainfall_monthly_mm", 
        "temperature_c", "relative_humidity_pct", "soil_moisture_m3m3", "spi_1", "spi_3", "risk_current", "is_synthetic"
    ])
    for loc in locations:
        if not loc:
            continue
        hist = data_service.get_history(loc['location_id'])
        for h in hist:
            writer.writerow([
                loc['location_id'], loc['location_name'], h['forecast_issue_month'],
                h.get('rainfall_monthly_mm', ''), h.get('temperature_c', ''),
                h.get('relative_humidity_pct', ''), h.get('soil_moisture_m3m3', ''),
                h.get('spi_1', ''), h.get('spi_3', ''), h.get('risk_current', ''), "1"
            ])
    return Response(
        content=output.getvalue().encode('utf-8'),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="c3_simulated_history.csv"'}
    )

@router.get("/export/forecast.csv")
def export_forecast_csv(horizon_months: int = 1):
    content_bytes, filename = generate_csv_report("drought_risk", horizon_months)
    return Response(
        content=content_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
