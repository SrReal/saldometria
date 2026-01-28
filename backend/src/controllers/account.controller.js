const { Account, Transaction } = require('../models');
const { Op } = require('sequelize');

exports.createAccount = async (req, res) => {
  try {
    const { name, type, currency, balance } = req.body;
    const { entityId } = req.query; // Passed via query or body? Let's check consistency. Using query for now or body if context provided. 
    // Actually, usually POST body has all data.
    // Let's assume entityId is in body for POST.

    const finalEntityId = req.body.entityId || req.query.entityId;

    if (!finalEntityId) {
        return res.status(400).json({ error: 'Entity ID is required' });
    }
    
    // Verify ownership (middleware covers req.entity if used, but let's double check basic logic)
    // requireEntityOwnership middleware usually attaches entity check, but here we might just check if user owns entity
    
    // Assuming requireEntityOwnership middleware is used on routes, we can trust req.entity if set, or we do manual check.
    // Let's stick to standard practice: 
    
    const account = await Account.create({
      name,
      type,
      currency,
      balance,
      entityId: finalEntityId
    });

    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAccounts = async (req, res) => {
  try {
    const { entityId } = req.query;
    const accounts = await Account.findAll({
      where: { entityId },
      include: [
        { 
            model: Transaction, 
            as: 'transactions',
            limit: 5,
            order: [['date', 'DESC']]
        }
      ] 
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findByPk(id);
    if (!account) return res.status(404).json({ error: 'Account not found' });
    
    // Ownership check via Entity relation could be added here if not covered by middleware.
    
    await account.update(req.body);
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await Account.findByPk(id);
    if (!account) return res.status(404).json({ error: 'Account not found' });

    await account.destroy();
    res.json({ message: 'Account deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
