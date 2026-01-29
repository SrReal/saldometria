const { Sequelize, Op } = require('sequelize');
const db = require('../src/models');
const { Transaction } = db;

async function check() {
    try {
        console.log('Connecting...');
        await db.sequelize.authenticate();
        console.log('Connected.');

        const entityId = 1;

        // 1. Get all accounts that have transactions
        const accountsWithTxs = await Transaction.findAll({
            attributes: ['accountId', [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']],
            where: { entityId },
            group: ['accountId'],
            raw: true
        });
        console.log('Transactions per Account:', accountsWithTxs);

        if (accountsWithTxs.length === 0) {
            console.log('No transactions found for entity 1');
            return;
        }

        // 2. Pick the first account and filter by it
        const testAccountId = accountsWithTxs[0].accountId;
        console.log(`Testing filter with Account ID: ${testAccountId}`);

        const filteredCount = await Transaction.count({
            where: {
                entityId,
                accountId: { [Op.in]: [testAccountId] } // Simulating the array logic
            }
        });
        console.log(`Filtered count (should be ${accountsWithTxs[0].count}): ${filteredCount}`);

        // 3. Test Exclusion (if multiple accounts exist)
        if (accountsWithTxs.length > 1) {
             const accountId2 = accountsWithTxs[1].accountId;
             console.log(`Testing filter with Account ID: ${accountId2}`);
             const filteredCount2 = await Transaction.count({
                where: {
                    entityId,
                    accountId: { [Op.in]: [accountId2] }
                }
            });
            console.log(`Filtered count 2 (should be ${accountsWithTxs[1].count}): ${filteredCount2}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await db.sequelize.close();
    }
}

check();
