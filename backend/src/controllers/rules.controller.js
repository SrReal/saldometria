const { Rule, Category, Op } = require('../models');

exports.getRules = async (req, res) => {
    try {
        const { entityId } = req.query;
        if (!entityId) {
            return res.status(400).json({ message: 'entityId is required' });
        }

        const rules = await Rule.findAll({
            where: { entityId },
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'color']
            }],
            order: [['createdAt', 'DESC']]
        });

        res.json(rules);
    } catch (error) {
        console.error('Error fetching rules:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.createRule = async (req, res) => {
    try {
        const { entityId, pattern, categoryId } = req.body;

        if (!entityId || !pattern || !categoryId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const rule = await Rule.create({
            entityId,
            pattern,
            categoryId,
            isActive: true
        });

        // Fetch again to include category details
        const createdRule = await Rule.findByPk(rule.id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'color']
            }]
        });

        res.status(201).json(createdRule);
    } catch (error) {
        console.error('Error creating rule:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.deleteRule = async (req, res) => {
    try {
        const { id } = req.params;
        const rule = await Rule.findByPk(id);

        if (!rule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        await rule.destroy();
        res.json({ message: 'Rule deleted successfully' });
    } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.updateRule = async (req, res) => {
    try {
        const { id } = req.params;
        const { pattern, categoryId, isActive } = req.body;
        const rule = await Rule.findByPk(id);

        if (!rule) {
            return res.status(404).json({ message: 'Rule not found' });
        }

        await rule.update({ pattern, categoryId, isActive });

        const updatedRule = await Rule.findByPk(id, {
            include: [{
                model: Category,
                as: 'category',
                attributes: ['id', 'name', 'color']
            }]
        });

        res.json(updatedRule);
    } catch (error) {
        console.error('Error updating rule:', error);
        res.status(500).json({ message: error.message });
    }
};

exports.applyRules = async (req, res) => {
    const { Transaction } = require('../models');
    const { Op } = require('sequelize');

    try {
        const { entityId } = req.body;
        if (!entityId) return res.status(400).json({ message: 'Missing entityId' });

        // Fetch active rules
        const rules = await Rule.findAll({
            where: { entityId, isActive: true }
        });

        if (rules.length === 0) {
            return res.json({ message: 'No active rules to apply', count: 0 });
        }

        // Fetch uncategorized transactions (or all? user asked for retroactive, implying re-check all or just uncategorized?)
        // Let's safe side: apply to ALL transactions that don't match their current category? 
        // Or simpler: Iterate all transactions and update if rule matches. 
        // Better: Fetch transactions for entity.
        
        const transactions = await Transaction.findAll({
            where: { entityId }
        });

        let updatedCount = 0;
        const updates = [];

        for (const tx of transactions) {
            if (!tx.description) continue;
            const upperDesc = tx.description.toUpperCase();
            
            for (const rule of rules) {
                if (upperDesc.includes(rule.pattern.toUpperCase())) {
                    // If mismatch, update
                    if (tx.categoryId !== rule.categoryId) {
                        tx.categoryId = rule.categoryId;
                        updates.push(tx.save());
                        updatedCount++;
                    }
                    break; // Stop at first match
                }
            }
        }

        await Promise.all(updates);

        res.json({ message: 'Rules applied successfully', count: updatedCount });

    } catch (error) {
        console.error('Error applying rules:', error);
        res.status(500).json({ message: error.message });
    }
};
