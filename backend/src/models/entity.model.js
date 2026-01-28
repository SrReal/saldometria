const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Entity extends Model {
    static associate(models) {
      Entity.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
      Entity.hasMany(models.Category, { foreignKey: 'entityId', as: 'categories' });
      Entity.hasMany(models.Transaction, { foreignKey: 'entityId', as: 'transactions' });
      Entity.hasMany(models.Account, { foreignKey: 'entityId', as: 'accounts' });
    }
  }

  Entity.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('PERSONAL', 'BUSINESS'),
        defaultValue: 'PERSONAL',
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Entity',
      tableName: 'entities',
      timestamps: true,
    }
  );
  return Entity;
};
