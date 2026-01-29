const cron = require('node-cron');
const groqService = require('./groq.service');
const { Entity } = require('../models');
const logger = require('../utils/logger');

exports.initSchedulers = () => {
    // Run every Sunday at midnight: 0 0 * * 0
    // For testing/initial build, we could run it once on start or every hour, 
    // but the user specified "weekly".
    cron.schedule('0 0 * * 0', async () => {
        logger.info('Starting weekly AI Categorization job (Sunday Midnight)');
        try {
            const entities = await Entity.findAll();
            for (const entity of entities) {
                logger.info(`Processing AI categorization for Entity: ${entity.name} (${entity.id})`);
                await groqService.categorizeEntityTransactions(entity.id);
            }
            logger.info('Weekly AI Categorization job completed.');
        } catch (error) {
            logger.error('Error in weekly AI job: ' + error.message);
        }
    });

    logger.info('Schedulers initialized.');
};
