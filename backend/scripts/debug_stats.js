const { Sequelize, Op } = require('sequelize');
const { Transaction, Entity, Category } = require('../src/models');
require('dotenv').config();

const fs = require('fs');
const path = require('path');

const run = async () => {
    let logBuffer = '';
    const log = (msg) => {
        console.log(msg);
        logBuffer += msg + '\n';
    };

    try {
        log('--- DEBUG AGGREGATION LOOKUP ---');

        const entity = await Entity.findOne({ where: { id: 1 } });
        if (!entity) throw new Error("Entity 1 not found");
        log(`Using Entity: ${entity.name}`);

        const now = new Date();
        const start = "2025-12-01"; // Match user's error params
        const end = "2025-12-31";
        
        log(`Testing Range: ${start} to ${end}`);

        // Try the breakdown query
        const breakdown = await Transaction.findAll({
            where: {
                entityId: entity.id,
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
                [Sequelize.fn('SUM', Sequelize.col('amount')), 'total']
            ],
            group: ['categoryId', 'category.id', 'category.name', 'category.color'],
            order: [[Sequelize.literal('total'), 'DESC']]
        });
        
        log(`Query Success. Rows: ${breakdown.length}`);
        log(JSON.stringify(breakdown, null, 2));

    } catch (error) {
        log('Debug Error (STACK): ' + error.stack);
        if (error.original) {
             log('Original SQL Error: ' + error.original.message);
             log('SQL: ' + error.sql);
        }
    } finally {
        fs.writeFileSync(path.join(__dirname, '../debug_log.txt'), logBuffer);
        process.exit();
    }
};

run();
