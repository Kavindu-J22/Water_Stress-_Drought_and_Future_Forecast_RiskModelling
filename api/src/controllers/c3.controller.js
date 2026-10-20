/**
 * Express Controller for Component 03: Water Stress, Drought and Future Forecast Risk Modelling
 * Uses PostgreSQL for database persistence.
 */
const db = require('../db');
const c3MLClient = require('../services/c3MLClient');
const C3AlertModel = require('../models/C3Alert');
const C3ReportJobModel = require('../models/C3ReportJob');

// In-memory fallback caches when database is unreachable
const inMemoryDismissedAlerts = new Set();
let inMemorySettings = {
  critical_threshold_spi: -1.5,
  high_threshold_spi: -1.0,
  medium_threshold_spi: -0.5,
  notify_email: '',
  enable_notifications: true
};

const c3Controller = {
  getHealth: async (req, res, next) => {
    try {
      const mlHealth = await c3MLClient.getHealth();
      const pgStatus = db.getDbHealth();

      res.json({
        status: mlHealth.status === 'UP' ? 'UP' : 'DEGRADED',
        node_gateway: 'operational',
        ml_service: mlHealth.ml_service || 'unreachable',
        postgresql: pgStatus,
        database_engine: 'PostgreSQL',
        persistence_mode: pgStatus === 'CONNECTED' ? 'FULL_PERSISTENCE' : 'DEMO_READ_ONLY_MODE',
        artifacts_status: mlHealth.models_ready ? 'TRAINED_MODELS_READY' : 'TRAINING_IN_PROGRESS',
        trained_models_count: mlHealth.trained_models_count || 0,
        as_of_month: mlHealth.as_of_month || '2025-12',
        is_synthetic: true,
        disclaimer: 'Simulated demonstration environment. No real weather or measured coconut tree water stress.'
      });
    } catch (err) {
      next(err);
    }
  },

  getMetadata: async (req, res, next) => {
    try {
      const data = await c3MLClient.getMetadata();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getLocations: async (req, res, next) => {
    try {
      const data = await c3MLClient.getLocations();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getOverview: async (req, res, next) => {
    try {
      const locationId = req.query.location_id || 'C3_001';
      const data = await c3MLClient.getOverview(locationId);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getDashboard: async (req, res, next) => {
    try {
      const locationId = req.query.location_id || 'C3_001';
      const horizonMonths = parseInt(req.query.horizon_months || '1', 10);
      const data = await c3MLClient.getDashboard(locationId, horizonMonths);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getHistory: async (req, res, next) => {
    try {
      const locationId = req.query.location_id || 'C3_001';
      const fromMonth = req.query.from;
      const toMonth = req.query.to;
      const data = await c3MLClient.getHistory(locationId, fromMonth, toMonth);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getForecast: async (req, res, next) => {
    try {
      const locationId = req.query.location_id || 'C3_001';
      const horizonMonths = parseInt(req.query.horizon_months || '1', 10);
      const issueMonth = req.query.issue_month;
      const data = await c3MLClient.getForecast(locationId, horizonMonths, issueMonth);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getAllForecasts: async (req, res, next) => {
    try {
      const horizonMonths = parseInt(req.query.horizon_months || '1', 10);
      const issueMonth = req.query.issue_month;
      const data = await c3MLClient.getAllForecasts(horizonMonths, issueMonth);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getRiskMap: async (req, res, next) => {
    try {
      const horizonMonths = parseInt(req.query.horizon_months || '1', 10);
      const layer = req.query.layer || 'risk';
      const data = await c3MLClient.getRiskMap(horizonMonths, layer);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getModels: async (req, res, next) => {
    try {
      const data = await c3MLClient.getModels();
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getModelDetails: async (req, res, next) => {
    try {
      const { model_id } = req.params;
      const data = await c3MLClient.getModelDetails(model_id);
      res.json(data);
    } catch (err) {
      next(err);
    }
  },

  getAlerts: async (req, res, next) => {
    try {
      const status = req.query.status || 'active';
      const alerts = await c3MLClient.getAlerts(status);

      // Fetch dismissed alert IDs from PostgreSQL
      let dismissedIds = new Set(inMemoryDismissedAlerts);
      if (db.isPostgresConnected()) {
        try {
          const ids = await C3AlertModel.getDismissedAlertIds();
          ids.forEach(id => dismissedIds.add(id));
        } catch (e) {
          console.warn('PostgreSQL query error, using in-memory cache:', e.message);
        }
      }

      const filtered = alerts.filter(a => {
        if (status === 'active') {
          return !dismissedIds.has(a.alert_id);
        }
        return true;
      }).map(a => ({
        ...a,
        is_dismissed: dismissedIds.has(a.alert_id)
      }));

      res.json(filtered);
    } catch (err) {
      next(err);
    }
  },

  dismissAlert: async (req, res, next) => {
    try {
      const { alert_id } = req.params;
      const locationId = req.body.location_id || 'UNKNOWN';

      if (db.isPostgresConnected()) {
        await C3AlertModel.dismissAlert(alert_id, locationId);
        return res.json({
          alert_id,
          status: 'dismissed',
          persisted: true,
          storage: 'POSTGRESQL',
          message: `Alert ${alert_id} successfully dismissed and persisted to PostgreSQL.`
        });
      } else {
        inMemoryDismissedAlerts.add(alert_id);
        return res.json({
          alert_id,
          status: 'dismissed',
          persisted: false,
          storage: 'IN_MEMORY_DEMO',
          message: `Alert ${alert_id} dismissed for this session. (PostgreSQL offline: read-only demo mode).`
        });
      }
    } catch (err) {
      next(err);
    }
  },

  getAlertSettings: async (req, res, next) => {
    try {
      if (db.isPostgresConnected()) {
        const settings = await C3AlertModel.getSettings('default_user');
        if (settings) {
          return res.json({
            status: 'SUCCESS',
            persisted: true,
            storage: 'POSTGRESQL',
            settings
          });
        }
      }
      return res.json({
        status: 'SUCCESS',
        persisted: false,
        storage: db.isPostgresConnected() ? 'POSTGRESQL_DEFAULT' : 'IN_MEMORY_DEMO',
        settings: inMemorySettings
      });
    } catch (err) {
      next(err);
    }
  },

  saveAlertSettings: async (req, res, next) => {
    try {
      const { critical_threshold_spi, high_threshold_spi, medium_threshold_spi, notify_email, enable_notifications } = req.body;

      const newSettings = {
        critical_threshold_spi: Number(critical_threshold_spi) || -1.5,
        high_threshold_spi: Number(high_threshold_spi) || -1.0,
        medium_threshold_spi: Number(medium_threshold_spi) || -0.5,
        notify_email: notify_email || '',
        enable_notifications: enable_notifications !== false
      };

      if (db.isPostgresConnected()) {
        const saved = await C3AlertModel.upsertSettings('default_user', newSettings);
        return res.json({
          status: 'SAVED',
          persisted: true,
          storage: 'POSTGRESQL',
          settings: saved
        });
      } else {
        inMemorySettings = newSettings;
        return res.json({
          status: 'SAVED_IN_MEMORY',
          persisted: false,
          storage: 'IN_MEMORY_DEMO',
          message: 'Settings saved in memory for current session. (PostgreSQL offline).',
          settings: inMemorySettings
        });
      }
    } catch (err) {
      next(err);
    }
  },

  getReports: async (req, res, next) => {
    try {
      const availableTypes = [
        {
          report_type: 'drought_risk',
          title: 'Drought Risk Forecast Report',
          description: 'Comprehensive forecasted SPI-3, risk categories, and 90% conformal intervals across all 32 zones.',
          formats: ['pdf', 'csv']
        },
        {
          report_type: 'environmental_indicators',
          title: 'Environmental Indicators Report',
          description: 'Summary of rainfall, temperature, humidity, solar radiation, soil moisture, and SPI indices.',
          formats: ['pdf', 'csv']
        },
        {
          report_type: 'forecast_accuracy',
          title: 'Model Forecast Accuracy Report',
          description: 'Held-out test set metrics (MAE, RMSE, F1, Conformal 90% Coverage) comparing all models.',
          formats: ['pdf', 'csv']
        }
      ];

      let recentJobs = [];
      if (db.isPostgresConnected()) {
        try {
          recentJobs = await C3ReportJobModel.getRecentJobs(10);
        } catch (e) {
          console.warn('Failed to load recent jobs from PostgreSQL:', e.message);
        }
      }

      res.json({
        available_reports: availableTypes,
        recent_generated_jobs: recentJobs,
        scheduled_reports_status: 'NOT_CONFIGURED_STANDALONE_DEMO',
        is_synthetic: true,
        disclaimer: 'Simulated demonstration reports only.'
      });
    } catch (err) {
      next(err);
    }
  },

  downloadReport: async (req, res, next) => {
    try {
      const report_type = req.query.report_type || 'drought_risk';
      const horizon_months = parseInt(req.query.horizon_months || '1', 10);
      const format = (req.query.format || 'pdf').toLowerCase();
      const streamRes = await c3MLClient.generateReportStream(report_type, horizon_months, format);

      res.setHeader('Content-Type', streamRes.headers['content-type']);
      if (streamRes.headers['content-disposition']) {
        res.setHeader('Content-Disposition', streamRes.headers['content-disposition']);
      }
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
      streamRes.data.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  generateReport: async (req, res, next) => {
    try {
      const { report_type = 'drought_risk', horizon_months = 1, format = 'pdf' } = req.body;
      const streamRes = await c3MLClient.generateReportStream(report_type, horizon_months, format);

      res.setHeader('Content-Type', streamRes.headers['content-type']);
      if (streamRes.headers['content-disposition']) {
        res.setHeader('Content-Disposition', streamRes.headers['content-disposition']);
      }
      res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');

      // Record job in PostgreSQL if available
      if (db.isPostgresConnected()) {
        try {
          const reportId = `REP_${Date.now()}`;
          await C3ReportJobModel.createJob({
            report_id: reportId,
            report_type,
            format,
            horizon_months,
            file_name: `${report_type}_h${horizon_months}.${format}`,
            status: 'COMPLETED'
          });
        } catch (e) {
          console.warn('Failed to record report job in PostgreSQL:', e.message);
        }
      }

      streamRes.data.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  exportHistoryCSV: async (req, res, next) => {
    try {
      const locationId = req.query.location_id;
      const streamRes = await c3MLClient.exportHistoryStream(locationId);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="c3_simulated_history.csv"');
      streamRes.data.pipe(res);
    } catch (err) {
      next(err);
    }
  },

  exportForecastCSV: async (req, res, next) => {
    try {
      const horizonMonths = parseInt(req.query.horizon_months || '1', 10);
      const streamRes = await c3MLClient.exportForecastStream(horizonMonths);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="c3_forecast_h${horizonMonths}.csv"`);
      streamRes.data.pipe(res);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = c3Controller;
