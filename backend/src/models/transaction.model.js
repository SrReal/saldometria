const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Transaction.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
      Transaction.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Nullable as it might not be available or applicable for manual transactions
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('INCOME', 'EXPENSE'),
        allowNull: false,
      },
      // Deprecated source string, keeping for safety but logic should move to accountId
      source: {
        type: DataTypes.STRING,
        defaultValue: 'CASH', 
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'COMPLETED'),
        defaultValue: 'COMPLETED',
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      accountId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow null initially for migration safety/Cash legacy, but UI should enforce
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      timestamps: true,
    }
  );
  return Transaction;
};
