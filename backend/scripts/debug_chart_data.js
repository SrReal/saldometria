const { Transaction, Category, sequelize } = require('../src/models');
const { Op } = require('sequelize');

async function debugChart() {
    try {
        const entityId = 1; // Assuming ID 1 for test, or we should list all
        
        // 1. Check total completed expenses
        const allExpenses = await Transaction.count({
            where: { type: 'EXPENSE', status: 'COMPLETED' }
        });
        console.log('Total Completed Expenses in DB:', allExpenses);

        // 2. Check expenses with category
        const categorizedExpenses = await Transaction.count({
            where: { 
                type: 'EXPENSE', 
                status: 'COMPLETED',
                categoryId: { [Op.ne]: null }
            }
        });
        console.log('Categorized Expenses:', categorizedExpenses);

        // 3. Run the exact query from controller for THIS MONTH (approx)
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        
        console.log(`Checking range: ${start} to ${end}`);

        const breakdown = await Transaction.findAll({
            where: {
                // entityId, // Commented out to see all first
                type: 'EXPENSE',
                date: {
                    [Op.gte]: start,
                    [Op.lte]: end
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
                [sequelize.fn('SUM', sequelize.col('amount')), 'total']
            ],
            group: ['categoryId', 'category.id', 'category.name', 'category.color'],
        });

        console.log('Breakdown Result:', JSON.stringify(breakdown, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

debugChart();
