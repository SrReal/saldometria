const { Transaction, Account, Goal, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

exports.getForecast = async (req, res) => {
    try {
        const { entityId } = req.query;
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        // 1. Calculate Current Balance from Accounts (Source of Truth)
        // We sum the balance of all accounts for this entity
        const totalAccountBalance = await Account.sum('balance', {
            where: { entityId }
        }) || 0;

        const currentBalance = parseFloat(totalAccountBalance);

        // 1b. Calculate Reserved Balance (Goals)
        const goalsReservedResult = await Goal.sum('currentAmount', {
             where: { entityId }
        }) || 0;
        const reserved = parseFloat(goalsReservedResult);
        const available = currentBalance - reserved;

        // 2. Calculate Burn Rate (Last 90 days expenses)
        const today = new Date();
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(today.getDate() - 90);

        const expenses90Days = await Transaction.sum('amount', {
            where: {
                entityId,
                type: 'EXPENSE',
                status: 'COMPLETED',
                date: {
                    [Op.gte]: ninetyDaysAgo,
                    [Op.lte]: today
                }
            }
        }) || 0; // Handle null if no expenses

        // Daily Burn Rate
        const dailyBurnRate = expenses90Days / 90;

        // 3. Project End of Month Balance
        // Find how many days left in current month
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
        
        // If daysLeft is negative (e.g. today is last day?), ensure 0 min
        const validDaysLeft = Math.max(0, daysLeft);

        const projectedSpend = dailyBurnRate * validDaysLeft;
        const projectedBalance = currentBalance - projectedSpend;

        res.json({
            currentBalance,
            reserved,
            available,
            dailyBurnRate,
            daysLeft: validDaysLeft,
            projectedBalance,
            period: {
                burnRateFrom: ninetyDaysAgo.toISOString().split('T')[0],
                burnRateTo: today.toISOString().split('T')[0]
            }
        });

    } catch (error) {
        logger.error(`Error getting forecast: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
