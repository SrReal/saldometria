const dotenv = require('dotenv');
dotenv.config();
const logger = require('../utils/logger');

let dbConfig = {
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
};

const dbUrl = process.env.DATABASE_URL;

if (dbUrl) {
  try {
    const parsed = new URL(dbUrl);
    dbConfig.username = decodeURIComponent(parsed.username);
    dbConfig.password = decodeURIComponent(parsed.password);
    dbConfig.host = parsed.hostname;
    dbConfig.port = parsed.port ? parseInt(parsed.port, 10) : 3306;
    dbConfig.database = parsed.pathname.replace(/^\//, '');
  } catch (err) {
    // Regex fallback if URL parsing fails on custom schemes
    const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = dbUrl.match(regex);
    if (match) {
      dbConfig.username = match[1];
      dbConfig.password = match[2];
      dbConfig.host = match[3];
      dbConfig.port = parseInt(match[4], 10);
      dbConfig.database = match[5];
    }
  }
} else {
  // Read individual environment variables
  dbConfig.username = process.env.DB_USER || process.env.DB_USERNAME || 'root';
  dbConfig.password = process.env.DB_PASSWORD || process.env.DB_PASS || null;
  dbConfig.database = process.env.DB_NAME || process.env.DB_DATABASE || 'saldometria';
  dbConfig.host = process.env.DB_HOST || '127.0.0.1';
  dbConfig.port = parseInt(process.env.DB_PORT, 10) || 3306;
}

module.exports = {
  development: dbConfig,
  test: { ...dbConfig, logging: false },
  production: { ...dbConfig, logging: false },
};
