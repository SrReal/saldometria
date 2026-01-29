const { Alert, Account, Entity } = require('../models');
const logger = require('../utils/logger');

exports.getAlerts = async (req, res) => {
    try {
        const { entityId } = req.query;
        if (!entityId) return res.status(400).json({ message: 'entityId required' });

        const alerts = await Alert.findAll({
            where: { entityId },
            include: [{ model: Account, as: 'account', attributes: ['name'] }]
        });
        res.json(alerts);
    } catch (error) {
        logger.error(`Error fetching alerts: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.createAlert = async (req, res) => {
    try {
        const { entityId, type, threshold, accountId, message } = req.body;
        if (!entityId || !type || threshold === undefined) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const alert = await Alert.create({
            entityId,
            type,
            threshold,
            accountId,
            message,
            status: 'ACTIVE',
            enabled: true
        });

        res.status(201).json(alert);
    } catch (error) {
        logger.error(`Error creating alert: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.updateAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findByPk(id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        await alert.update(req.body);
        res.json(alert);
    } catch (error) {
        logger.error(`Error updating alert: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Alert.destroy({ where: { id } });
        if (!deleted) return res.status(404).json({ message: 'Alert not found' });
        res.json({ message: 'Alert deleted' });
    } catch (error) {
        logger.error(`Error deleting alert: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};

exports.dismissAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await Alert.findByPk(id);
        if (!alert) return res.status(404).json({ message: 'Alert not found' });

        // We can either mark it ACTIVE again (reset) or DISMISSED
        // If it's a notification-style alert, DISMISSED is better.
        // If it's a state-style alert (Low Balance), resetting it to ACTIVE 
        // will just trigger it again if the condition persists.
        // Let's go with DISMISSED for now.
        await alert.update({ status: 'DISMISSED' });
        res.json(alert);
    } catch (error) {
        logger.error(`Error dismissing alert: ${error.message}`);
        res.status(500).json({ message: error.message });
    }
};
