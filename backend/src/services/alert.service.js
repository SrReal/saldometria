const { Alert, Transaction, Budget, Account, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * Checks if a low balance alert should be triggered for an account.
 */
exports.checkAccountBalance = async (accountId) => {
    try {
        const account = await Account.findByPk(accountId);
        if (!account) return;

        const alerts = await Alert.findAll({
            where: {
                accountId,
                type: 'LOW_BALANCE',
                enabled: true,
                status: { [Op.ne]: 'TRIGGERED' } // Only if not already triggered (to avoid spam)
            }
        });

        for (const alert of alerts) {
            if (parseFloat(account.balance) <= parseFloat(alert.threshold)) {
                await alert.update({
                    status: 'TRIGGERED',
                    message: `Saldo bajo en ${account.name}: ${account.balance}`,
                    lastTriggeredAt: new Date()
                });
                logger.info(`Alert TRIGGERED: Low balance on account ${accountId}`);
            }
        }
    } catch (error) {
        logger.error(`Error checking account alerts: ${error.message}`);
    }
};

/**
 * Checks if a budget limit is nearing or exceeded.
 */
exports.checkBudgetAlerts = async (entityId, categoryId) => {
    try {
        // 1. Find budget for this category
        const budget = await Budget.findOne({
            where: { entityId, categoryId, period: 'MONTHLY' }
        });
        if (!budget) return;

        // 2. Calculate current month spending
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const totalSpent = await Transaction.sum('amount', {
            where: {
                entityId,
                categoryId,
                type: 'EXPENSE',
                date: { [Op.gte]: startOfMonth },
                status: 'COMPLETED'
            }
        }) || 0;

        const limit = parseFloat(budget.amount);
        const thresholdPercent = budget.alertThreshold || 80;
        const thresholdValue = (limit * thresholdPercent) / 100;

        if (totalSpent >= thresholdValue) {
            // Find an existing alert rule/record for this budget
            let alert = await Alert.findOne({
                where: {
                    entityId,
                    budgetId: budget.id,
                    type: 'BUDGET_EXCEEDED'
                }
            });

            if (!alert) {
                alert = await Alert.create({
                    entityId,
                    budgetId: budget.id,
                    type: 'BUDGET_EXCEEDED',
                    threshold: thresholdValue,
                    status: 'ACTIVE',
                    enabled: true
                });
            }

            // Trigger if not already triggered this month or if dismissed
            const lastMonthLabel = alert.lastTriggeredAt ? alert.lastTriggeredAt.toISOString().slice(0, 7) : null;
            const currentMonthLabel = now.toISOString().slice(0, 7);

            if (alert.enabled && (alert.status !== 'TRIGGERED' || lastMonthLabel !== currentMonthLabel)) {
                await alert.update({
                    status: 'TRIGGERED',
                    message: `Presupuesto de ${budget.period} excedido (${thresholdPercent}% alcanzado) en categoría ${categoryId}`,
                    lastTriggeredAt: now
                });
                logger.info(`Alert TRIGGERED: Budget limit for category ${categoryId}`);
            }
        }
    } catch (error) {
        logger.error(`Error checking budget alerts: ${error.message}`);
    }
};

/**
 * Checks for large transactions.
 */
exports.checkLargeTransaction = async (transaction) => {
    try {
        const { entityId, amount, description } = transaction;
        const threshold = 1000; // Hardcoded or fetch from generic alert rule

        if (parseFloat(amount) >= threshold) {
            await Alert.create({
                entityId,
                type: 'LARGE_TRANSACTION',
                threshold,
                status: 'TRIGGERED',
                message: `Transacción grande detectada: ${amount} en ${description}`,
                lastTriggeredAt: new Date()
            });
            logger.info(`Alert TRIGGERED: Large transaction ${amount}`);
        }
    } catch (error) {
        logger.error(`Error checking large transaction alert: ${error.message}`);
    }
};
