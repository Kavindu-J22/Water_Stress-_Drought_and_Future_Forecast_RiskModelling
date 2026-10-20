/**
 * PostgreSQL Data Access for C3 Alert Dismissals and Settings
 */
const db = require('../db');

const C3AlertModel = {
  /**
   * Persists an alert dismissal idempotently.
   */
  dismissAlert: async (alertId, locationId, dismissedBy = 'demo_user', reason = 'User acknowledged') => {
    const sql = `
      INSERT INTO c3_alert_dismissals (alert_id, location_id, dismissed_by, dismissed_at, reason)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4)
      ON CONFLICT (alert_id) DO UPDATE SET
        location_id = EXCLUDED.location_id,
        dismissed_by = EXCLUDED.dismissed_by,
        dismissed_at = CURRENT_TIMESTAMP,
        reason = EXCLUDED.reason
      RETURNING *;
    `;
    const res = await db.query(sql, [alertId, locationId, dismissedBy, reason]);
    return res.rows[0];
  },

  /**
   * Retrieves all dismissed alert IDs.
   */
  getDismissedAlertIds: async () => {
    const res = await db.query('SELECT alert_id FROM c3_alert_dismissals;');
    return res.rows.map(r => r.alert_id);
  },

  /**
   * Retrieves alert threshold settings for a user.
   */
  getSettings: async (userId = 'default_user') => {
    const res = await db.query('SELECT * FROM c3_alert_settings WHERE user_id = $1;', [userId]);
    return res.rows[0] || null;
  },

  /**
   * Upserts alert threshold settings.
   */
  upsertSettings: async (userId = 'default_user', settings) => {
    const {
      critical_threshold_spi = -1.5,
      high_threshold_spi = -1.0,
      medium_threshold_spi = -0.5,
      notify_email = '',
      enable_notifications = true
    } = settings;

    const sql = `
      INSERT INTO c3_alert_settings (
        user_id, critical_threshold_spi, high_threshold_spi, medium_threshold_spi, notify_email, enable_notifications, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id) DO UPDATE SET
        critical_threshold_spi = EXCLUDED.critical_threshold_spi,
        high_threshold_spi = EXCLUDED.high_threshold_spi,
        medium_threshold_spi = EXCLUDED.medium_threshold_spi,
        notify_email = EXCLUDED.notify_email,
        enable_notifications = EXCLUDED.enable_notifications,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    const res = await db.query(sql, [
      userId, critical_threshold_spi, high_threshold_spi, medium_threshold_spi, notify_email, enable_notifications
    ]);
    return res.rows[0];
  }
};

module.exports = C3AlertModel;
