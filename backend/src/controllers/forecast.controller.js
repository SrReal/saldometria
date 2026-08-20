const { Transaction, Account, Goal, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const recurringService = require('../services/recurring.service');

exports.getForecast = async (req, res) => {
    try {
        const { entityId, safetyMargin } = req.query;
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        // Safety Margin (%): default 15%
        const marginPercent = !isNaN(parseFloat(safetyMargin)) && parseFloat(safetyMargin) >= 0 
            ? parseFloat(safetyMargin) 
            : 15;

        // 1. Calculate Current Balance from Accounts (Source of Truth)
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
        }) || 0;

        // Daily Burn Rate
        const dailyBurnRate = expenses90Days / 90;
        const monthlyEstimatedSpend = dailyBurnRate * 30;

        // 3. Project End of Month Balance
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        const daysLeft = Math.ceil((endOfMonth - today) / (1000 * 60 * 60 * 24));
        const validDaysLeft = Math.max(0, daysLeft);

        const projectedSpend = dailyBurnRate * validDaysLeft;
        const projectedBalance = currentBalance - projectedSpend;

        // 4. Safety Margin & Recommended Buffer Calculations
        const safetyBufferAmount = (monthlyEstimatedSpend * marginPercent) / 100;
        const recommendedBuffer = monthlyEstimatedSpend + safetyBufferAmount;

        // 5. Detect Upcoming Recurring Bills before month end
        let upcomingBills = [];
        let upcomingBillsTotal = 0;
        try {
            const recurringList = await recurringService.detectRecurring(entityId);
            const todayStr = today.toISOString().split('T')[0];
            const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

            upcomingBills = recurringList.filter(bill => {
                return bill.nextDate >= todayStr && bill.nextDate <= endOfMonthStr;
            });
            upcomingBillsTotal = upcomingBills.reduce((acc, bill) => acc + parseFloat(bill.avgAmount || 0), 0);
        } catch (recErr) {
            logger.warn(`Could not fetch upcoming bills for forecast: ${recErr.message}`);
        }

        // 6. Financial Health Status
        let healthStatus = 'HEALTHY';
        if (available < monthlyEstimatedSpend) {
            healthStatus = 'CRITICAL';
        } else if (available < recommendedBuffer) {
            healthStatus = 'WARNING';
        }

        const healthRatio = recommendedBuffer > 0 ? (available / recommendedBuffer) * 100 : 100;

        res.json({
            currentBalance,
            reserved,
            available,
            dailyBurnRate,
            monthlyEstimatedSpend,
            daysLeft: validDaysLeft,
            projectedSpend,
            projectedBalance,
            safetyMarginPercent: marginPercent,
            safetyBufferAmount,
            recommendedBuffer,
            upcomingBills,
            upcomingBillsTotal,
            healthStatus,
            healthRatio: Math.round(healthRatio),
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
