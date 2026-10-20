/**
 * PostgreSQL Data Access for C3 Generated Report Tracking
 */
const db = require('../db');

const C3ReportJobModel = {
  createJob: async (job) => {
    const {
      report_id,
      report_type,
      format = 'pdf',
      horizon_months = 1,
      location_id = 'ALL',
      status = 'COMPLETED',
      file_name,
      file_size_bytes = 0,
      is_synthetic = true
    } = job;

    const sql = `
      INSERT INTO c3_report_jobs (
        report_id, report_type, format, horizon_months, location_id, status, file_name, file_size_bytes, is_synthetic, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
      ON CONFLICT (report_id) DO UPDATE SET
        status = EXCLUDED.status,
        file_size_bytes = EXCLUDED.file_size_bytes
      RETURNING *;
    `;
    const res = await db.query(sql, [
      report_id, report_type, format, horizon_months, location_id, status, file_name, file_size_bytes, is_synthetic
    ]);
    return res.rows[0];
  },

  getRecentJobs: async (limit = 10) => {
    const sql = `
      SELECT * FROM c3_report_jobs
      ORDER BY created_at DESC
      LIMIT $1;
    `;
    const res = await db.query(sql, [limit]);
    return res.rows;
  }
};

module.exports = C3ReportJobModel;
