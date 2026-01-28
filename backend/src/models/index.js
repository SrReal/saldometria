const Sequelize = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

let sequelize;
if (dbConfig.use_env_variable) {
  sequelize = new Sequelize(process.env[dbConfig.use_env_variable], dbConfig);
} else {
  sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, dbConfig);
}

const db = {};

// Import models explicitly
db.User = require('./user.model')(sequelize);
db.Entity = require('./entity.model')(sequelize);
db.Category = require('./category.model')(sequelize);
db.Account = require('./account.model')(sequelize);
db.Transaction = require('./transaction.model')(sequelize);
db.Rule = require('./rule.model')(sequelize);
db.Budget = require('./budget.model')(sequelize);
db.Goal = require('./goal.model')(sequelize);

// Initialize associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
