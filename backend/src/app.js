const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const db = require('./models');

const app = express();

// Trust proxy (behind Nginx / Reverse Proxy)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet());

// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server) or in development
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request Logging
app.use(morgan('combined', {
  stream: { write: message => logger.info(message.trim()) },
  skip: (req) => req.path === '/api/health' // Skip healthcheck to keep logs clean
}));

// Body Parsers with payload size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Rate Limiters
const isTestEnv = process.env.NODE_ENV === 'test';
const passThrough = (req, res, next) => next();

const globalLimiter = isTestEnv ? passThrough : rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many requests, please try again later.' }
});

const authLimiter = isTestEnv ? passThrough : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Too many login/register attempts. Please wait 15 minutes.' }
});

const importLimiter = isTestEnv ? passThrough : rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 uploads per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, message: 'Upload limit reached. Please wait before uploading more files.' }
});

app.use('/api/', globalLimiter);

// Database synchronization (Development only)
if (process.env.NODE_ENV === 'development') {
  db.sequelize.sync({ alter: { drop: false } }).then(() => {
    logger.info('Database synced in development mode');
  }).catch(err => {
    logger.error(`Database sync error: ${err.message}`);
  });
}

// Healthcheck Route (with DB connectivity probe)
app.get('/api/health', async (req, res) => {
  try {
    await db.sequelize.authenticate();
    res.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error(`Healthcheck failed: ${error.message}`);
    res.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      message: process.env.NODE_ENV === 'production' ? 'Database service unavailable' : error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/entities', require('./routes/entity.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/accounts', require('./routes/account.routes'));
app.use('/api/import', importLimiter, require('./routes/import.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/rules', require('./routes/rules.routes'));
app.use('/api/budgets', require('./routes/budget.routes'));
app.use('/api/goals', require('./routes/goals.routes'));
app.use('/api/alerts', require('./routes/alert.routes'));

// Error Handler
app.use(errorHandler);

module.exports = app;
