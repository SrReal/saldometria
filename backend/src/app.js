const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');

const authRoutes = require('./routes/auth.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

const logger = require('./utils/logger');

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database synchronization
const db = require('./models');
if (process.env.NODE_ENV === 'development') {
  db.sequelize.sync({ alter: { drop: false } }).then(() => {
    logger.info('Database synced');
  });
}

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date() });
});

app.use('/api/auth', authRoutes);
app.use('/api/entities', require('./routes/entity.routes'));
app.use('/api/categories', require('./routes/category.routes'));
app.use('/api/transactions', require('./routes/transaction.routes'));
app.use('/api/accounts', require('./routes/account.routes'));
app.use('/api/import', require('./routes/import.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/stats', require('./routes/stats.routes'));
app.use('/api/rules', require('./routes/rules.routes'));
app.use('/api/budgets', require('./routes/budget.routes'));
app.use('/api/goals', require('./routes/goals.routes'));
app.use('/api/alerts', require('./routes/alert.routes'));



// Error Handler
app.use(errorHandler);

module.exports = app;
