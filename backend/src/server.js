require('dotenv').config();
const app = require('./app');

const logger = require('./utils/logger');

const scheduler = require('./services/scheduler.service');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  scheduler.initSchedulers();
});
