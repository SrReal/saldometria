const { Transaction, sequelize } = require('../src/models');

async function checkDates() {
    try {
        const result = await Transaction.findOne({
            attributes: [
                [sequelize.fn('MIN', sequelize.col('date')), 'minDate'],
                [sequelize.fn('MAX', sequelize.col('date')), 'maxDate'],
                [sequelize.fn('COUNT', sequelize.col('id')), 'count']
            ],
            raw: true
        });

        console.log('--- DB SUMMARY ---');
        console.log('Total Transactions:', result.count);
        console.log('Date Range:', result.minDate, 'to', result.maxDate);
        console.log('Current Server Date:', new Date().toISOString().split('T')[0]);
        console.log('------------------');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

checkDates();
