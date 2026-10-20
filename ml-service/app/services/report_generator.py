"""Report generation service using ReportLab and standard CSV.
Generates genuine PDF and CSV report files with watermarks and synthetic data warnings.
"""
import io
import os
import csv
import time
from pathlib import Path
from typing import Dict, Any, Tuple
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from app.services.data_service import data_service
from app.services.forecast_service import forecast_service
from app.services.model_registry import model_registry

REPORTS_DIR = Path(__file__).resolve().parents[2] / 'generated_reports'
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

DISCLAIMER_TEXT = (
    "DISCLAIMER: 100% SYNTHETIC RESEARCH DATA - NOT OBSERVED SRI LANKAN WEATHER, "
    "CONFIRMED COCONUT-LAND-USE BOUNDARIES, OR MEASURED TREE WATER STRESS. "
    "DO NOT USE FOR REAL-WORLD AGRICULTURAL OR OPERATIONAL DECISIONS."
)

def generate_csv_report(report_type: str, horizon_months: int = 1) -> Tuple[bytes, str]:
    output = io.StringIO()
    writer = csv.writer(output)
    
    writer.writerow(["# CoconutRisk AI - Component 03: Water Stress, Drought and Future Forecast Risk Modelling"])
    writer.writerow([f"# Report Type: {report_type.upper()}"])
    writer.writerow([f"# Generated UTC: {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}"])
    writer.writerow([f"# {DISCLAIMER_TEXT}"])
    writer.writerow([])
    
    if report_type == 'drought_risk':
        filename = f"drought_risk_forecast_h{horizon_months}_{time.strftime('%Y%m%d')}.csv"
        forecasts = forecast_service.compute_all_forecasts(horizon_months=horizon_months)
        writer.writerow([
            "location_id", "location_name", "district", "province", "issue_month", 
            "target_month", "horizon_months", "predicted_spi3", "risk_category", 
            "interval_lower_90", "interval_upper_90", "model_id", "is_synthetic"
        ])
        for f in forecasts:
            loc = data_service.get_location_by_id(f['location_id']) or {}
            writer.writerow([
                f['location_id'], f['location_name'], loc.get('district', ''), loc.get('province', ''),
                f['issue_month'], f['target_month'], f['horizon_months'],
                f['predicted_spi3'], f['risk_category'],
                f['prediction_interval_90']['lower'], f['prediction_interval_90']['upper'],
                f['model_id'], "1"
            ])
            
    elif report_type == 'forecast_accuracy':
        filename = f"forecast_accuracy_benchmark_{time.strftime('%Y%m%d')}.csv"
        models = model_registry.get_models()
        writer.writerow([
            "model_id", "model_name", "algorithm", "horizon_months", "mae", "rmse", 
            "drought_recall", "drought_precision", "macro_f1", "conformal_coverage_pct", 
            "average_interval_width", "is_synthetic"
        ])
        for m in models:
            writer.writerow([
                m['model_id'], m['model_name'], m['algorithm'], m['horizon_months'],
                m['mae'], m['rmse'], m.get('drought_recall', ''), m.get('drought_precision', ''),
                m.get('macro_f1', ''), m.get('empirical_test_coverage_pct', ''),
                m.get('average_interval_width', ''), "1"
            ])
            
    else:  # environmental_indicators
        filename = f"environmental_indicators_latest_{time.strftime('%Y%m%d')}.csv"
        locations = data_service.get_locations()
        writer.writerow([
            "location_id", "location_name", "district", "province", "month", 
            "rainfall_monthly_mm", "temperature_c", "relative_humidity_pct", 
            "solar_radiation_mj_m2", "soil_moisture_m3m3", "spi_1", "spi_3", "risk_current", "is_synthetic"
        ])
        for loc in locations:
            rec = data_service.get_latest_monthly_record(loc['location_id']) or {}
            writer.writerow([
                loc['location_id'], loc['location_name'], loc['district'], loc['province'],
                rec.get('forecast_issue_month', '2025-12'),
                rec.get('rainfall_monthly_mm', ''), rec.get('temperature_c', ''),
                rec.get('relative_humidity_pct', ''), rec.get('solar_radiation_mj_m2_total', ''),
                rec.get('soil_moisture_m3m3', ''), rec.get('spi_1', ''), rec.get('spi_3', ''),
                rec.get('risk_current', ''), "1"
            ])
            
    return output.getvalue().encode('utf-8-sig'), filename

def generate_pdf_report(report_type: str, horizon_months: int = 1) -> Tuple[bytes, str]:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, leftMargin=36, rightMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'RepTitle', parent=styles['Heading1'], fontSize=18, leading=22, textColor=colors.HexColor('#1B5E20')
    )
    subtitle_style = ParagraphStyle(
        'RepSub', parent=styles['Normal'], fontSize=10, leading=14, textColor=colors.HexColor('#374151')
    )
    banner_style = ParagraphStyle(
        'RepBanner', parent=styles['Normal'], fontSize=8, leading=11, textColor=colors.HexColor('#991B1B'),
        backColor=colors.HexColor('#FEE2E2'), borderPadding=6, spaceBefore=6, spaceAfter=8
    )
    cell_style = ParagraphStyle('RepCell', parent=styles['Normal'], fontSize=8, leading=10)
    head_cell_style = ParagraphStyle('RepHCell', parent=styles['Normal'], fontSize=8, leading=10, textColor=colors.white, fontName='Helvetica-Bold')

    elements = []
    
    # Header
    elements.append(Paragraph("<b>CoconutRisk AI — Research Platform</b>", subtitle_style))
    elements.append(Paragraph(f"Component 03: {report_type.replace('_', ' ').title()} Report", title_style))
    elements.append(Paragraph(f"Generated on {time.strftime('%Y-%m-%d %H:%M UTC')} | Target Horizon: {horizon_months}M | Data As-Of: 2025-12", subtitle_style))
    elements.append(Spacer(1, 6))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#2E7D32'), spaceAfter=8))
    
    # Disclaimer Banner
    elements.append(Paragraph(f"<b>NOTICE:</b> {DISCLAIMER_TEXT}", banner_style))
    elements.append(Spacer(1, 8))
    
    if report_type == 'drought_risk':
        filename = f"drought_risk_report_h{horizon_months}_{time.strftime('%Y%m%d')}.pdf"
        elements.append(Paragraph("<b>Per-Location Forecasted SPI-3 and Environmental Risk Categories</b>", styles['Heading3']))
        elements.append(Spacer(1, 4))
        
        forecasts = forecast_service.compute_all_forecasts(horizon_months=horizon_months)
        table_data = [[
            Paragraph("Location", head_cell_style),
            Paragraph("District", head_cell_style),
            Paragraph("Target Month", head_cell_style),
            Paragraph("Predicted SPI-3", head_cell_style),
            Paragraph("Risk Category", head_cell_style),
            Paragraph("90% Conformal Interval", head_cell_style)
        ]]
        
        for f in forecasts[:20]:  # First 20 for PDF readability
            loc = data_service.get_location_by_id(f['location_id']) or {}
            table_data.append([
                Paragraph(f"{f['location_name']} ({f['location_id']})", cell_style),
                Paragraph(loc.get('district', ''), cell_style),
                Paragraph(f['target_month'], cell_style),
                Paragraph(str(f['predicted_spi3']), cell_style),
                Paragraph(f['risk_category'], cell_style),
                Paragraph(f"[{f['prediction_interval_90']['lower']}, {f['prediction_interval_90']['upper']}]", cell_style)
            ])
            
        t = Table(table_data, colWidths=[110, 80, 75, 75, 75, 120])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
        
    elif report_type == 'forecast_accuracy':
        filename = f"forecast_accuracy_report_{time.strftime('%Y%m%d')}.pdf"
        elements.append(Paragraph("<b>Model Benchmarks and Held-Out Test Set Metrics</b>", styles['Heading3']))
        elements.append(Spacer(1, 4))
        
        models = model_registry.get_models()
        table_data = [[
            Paragraph("Horizon", head_cell_style),
            Paragraph("Model Name", head_cell_style),
            Paragraph("MAE", head_cell_style),
            Paragraph("RMSE", head_cell_style),
            Paragraph("Drought Recall", head_cell_style),
            Paragraph("Macro F1", head_cell_style),
            Paragraph("90% Coverage", head_cell_style)
        ]]
        
        for m in models:
            cov = f"{m.get('empirical_test_coverage_pct', 90)}%"
            rec = f"{m.get('drought_recall', 0.0):.2f}" if m.get('drought_recall') is not None else '-'
            f1 = f"{m.get('macro_f1', 0.0):.2f}" if m.get('macro_f1') is not None else '-'
            table_data.append([
                Paragraph(f"H{m['horizon_months']}M", cell_style),
                Paragraph(m['model_name'], cell_style),
                Paragraph(f"{m['mae']:.4f}", cell_style),
                Paragraph(f"{m['rmse']:.4f}", cell_style),
                Paragraph(rec, cell_style),
                Paragraph(f1, cell_style),
                Paragraph(cov, cell_style)
            ])
            
        t = Table(table_data, colWidths=[55, 130, 65, 65, 75, 65, 80])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1B5E20')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)
        
    else:  # environmental_indicators
        filename = f"environmental_indicators_report_{time.strftime('%Y%m%d')}.pdf"
        elements.append(Paragraph("<b>Recent Historical Ecological Indicators (As of 2025-12)</b>", styles['Heading3']))
        elements.append(Spacer(1, 4))
        
        locations = data_service.get_locations()
        table_data = [[
            Paragraph("Location", head_cell_style),
            Paragraph("Rainfall (mm)", head_cell_style),
            Paragraph("Temp (°C)", head_cell_style),
            Paragraph("Humidity (%)", head_cell_style),
            Paragraph("Soil Moist", head_cell_style),
            Paragraph("SPI-3", head_cell_style),
            Paragraph("Risk", head_cell_style)
        ]]
        for loc in locations[:20]:
            rec = data_service.get_latest_monthly_record(loc['location_id']) or {}
            table_data.append([
                Paragraph(f"{loc['location_name']}", cell_style),
                Paragraph(f"{rec.get('rainfall_monthly_mm', 0):.1f}", cell_style),
                Paragraph(f"{rec.get('temperature_c', 0):.1f}", cell_style),
                Paragraph(f"{rec.get('relative_humidity_pct', 0):.1f}%", cell_style),
                Paragraph(f"{rec.get('soil_moisture_m3m3', 0):.3f}", cell_style),
                Paragraph(f"{rec.get('spi_3', 0):.2f}", cell_style),
                Paragraph(f"{rec.get('risk_current', 'Low')}", cell_style)
            ])
        t = Table(table_data, colWidths=[110, 75, 70, 75, 70, 65, 70])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E7D32')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E5E7EB')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F9FAFB')]),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes, filename
