const { Transaction } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

// Differences in days between two dates
const diffDays = (d1, d2) => Math.abs((d1 - d2) / (1000 * 60 * 60 * 24));

class RecurringService {
    async detectRecurring(entityId) {
        try {
            // 1. Fetch EXPENSES from last 6 months
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            
            const transactions = await Transaction.findAll({
                where: {
                    entityId,
                    type: 'EXPENSE',
                    status: 'COMPLETED',
                    date: { [Op.gte]: sixMonthsAgo }
                },
                order: [['date', 'ASC']],
                attributes: ['id', 'date', 'amount', 'description', 'categoryId']
            });

            if (transactions.length === 0) return [];

            // 2. Group by normalized description
            // Key: "NETFLIX", Value: [tx1, tx2, ...]
            const groups = {};
            
            transactions.forEach(tx => {
                // Normalize: trim, uppercase, remove digits? (maybe too aggressive). 
                // Let's stick to simple trim+upper for now. 
                // "NETFLIX.COM" vs "NETFLIX" might be an issue, but let's assume consistent bank descr for now.
                const key = tx.description.trim().toUpperCase();
                if (!groups[key]) groups[key] = [];
                groups[key].push(tx);
            });

            // 3. Analyze groups
            const recurring = [];

            for (const [key, txs] of Object.entries(groups)) {
                // Require at least 3 occurrences to consider it a pattern
                if (txs.length < 3) continue;

                // Sort by date (already sorted by query, but just in case)
                txs.sort((a, b) => new Date(a.date) - new Date(b.date));

                // Calculate intervals
                let sumIntervals = 0;
                let countIntervals = 0;
                let validPattern = true;
                let totalAmount = 0;

                for (let i = 1; i < txs.length; i++) {
                    const d1 = new Date(txs[i-1].date);
                    const d2 = new Date(txs[i].date);
                    const days = diffDays(d1, d2);
                    
                    // We look for monthly occurrences (approx 25-35 days)
                    // Or maybe exact 30? Bank dates fluctuate (weekend effects).
                    // Let's accept 25 to 35.
                    if (days < 25 || days > 35) {
                        // Pattern break?
                        // Maybe it missed a month? If > 50 and < 70 (skipping one month) might be valid too?
                        // For MVP let's be strict: consecutive months.
                        validPattern = false;
                        break; 
                    }

                    sumIntervals += days;
                    countIntervals++;
                }

                txs.forEach(t => totalAmount += parseFloat(t.amount));

                if (validPattern && countIntervals > 0) {
                    const avgInterval = sumIntervals / countIntervals;
                    const avgAmount = totalAmount / txs.length;
                    
                    // Predict next date
                    const lastDate = new Date(txs[txs.length - 1].date);
                    const nextDate = new Date(lastDate);
                    nextDate.setDate(lastDate.getDate() + Math.round(avgInterval));

                    recurring.push({
                        description: key, // Use the normalized key or the last description?
                        originalDescription: txs[txs.length - 1].description, // Use most recent description
                        avgAmount: avgAmount, // average amount
                        lastDate: lastDate.toISOString().split('T')[0],
                        nextDate: nextDate.toISOString().split('T')[0],
                        period: 'MONTHLY',
                        daysUntilDue: Math.ceil(diffDays(new Date(), nextDate) * (nextDate > new Date() ? 1 : -1)),
                        categoryId: txs[txs.length - 1].categoryId
                    });
                }
            }

            return recurring.sort((a, b) => a.daysUntilDue - b.daysUntilDue);

        } catch (error) {
            logger.error(`Error detecting recurring expenses: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new RecurringService();
