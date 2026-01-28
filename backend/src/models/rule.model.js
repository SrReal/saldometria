const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Rule extends Model {
    static associate(models) {
      Rule.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
      Rule.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    }
  }

  Rule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      pattern: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'Text pattern to match in transaction description'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      entityId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      }
    },
    {
      sequelize,
      modelName: 'Rule',
      tableName: 'rules',
      timestamps: true,
    }
  );
  return Rule;
};
