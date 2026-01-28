module.exports = (sequelize) => {
    const { DataTypes } = require('sequelize');

    const Goal = sequelize.define('Goal', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        targetAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        currentAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        deadline: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        color: {
            type: DataTypes.STRING,
            defaultValue: '#3b82f6' // blue-500
        },
        icon: {
            type: DataTypes.STRING,
            allowNull: true
        }
    });

    Goal.associate = (models) => {
        Goal.belongsTo(models.Entity, { foreignKey: 'entityId', as: 'entity' });
    };

    return Goal;
};
