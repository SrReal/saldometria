const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Account extends Model {
    static associate(models) {
      Account.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Account.hasMany(models.Transaction, { foreignKey: 'accountId', as: 'transactions' });
    }
  }

  Account.init(
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
        type: DataTypes.ENUM('CASH', 'BANK', 'CREDIT'),
        defaultValue: 'BANK',
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
      balance: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Account',
      tableName: 'accounts',
      timestamps: true,
    }
  );
  return Account;
};
