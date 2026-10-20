/**
 * Component 03 Express Routes: /api/v1/c3
 */
const express = require('express');
const router = express.Router();
const c3Controller = require('../controllers/c3.controller');

// Service Status & Metadata
router.get('/health', c3Controller.getHealth);
router.get('/metadata', c3Controller.getMetadata);

// Spatial Locations & Study Sites
router.get('/locations', c3Controller.getLocations);

// High-level Overview for C3 Hero
router.get('/overview', c3Controller.getOverview);

// Main Interactive Dashboard Payload
router.get('/dashboard', c3Controller.getDashboard);

// Historical Simulated Time-Series Records
router.get('/history', c3Controller.getHistory);

// Trained-Model Inference Forecasts
router.get('/forecast', c3Controller.getForecast);
router.get('/forecast/all', c3Controller.getAllForecasts);

// GeoJSON Risk Map Data (32 Illustrative Demo Squares)
router.get('/risk-map', c3Controller.getRiskMap);

// Model Registry, Metrics, and Evaluation Catalog
router.get('/models', c3Controller.getModels);
router.get('/models/:model_id/details', c3Controller.getModelDetails);

// Alert Notification Engine
router.get('/alerts', c3Controller.getAlerts);
router.get('/alerts/settings', c3Controller.getAlertSettings);
router.post('/alerts/settings', c3Controller.saveAlertSettings);
router.post('/alerts/:alert_id/dismiss', c3Controller.dismissAlert);

// Report Generation and Downloads
router.get('/reports', c3Controller.getReports);
router.get('/reports/download', c3Controller.downloadReport);
router.post('/reports/generate', c3Controller.generateReport);

// Genuine CSV Data Exports
router.get('/export/history.csv', c3Controller.exportHistoryCSV);
router.get('/export/forecast.csv', c3Controller.exportForecastCSV);

module.exports = router;
