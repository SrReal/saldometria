
const { Transaction, Category, Sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');
const recurringService = require('../services/recurring.service');

const getDateRange = (req) => {
    const { from, to, month } = req.query;
    
    let start, end;

    if (from && to) {
        start = new Date(from);
        end = new Date(to); // End is already verified as end of period by frontend usually? No, frontend sends ISO.
        // If frontend sends '2025-01-31T23:59:59', new Date(to) is fine.
    } else if (month) {
        start = new Date(`${month}-01T00:00:00.000Z`);
        end = new Date(new Date(start).setMonth(start.getMonth() + 1));
        end.setDate(0); // Go to last day of month
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


        let income = 0;
        let expense = 0;

        transactions.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'INCOME') {
                income += amt;
            } else if (t.type === 'EXPENSE') {
                expense += amt;
            }
        });

        res.json({
            income,
            expense,
            savings: income - expense,
            period: { from: startDate, to: endDate }
        });

    } catch (error) {
        logger.error(`Error getting summary: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.getCategoryBreakdown = async (req, res) => {
    try {
        const { entityId, type } = req.query; // type: 'EXPENSE' or 'INCOME'
        const { startDate, endDate } = getDateRange(req);
        
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        const targetType = type || 'EXPENSE';

        const breakdown = await Transaction.findAll({
            where: {
                entityId,
                type: targetType,
                date: {
                    [Op.gte]: startDate,
                    [Op.lte]: endDate
                },
                status: 'COMPLETED'
            },
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
        const start = month ? new Date(`${month}-01`) : new Date();
        start.setDate(1);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);

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
            // If pattern day is 15, and month is 2026-01:
            // Proj date = 2026-01-15
            const day = pattern.dayOfMonth;
            const projDate = new Date(start);
            projDate.setDate(day);
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
