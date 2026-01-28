const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Category extends Model {
    static associate(models) {
      Category.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Category.hasMany(models.Transaction, { foreignKey: 'categoryId', as: 'transactions' });
    }
  }

  Category.init(
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
        type: DataTypes.ENUM('INCOME', 'EXPENSE'),
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: '#cbd5e1' // Slate-300 default
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Category',
      tableName: 'categories',
      timestamps: true,
    }
  );
  return Category;
};
