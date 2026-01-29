const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Alert extends Model {
    static associate(models) {
      Alert.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Alert.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
      Alert.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Alert.belongsTo(models.Budget, { foreignKey: 'budgetId', as: 'budget' });
    }
  }

  Alert.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('BUDGET_EXCEEDED', 'LOW_BALANCE', 'LARGE_TRANSACTION'),
        allowNull: false,
      },
      threshold: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'TRIGGERED', 'DISMISSED'),
        defaultValue: 'ACTIVE',
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Specifically for LOW_BALANCE or account-locked alerts',
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      budgetId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      message: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastTriggeredAt: {
        type: DataTypes.DATE,
        allowNull: true,
      }
    },
    {
      sequelize,
      modelName: 'Alert',
      tableName: 'alerts',
      timestamps: true,
    }
  );
  return Alert;
};
