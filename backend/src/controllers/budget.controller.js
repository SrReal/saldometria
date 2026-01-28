const { Budget, Transaction, Category } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Create or Update Budget
exports.upsertBudget = async (req, res) => {
    try {
        const { entityId, categoryId, amount, period } = req.body;

        if (!entityId || !categoryId || !amount) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Check if budget exists
        let budget = await Budget.findOne({
            where: { entityId, categoryId, period: period || 'MONTHLY' }
        });

        if (budget) {
            budget.amount = amount;
            if (req.body.alertThreshold) budget.alertThreshold = req.body.alertThreshold;
            await budget.save();
        } else {
            budget = await Budget.create({
                entityId,
                categoryId,
                amount,
                period: period || 'MONTHLY',
                alertThreshold: req.body.alertThreshold || 80
            });
        }

        res.json(budget);

    } catch (error) {
        logger.error(`Error saving budget: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Get all budgets for entity
exports.getBudgets = async (req, res) => {
    try {
        const { entityId } = req.query;
        if (!entityId) return res.status(400).json({ message: 'entityId required' });

        const budgets = await Budget.findAll({
            where: { entityId },
            include: [{ model: Category, as: 'category' }]
        });

        res.json(budgets);
    } catch (error) {
        logger.error(`Error fetching budgets: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Delete budget
exports.deleteBudget = async (req, res) => {
    try {
        const { id } = req.params;
        const budget = await Budget.findByPk(id);
        if (!budget) return res.status(404).json({ message: 'Budget not found' });

        await budget.destroy();
        res.json({ message: 'Budget deleted' });
    } catch (error) {
        logger.error(`Error deleting budget: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

// Get Budget Status (Comparison vs Actual)
exports.getBudgetStatus = async (req, res) => {
    try {
        const { entityId, month } = req.query; // month format: 'YYYY-MM'
        if (!entityId) return res.status(400).json({ message: 'entityId required' });

        // 1. Determine period range
        const now = month ? new Date(`${month}-01`) : new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // 2. Fetch all Budgets
        const budgets = await Budget.findAll({
            where: { entityId, period: 'MONTHLY' },
            include: [{ model: Category, as: 'category' }]
        });

        // 3. Status Response
        const status = [];

        for (const budget of budgets) {
            // Sum expenses for this category in current period
            const spent = await Transaction.sum('amount', {
                where: {
                    entityId,
                    categoryId: budget.categoryId,
                    type: 'EXPENSE',
                    status: 'COMPLETED',
                    date: { [Op.between]: [start, end] }
                }
            }) || 0;

            status.push({
                budget,
                spent: parseFloat(spent),
                remaining: parseFloat(budget.amount) - parseFloat(spent),
                percent: (spent / budget.amount) * 100
            });
        }

        // Sort by highest percentage usage
        status.sort((a, b) => b.percent - a.percent);

        res.json(status);

    } catch (error) {
        logger.error(`Error calculating budget status: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
