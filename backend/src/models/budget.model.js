const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Budget extends Model {
    static associate(models) {
      Budget.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Budget.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    }
  }

  Budget.init(
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
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      period: {
        type: DataTypes.ENUM('MONTHLY', 'YEARLY'),
        defaultValue: 'MONTHLY',
      },
      alertThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 80,
        comment: 'Percentage at which to alert',
      },
    },
    {
      sequelize,
      modelName: 'Budget',
      tableName: 'budgets',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['entityId', 'categoryId', 'period'],
        },
      ],
    }
  );
  return Budget;
};
