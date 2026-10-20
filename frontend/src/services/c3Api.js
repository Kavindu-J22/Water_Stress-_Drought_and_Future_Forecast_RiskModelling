/**
 * Real API client connecting to Node.js backend (/api/v1/c3/*).
 * Completely replaces all mock Axios implementations with functional REST calls.
 */
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1/c3';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export const c3Api = {
  getHealth: async () => {
    const res = await api.get('/health');
    return res.data;
  },

  getMetadata: async () => {
    const res = await api.get('/metadata');
    return res.data;
  },

  getLocations: async () => {
    const res = await api.get('/locations');
    return res.data;
  },

  getOverview: async (locationId = 'C3_001') => {
    const res = await api.get('/overview', { params: { location_id: locationId } });
    return res.data;
  },

  getDashboard: async (locationId = 'C3_001', horizonMonths = 1) => {
    const res = await api.get('/dashboard', {
      params: { location_id: locationId, horizon_months: horizonMonths }
    });
    return res.data;
  },

  getHistory: async (locationId = 'C3_001', fromMonth, toMonth) => {
    const res = await api.get('/history', {
      params: { location_id: locationId, from: fromMonth, to: toMonth }
    });
    return res.data;
  },

  getForecast: async (locationId = 'C3_001', horizonMonths = 1, issueMonth) => {
    const res = await api.get('/forecast', {
      params: { location_id: locationId, horizon_months: horizonMonths, issue_month: issueMonth }
    });
    return res.data;
  },

  getAllForecasts: async (horizonMonths = 1, issueMonth) => {
    const res = await api.get('/forecast/all', {
      params: { horizon_months: horizonMonths, issue_month: issueMonth }
    });
    return res.data;
  },

  getRiskMap: async (horizonMonths = 1, layer = 'risk') => {
    const res = await api.get('/risk-map', {
      params: { horizon_months: horizonMonths, layer }
    });
    return res.data;
  },

  getModels: async () => {
    const res = await api.get('/models');
    return res.data;
  },

  getModelDetails: async (modelId) => {
    const res = await api.get(`/models/${modelId}/details`);
    return res.data;
  },

  getAlerts: async (status = 'active') => {
    const res = await api.get('/alerts', { params: { status } });
    return res.data;
  },

  dismissAlert: async (alertId, locationId = 'UNKNOWN') => {
    const res = await api.post(`/alerts/${alertId}/dismiss`, { location_id: locationId });
    return res.data;
  },

  saveAlertSettings: async (settings) => {
    const res = await api.post('/alerts/settings', settings);
    return res.data;
  },

  getReports: async () => {
    const res = await api.get('/reports');
    return res.data;
  },

  generateReportDownload: async (reportType, horizonMonths = 1, format = 'pdf') => {
    const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv;charset=utf-8;';
    const response = await api.post('/reports/generate', 
      { report_type: reportType, horizon_months: horizonMonths, format },
      { 
        responseType: 'blob',
        headers: {
          'Accept': format === 'pdf' ? 'application/pdf, */*' : 'text/csv, text/plain, */*'
        }
      }
    );

    // Check if error response was returned as JSON inside blob
    if (response.data && response.data.type === 'application/json') {
      const text = await response.data.text();
      try {
        const err = JSON.parse(text);
        throw new Error(err.message || err.detail || 'Report generation error');
      } catch (parseErr) {
        throw new Error(text || 'Report generation error');
      }
    }

    const blob = new Blob([response.data], { type: mimeType });
    
    // Parse exact filename from Content-Disposition header if provided by server
    let filename = `${reportType}_report_h${horizonMonths}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.${format}`;
    const disposition = response.headers && response.headers['content-disposition'];
    if (disposition) {
      const match = disposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    }, 200);
  },

  getReportDownloadUrl: (reportType, horizonMonths = 1, format = 'pdf') => {
    return `${API_BASE}/reports/download?report_type=${reportType}&horizon_months=${horizonMonths}&format=${format}`;
  },

  getExportHistoryUrl: (locationId) => {
    return `${API_BASE}/export/history.csv${locationId ? `?location_id=${locationId}` : ''}`;
  },

  getExportForecastUrl: (horizonMonths = 1) => {
    return `${API_BASE}/export/forecast.csv?horizon_months=${horizonMonths}`;
  }
};

export default c3Api;
