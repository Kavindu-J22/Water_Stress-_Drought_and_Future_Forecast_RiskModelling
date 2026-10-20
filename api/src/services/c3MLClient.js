/**
 * Typed client for internal Python FastAPI C3 ML Service.
 * Internal URL: http://localhost:8001/internal/c3
 */
const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001/internal/c3';

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

const c3MLClient = {
  getHealth: async () => {
    try {
      const res = await mlClient.get('/health');
      return res.data;
    } catch (err) {
      return {
        status: 'DOWN',
        ml_service: 'unreachable',
        models_ready: false,
        data_ready: false,
        trained_models_count: 0,
        error: err.message
      };
    }
  },

  getMetadata: async () => {
    const res = await mlClient.get('/metadata');
    return res.data;
  },

  getLocations: async () => {
    const res = await mlClient.get('/locations');
    return res.data;
  },

  getOverview: async (locationId = 'C3_001') => {
    const res = await mlClient.get('/overview', { params: { location_id: locationId } });
    return res.data;
  },

  getDashboard: async (locationId = 'C3_001', horizonMonths = 1) => {
    const res = await mlClient.get('/dashboard', { 
      params: { location_id: locationId, horizon_months: horizonMonths } 
    });
    return res.data;
  },

  getHistory: async (locationId = 'C3_001', fromMonth, toMonth) => {
    const res = await mlClient.get('/history', { 
      params: { location_id: locationId, from: fromMonth, to: toMonth } 
    });
    return res.data;
  },

  getForecast: async (locationId = 'C3_001', horizonMonths = 1, issueMonth) => {
    const res = await mlClient.get('/forecast', {
      params: { location_id: locationId, horizon_months: horizonMonths, issue_month: issueMonth }
    });
    return res.data;
  },

  getAllForecasts: async (horizonMonths = 1, issueMonth) => {
    const res = await mlClient.get('/forecast/all', {
      params: { horizon_months: horizonMonths, issue_month: issueMonth }
    });
    return res.data;
  },

  getRiskMap: async (horizonMonths = 1, layer = 'risk') => {
    const res = await mlClient.get('/risk-map', {
      params: { horizon_months: horizonMonths, layer }
    });
    return res.data;
  },

  getModels: async () => {
    const res = await mlClient.get('/models');
    return res.data;
  },

  getModelDetails: async (modelId) => {
    const res = await mlClient.get(`/models/${modelId}/details`);
    return res.data;
  },

  getAlerts: async (status = 'active') => {
    const res = await mlClient.get('/alerts', { params: { status } });
    return res.data;
  },

  generateReportStream: async (reportType, horizonMonths = 1, format = 'pdf') => {
    return await mlClient.post('/reports/generate', 
      { report_type: reportType, horizon_months: horizonMonths, format },
      { responseType: 'stream' }
    );
  },

  exportHistoryStream: async (locationId) => {
    return await mlClient.get('/export/history.csv', {
      params: { location_id: locationId },
      responseType: 'stream'
    });
  },

  exportForecastStream: async (horizonMonths = 1) => {
    return await mlClient.get('/export/forecast.csv', {
      params: { horizon_months: horizonMonths },
      responseType: 'stream'
    });
  }
};

module.exports = c3MLClient;
