
const { Transaction, Category, Alert, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const recurringService = require('../services/recurring.service');

const getDateRange = (req) => {
    const { from, to, month } = req.query;
    
    let start, end;

    if (from && to) {
        start = new Date(from);
        end = new Date(to);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            // Fallback to current month if provided dates are invalid
            const now = new Date();
            start = new Date(now.getFullYear(), now.getMonth(), 1);
            end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
        start = new Date(`${month}-01T00:00:00.000Z`);
        end = new Date(start);
        end.setUTCMonth(end.getUTCMonth() + 1);
        end.setUTCDate(0);
    } else {
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }
    
    // Format to YYYY-MM-DD for DATEONLY match
    const formatDate = (d) => d.toISOString().split('T')[0];

    return {
        startDate: formatDate(start),
        endDate: formatDate(end)
    };
};

exports.getSummary = async (req, res) => {
    try {
        const { entityId } = req.query;
        logger.info(`API Request /stats/summary: ${JSON.stringify(req.query)}`);
        const { startDate, endDate } = getDateRange(req);
        
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        const transactions = await Transaction.findAll({
            where: {
                entityId,
                date: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                },
                status: 'COMPLETED'
            },
            attributes: ['type', 'amount']
        });


        const currentTotals = calculateTotals(transactions);

        // Fetch Previous Period for Delta
        const prevStart = new Date(startDate);
        const prevEnd = new Date(endDate);
        const diffDays = Math.ceil((prevEnd - prevStart) / (1000 * 60 * 60 * 24)) + 1;
        
        const lastPeriodStart = new Date(prevStart.setDate(prevStart.getDate() - diffDays)).toISOString().split('T')[0];
        const lastPeriodEnd = new Date(prevEnd.setDate(prevEnd.getDate() - diffDays)).toISOString().split('T')[0];

        const prevTransactions = await Transaction.findAll({
            where: {
                entityId,
                date: { [Op.between]: [lastPeriodStart, lastPeriodEnd] },
                status: 'COMPLETED'
            },
            attributes: ['type', 'amount']
        });
        const prevTotals = calculateTotals(prevTransactions);

        // Fetch Active Alerts (configured or triggered) with related data
        const activeAlerts = await Alert.findAll({
            where: { 
                entityId, 
                status: { [Op.in]: ['ACTIVE', 'TRIGGERED'] },
                enabled: true
            },
            include: [
                { model: require('../models').Account, as: 'account', attributes: ['name'] },
                { model: require('../models').Category, as: 'category', attributes: ['name'] }
            ],
            limit: 5
        });

        res.json({
            income: currentTotals.income,
            expense: currentTotals.expense,
            savings: currentTotals.income - currentTotals.expense,
            prevIncome: prevTotals.income,
            prevExpense: prevTotals.expense,
            activeAlerts,
            period: { from: startDate, to: endDate },
            prevPeriod: { from: lastPeriodStart, to: lastPeriodEnd }
        });

    } catch (error) {
        logger.error(`Error getting summary: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

const calculateTotals = (transactions) => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'INCOME') income += amt;
        else if (t.type === 'EXPENSE') expense += amt;
    });
    return { income, expense };
};

exports.getCategoryBreakdown = async (req, res) => {
    try {
        const { entityId, type } = req.query; // type: 'EXPENSE' or 'INCOME'
        const { startDate, endDate } = getDateRange(req);
        
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        const targetType = type || 'EXPENSE';

        const whereClause = {
            entityId,
            type: targetType,
            date: {
                [Op.gte]: startDate,
                [Op.lte]: endDate
            },
            status: 'COMPLETED'
        };

        if (req.query.accountIds) {
             const accountIds = req.query.accountIds;
             const ids = Array.isArray(accountIds) ? accountIds : accountIds.split(',');
             if (ids.length > 0) whereClause.accountId = { [Op.in]: ids };
        }

        const breakdown = await Transaction.findAll({
            where: whereClause,
            include: [{
                model: Category,
                as: 'category',
                attributes: ['name', 'color']
            }],
            attributes: [
                'categoryId',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: ['categoryId', 'category.id', 'category.name', 'category.color'],
            order: [[Sequelize.literal('total'), 'DESC']]
        });

        const result = breakdown.map(item => ({
            category: item.category ? item.category.name : 'Uncategorized',
            color: item.category ? item.category.color : '#cbd5e1', // slate-300 default
            total: parseFloat(item.get('total'))
        }));

        res.json(result);

    } catch (error) {
        logger.error(`Error getting category breakdown: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.getRecurring = async (req, res) => {
    try {
        const { entityId } = req.query;
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        const recurring = await recurringService.detectRecurring(entityId);
        res.json(recurring);
    } catch (error) {
        logger.error(`Error getting recurring expenses: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.getCalendarEvents = async (req, res) => {
    try {
        const { entityId, month } = req.query;
        if (!entityId) return res.status(400).json({ message: 'entityId required' });

        // 1. Date Range
        let start;
        if (month && /^\d{4}-\d{2}$/.test(month)) {
            start = new Date(`${month}-01T00:00:00.000Z`);
        } else {
            start = new Date();
            start.setUTCHours(0, 0, 0, 0);
        }
        start.setUTCDate(1);

        const end = new Date(start);
        end.setUTCMonth(end.getUTCMonth() + 1);
        end.setUTCDate(0);

        const startDate = start.toISOString().split('T')[0];
        const endDate = end.toISOString().split('T')[0];

        // 2. Fetch Actual Transactions
        const transactions = await Transaction.findAll({
            where: {
                entityId,
                date: { [Op.between]: [startDate, endDate] },
                status: 'COMPLETED'
            },
            attributes: ['id', 'date', 'amount', 'type', 'description']
        });

        // 3. Fetch Recurring Patterns
        const recurring = await recurringService.detectRecurring(entityId);

        // 4. Project Recurring Events (only for today onwards)
        const todayStr = new Date().toISOString().split('T')[0];
        const projected = [];

        recurring.forEach(pattern => {
            const day = parseInt(pattern.dayOfMonth);
            if (isNaN(day)) return;

            const projDate = new Date(start);
            projDate.setUTCDate(day);
            
            if (isNaN(projDate.getTime())) return;

            const projDateStr = projDate.toISOString().split('T')[0];

            // Only add if it falls in this month AND result is >= today
            // (To avoid showing projection on day 5 if we are on day 20, we assume it's either in transactions or it's passed)
            // But user might want to see missed payments? 
            // Let's simple rule: Show projection if no transaction found on that day/amount? Too complex.
            // Simple rule: Show projection if date >= today.
            
            if (projDate >= start && projDate <= end && projDateStr >= todayStr) {
                projected.push({
                    id: `proj-${pattern.merchantName}-${projDateStr}`,
                    date: projDateStr,
                    amount: pattern.avgAmount,
                    type: 'RECURRING_EXPENSE',
                    description: pattern.merchantName,
                    status: 'PROJECTED'
                });
            }
        });

        // 5. Merge
        const events = [
            ...transactions.map(t => ({
                id: t.id,
                date: t.date,
                amount: parseFloat(t.amount),
                type: t.type,
                description: t.description,
                status: 'COMPLETED'
            })),
            ...projected
        ];

        // Sort by date
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        res.json(events);

    } catch (error) {
        logger.error(`Error getting calendar events: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
exports.getEvolution = async (req, res) => {
    try {
        const { entityId, from, to, accountIds, categoryIds } = req.query;
        logger.info(`[Stats] getEvolution for entity ${entityId}, range: ${from} to ${to}`);
        
        if (!entityId) return res.status(400).json({ message: 'entityId required' });

        const whereClause = {
            entityId,
            status: 'COMPLETED'
        };

        // Date Filter
        if (from && to) {
            whereClause.date = { [Op.between]: [from, to] };
        } else {
             const now = new Date();
             const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
             const endOfYear = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
             whereClause.date = { [Op.between]: [startOfYear, endOfYear] };
        }

        // Account Filter
        if (accountIds) {
            const ids = Array.isArray(accountIds) ? accountIds : accountIds.split(',');
            if (ids.length > 0) whereClause.accountId = { [Op.in]: ids };
        }

        // Category Filter
        if (categoryIds) {
             const ids = Array.isArray(categoryIds) ? categoryIds : categoryIds.split(',');
             if (ids.length > 0) whereClause.categoryId = { [Op.in]: ids };
        }

        logger.info(`[Stats] Where clause: ${JSON.stringify(whereClause)}`);

        const data = await Transaction.findAll({
            where: whereClause,
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
                'type',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'type'],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'ASC']]
        });
        
        logger.info(`[Stats] Found ${data.length} data points`);

        // Transform to friendly format
        // { '2025-01': { income: 0, expense: 0 } }
        const map = {};
        
        data.forEach(d => {
            const month = d.get('month');
            const type = d.type;
            const total = parseFloat(d.get('total'));

            if (!map[month]) map[month] = { month, income: 0, expense: 0 };
            if (type === 'INCOME') map[month].income += total;
            else if (type === 'EXPENSE') map[month].expense += total;
        });

        const result = Object.values(map).sort((a, b) => a.month.localeCompare(b.month));

        res.json(result);

    } catch (error) {
        logger.error(`Error getting evolution stats: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
