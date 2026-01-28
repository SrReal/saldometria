const dotenv = require('dotenv');
dotenv.config();
const logger = require('../utils/logger');

const dbUrl = process.env.DATABASE_URL;
let dbConfig = {};

if (dbUrl) {
  // Parse mysql connection string: mysql://user:pass@host:port/db
  const regex = /mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
  const match = dbUrl.match(regex);
  if (match) {
    dbConfig = {
      username: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5],
      dialect: 'mysql',
      logging: process.env.NODE_ENV === 'development' ? (msg) => logger.debug(msg) : false,
    };
  }
} else {
  // Fallback defaults
  dbConfig = {
    username: 'root',
    password: null,
    database: 'saldometria',
    host: '127.0.0.1',
    dialect: 'mysql',
  };
}

module.exports = {
  development: dbConfig,
  test: { ...dbConfig, logging: false },
  production: { ...dbConfig, logging: false },
};
