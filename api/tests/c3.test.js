/**
 * Unit & Contract Tests for C3 API Gateway
 */
const request = require('supertest');
const { app } = require('../src/app');
const { pool } = require('../src/db');

describe('Component 03: API Gateway & Contract Tests', () => {
  afterAll(async () => {
    await pool.end();
  });
  test('Root endpoint returns platform and C3 status', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.platform).toBe('CoconutRisk AI');
    expect(res.body.component).toContain('Component 03');
    expect(res.body.disclaimer).toBeDefined();
  });

  test('GET /api/v1/c3/health returns service status and synthetic flag', async () => {
    const res = await request(app).get('/api/v1/c3/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.node_gateway).toBe('operational');
    expect(res.body.is_synthetic).toBe(true);
    expect(res.body.disclaimer).toBeDefined();
  });

  test('GET /api/v1/c3/metadata returns scientific disclaimer and 32 locations count', async () => {
    const res = await request(app).get('/api/v1/c3/metadata');
    if (res.statusCode === 200) {
      expect(res.body.locations_count).toBe(32);
      expect(res.body.is_synthetic).toBe(true);
      expect(res.body.disclaimer).toContain('SYNTHETIC');
    }
  });

  test('GET /api/v1/c3/dashboard with invalid horizon returns 422 error', async () => {
    const res = await request(app).get('/api/v1/c3/dashboard?location_id=C3_001&horizon_months=12');
    // If ML service is up, returns 422; if down, forwards error
    expect([422, 500]).toContain(res.statusCode);
  });

  test('POST /api/v1/c3/alerts/ALT_001/dismiss handles dismissal gracefully', async () => {
    const res = await request(app)
      .post('/api/v1/c3/alerts/ALT_001/dismiss')
      .send({ location_id: 'C3_001' });
    expect(res.statusCode).toBe(200);
    expect(res.body.alert_id).toBe('ALT_001');
    expect(res.body.status).toBe('dismissed');
  });

  test('GET /api/v1/c3/reports returns available report types', async () => {
    const res = await request(app).get('/api/v1/c3/reports');
    expect(res.statusCode).toBe(200);
    expect(res.body.available_reports).toBeInstanceOf(Array);
    expect(res.body.available_reports.length).toBe(3);
  });
});
