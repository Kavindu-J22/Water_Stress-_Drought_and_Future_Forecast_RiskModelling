/**
 * PostgreSQL Database Connection Pool & Schema Initializer
 */
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432', 10),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'Shashini1223@',
  database: process.env.PGDATABASE || 'coconutrisk_c3',
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  max: 10
});

let isConnected = false;

pool.on('connect', () => {
  isConnected = true;
});

pool.on('error', (err) => {
  console.warn('[PostgreSQL Pool Warning]:', err.message);
  isConnected = false;
});

/**
 * Initializes the PostgreSQL database schema if tables do not exist.
 */
async function initDb() {
  const schemaSql = `
    CREATE TABLE IF NOT EXISTS c3_alert_dismissals (
      alert_id VARCHAR(100) PRIMARY KEY,
      location_id VARCHAR(50) NOT NULL,
      dismissed_by VARCHAR(100) DEFAULT 'demo_user',
      dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      reason TEXT DEFAULT 'User acknowledged'
    );

    CREATE TABLE IF NOT EXISTS c3_alert_settings (
      user_id VARCHAR(100) PRIMARY KEY,
      critical_threshold_spi DOUBLE PRECISION DEFAULT -1.5,
      high_threshold_spi DOUBLE PRECISION DEFAULT -1.0,
      medium_threshold_spi DOUBLE PRECISION DEFAULT -0.5,
      notify_email VARCHAR(255) DEFAULT '',
      enable_notifications BOOLEAN DEFAULT TRUE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS c3_report_jobs (
      report_id VARCHAR(100) PRIMARY KEY,
      report_type VARCHAR(100) NOT NULL,
      format VARCHAR(20) DEFAULT 'pdf',
      horizon_months INTEGER DEFAULT 1,
      location_id VARCHAR(50) DEFAULT 'ALL',
      status VARCHAR(50) DEFAULT 'COMPLETED',
      file_name VARCHAR(255) NOT NULL,
      file_size_bytes BIGINT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      is_synthetic BOOLEAN DEFAULT TRUE
    );
  `;

  try {
    const client = await pool.connect();
    try {
      await client.query(schemaSql);
      isConnected = true;
      console.log('[PostgreSQL] Connected and schema initialized (c3_alert_dismissals, c3_alert_settings, c3_report_jobs).');
    } finally {
      client.release();
    }
  } catch (err) {
    isConnected = false;
    console.warn(`[PostgreSQL] Connection warning: ${err.message}. Operating in DEMO READ-ONLY MODE.`);
  }
}

async function query(text, params) {
  return pool.query(text, params);
}

function getDbHealth() {
  return isConnected ? 'CONNECTED' : 'DISCONNECTED_READ_ONLY_MODE';
}

module.exports = {
  pool,
  query,
  initDb,
  getDbHealth,
  isPostgresConnected: () => isConnected
};
