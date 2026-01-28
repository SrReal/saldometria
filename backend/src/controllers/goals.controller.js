const { Goal } = require('../models');
const logger = require('../utils/logger');

exports.getGoals = async (req, res) => {
    try {
        const { entityId } = req.query;
        if (!entityId) return res.status(400).json({ message: 'entityId required' });

        const goals = await Goal.findAll({
            where: { entityId },
            order: [['deadline', 'ASC']]
        });
        res.json(goals);
    } catch (error) {
        logger.error(`Error fetching goals: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.createGoal = async (req, res) => {
    try {
        const { entityId, name, targetAmount, currentAmount, deadline, color, icon } = req.body;
        if (!entityId || !name || !targetAmount) {
            return res.status(400).json({ message: 'entityId, name and targetAmount are required' });
        }

        const goal = await Goal.create({
            entityId,
            name,
            targetAmount,
            currentAmount: currentAmount || 0,
            deadline,
            color,
            icon
        });

        res.status(201).json(goal);
    } catch (error) {
        logger.error(`Error creating goal: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, targetAmount, currentAmount, deadline, color, icon } = req.body;

        const goal = await Goal.findByPk(id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        await goal.update({
            name, targetAmount, currentAmount, deadline, color, icon
        });

        res.json(goal);
    } catch (error) {
        logger.error(`Error updating goal: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const goal = await Goal.findByPk(id);
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        await goal.destroy();
        res.json({ message: 'Goal deleted' });
    } catch (error) {
        logger.error(`Error deleting goal: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
