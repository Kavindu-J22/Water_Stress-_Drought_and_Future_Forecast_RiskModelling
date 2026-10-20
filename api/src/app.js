/**
 * CoconutRisk AI - Component 03 API Gateway & Server
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { initDb } = require('./db');
const c3Routes = require('./routes/c3.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 8000;

// Security & Parsing
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  message: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests, please try again later.' }
});
app.use('/api/', apiLimiter);

/**
 * Host Integration Extension Point:
 * Allows teammates (C1, C2, C4) to cleanly register C3 routes on their host Express instance.
 */
function registerC3Routes(expressApp, options = {}) {
  const { authMiddleware, prefix = '/api/v1/c3' } = options;
  if (authMiddleware) {
    expressApp.use(prefix, authMiddleware, c3Routes);
  } else {
    expressApp.use(prefix, c3Routes);
  }
  console.log(`[C3 Integration] Component 03 routes mounted at ${prefix}`);
}

// Mount C3 Routes
registerC3Routes(app);

// Root summary route
app.get('/', (req, res) => {
  res.json({
    platform: "CoconutRisk AI",
    component: "Component 03: Water Stress, Drought and Future Forecast Risk Modelling",
    api_prefix: "/api/v1/c3",
    status: "ONLINE",
    disclaimer: "100% Synthetic research demonstration. Not observed Sri Lankan weather or certified crop advisory."
  });
});

// Error handling middleware
app.use(errorHandler);

// Initialize PostgreSQL Database Connection & Schema
if (process.env.NODE_ENV !== 'test') {
  initDb().catch((err) => {
    console.warn(`[PostgreSQL] Startup notice: ${err.message}`);
  });
}

// Start Server if not imported by test suite
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`CoconutRisk AI - C3 API Gateway running on port ${PORT}`);
    console.log(`API Base: http://localhost:${PORT}/api/v1/c3`);
    console.log(`Health:   http://localhost:${PORT}/api/v1/c3/health`);
    console.log(`========================================================`);
  });
}

module.exports = { app, registerC3Routes };
