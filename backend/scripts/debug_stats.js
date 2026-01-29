const { Sequelize } = require('sequelize');
const db = require('../src/models');
const { Transaction } = db;

async function check() {
    try {
        console.log('Connecting...');
        await db.sequelize.authenticate();
        console.log('Connected.');

        const entityId = 1; // Assuming Entity 1 for test, or we list them.
        console.log(`Checking stats for Entity ${entityId}`);

        // 1. Raw Count
        const count = await Transaction.count({ where: { entityId } });
        console.log(`Total transactions for entity ${entityId}: ${count}`);

        // 2. Check Date Range
        const minDate = await Transaction.min('date', { where: { entityId } });
        const maxDate = await Transaction.max('date', { where: { entityId } });
        console.log(`Date Range: ${minDate} - ${maxDate}`);

        // 3. Run Evolution Query Simulation
        const data = await Transaction.findAll({
            where: { entityId, status: 'COMPLETED' },
            attributes: [
                [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'month'],
                'type',
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: [Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'type'],
            order: [[Sequelize.fn('DATE_FORMAT', Sequelize.col('date'), '%Y-%m'), 'ASC']]
        });
        
        console.log('Evolution Query Result:', JSON.stringify(data, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.sequelize.close();
    }
}

check();
