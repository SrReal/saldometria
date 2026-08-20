const { Transaction, Category, Entity, Account } = require('../models');
const { Op } = require('sequelize');

const verifyEntityOwnership = async (entityId, userId) => {
  const entity = await Entity.findByPk(entityId);
  return entity && entity.userId === userId;
};

exports.getAll = async (req, res, next) => {
  try {
    const { entityId, startDate, endDate, accountId, type, categoryId, page, limit } = req.query;

    if (!entityId) {
      return res.status(400).json({ message: 'entityId is required' });
    }

    if (!(await verifyEntityOwnership(entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized for this entity' });
    }

    const where = { entityId };
    if (startDate && endDate) {
      where.date = { [Op.between]: [startDate, endDate] };
    }
    if (accountId) {
        where.accountId = accountId;
    }
    if (type) {
        where.type = type;
    }
    if (categoryId !== undefined) {
        if (categoryId === 'null') {
            where.categoryId = null;
        } else {
            where.categoryId = categoryId;
        }
    }

    // Paginación
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      include: [
          { model: Category, as: 'category' },
          { model: Account, as: 'account' }
      ],
      order: [['date', 'DESC']],
      limit: limitNum,
      offset
    });

    res.json({
      data: rows,
      total: count,
      page: pageNum,
      totalPages: Math.ceil(count / limitNum)
    });
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { date, amount, description, type, categoryId, entityId, accountId } = req.body;

    if (!amount || !description || !type || !entityId) {
      return res.status(400).json({ message: 'Required fields missing' });
    }
    
    // Validate Account if provided
    let accountName = 'CASH';
    if (accountId) {
        const account = await Account.findByPk(accountId);
        if (!account) return res.status(400).json({ message: 'Invalid Account ID' });
        if (account.entityId !== parseInt(entityId)) return res.status(403).json({ message: 'Account does not belong to this entity' });
        accountName = account.type === 'CASH' ? 'CASH' : 'BANK'; // Mapping related to legacy source field
    }

    if (!(await verifyEntityOwnership(entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized for this entity' });
    }

    const transaction = await Transaction.create({
      date,
      amount,
      description,
      type,
      categoryId,
      entityId,
      accountId, // New field, allows null if not provided (though UI should enfore)
      source: accountName, // Maintaining legacy field for now
      status: 'COMPLETED',
    });

    // Update Account Balance
    if (accountId) {
        const account = await Account.findByPk(accountId);
        if (account) {
            const numAmount = parseFloat(amount);
            const newBalance = type === 'INCOME' 
                ? parseFloat(account.balance) + numAmount 
                : parseFloat(account.balance) - numAmount;
            await account.update({ balance: newBalance });
        }
    }

    // Background alert checks
    const alertService = require('../services/alert.service');
    if (type === 'EXPENSE' && categoryId) {
        alertService.checkBudgetAlerts(entityId, categoryId);
    }
    if (accountId) {
        alertService.checkAccountBalance(accountId);
    }
    alertService.checkLargeTransaction(transaction);

    res.status(201).json(transaction);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, amount, description, type, categoryId, accountId } = req.body;

    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (!(await verifyEntityOwnership(transaction.entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const oldAmount = parseFloat(transaction.amount);
    const oldType = transaction.type;
    const oldAccountId = transaction.accountId;

    if (date) transaction.date = date;
    if (amount) transaction.amount = amount;
    if (description) transaction.description = description;
    if (type) transaction.type = type;
    if (categoryId !== undefined) transaction.categoryId = categoryId;
    if (accountId !== undefined) transaction.accountId = accountId;

    await transaction.save();

    // Update Balance if amount, type, or account changed
    if (amount !== undefined || type !== undefined || accountId !== undefined) {
        const alertService = require('../services/alert.service');
        
        // 1. Revert old impact
        if (oldAccountId) {
            const oldAcc = await Account.findByPk(oldAccountId);
            if (oldAcc) {
                const revertBalance = oldType === 'INCOME' 
                    ? parseFloat(oldAcc.balance) - oldAmount 
                    : parseFloat(oldAcc.balance) + oldAmount;
                await oldAcc.update({ balance: revertBalance });
            }
        }

        // 2. Apply new impact
        if (transaction.accountId) {
            const newAcc = await Account.findByPk(transaction.accountId);
            if (newAcc) {
                const newAmount = parseFloat(transaction.amount);
                const applyBalance = transaction.type === 'INCOME' 
                    ? parseFloat(newAcc.balance) + newAmount 
                    : parseFloat(newAcc.balance) - newAmount;
                await newAcc.update({ balance: applyBalance });
                
                // Trigger balance alert for new account
                alertService.checkAccountBalance(transaction.accountId);
            }
        }
        
        // Trigger budget alert for new category if applicable
        if (transaction.type === 'EXPENSE' && transaction.categoryId) {
            alertService.checkBudgetAlerts(transaction.entityId, transaction.categoryId);
        }
    }

    await transaction.reload({ 
        include: [
            { model: Category, as: 'category' },
            { model: Account, as: 'account' }
        ] 
    });
    res.json(transaction);
  } catch (error) {
    next(error);
  }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findByPk(id);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (!(await verifyEntityOwnership(transaction.entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { accountId, amount, type } = transaction;

    await transaction.destroy();

    // Revert balance
    if (accountId) {
        const account = await Account.findByPk(accountId);
        if (account) {
            const numAmount = parseFloat(amount);
            const newBalance = type === 'INCOME' 
                ? parseFloat(account.balance) - numAmount 
                : parseFloat(account.balance) + numAmount;
            await account.update({ balance: newBalance });
        }
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

exports.bulkAction = async (req, res, next) => {
    const t = await Transaction.sequelize.transaction();
    try {
        const { ids, action, payload } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'No IDs provided' });
        }

        if (!['UPDATE', 'DELETE'].includes(action)) {
            return res.status(400).json({ message: 'Invalid action' });
        }

        // Verify ownership for all IDs
        // We can do this efficiently by counting how many of these IDs belong to the user's entities
        // But for strictness, let's fetch them.
        
        // 1. Get all transactions provided
        const transactions = await Transaction.findAll({
            where: { id: ids },
            include: [{ model: Entity, as: 'entity', attributes: ['userId'] }]
        });

        if (transactions.length !== ids.length) {
             await t.rollback();
             return res.status(404).json({ message: 'Some transactions not found' });
        }

        // 2. Verify user owns all entities associated
        const userOwnsAll = transactions.every(tx => {
            // Note: Transaction model doesn't directly include Entity unless defined in association.
            // Let's rely on entityId field present in Transaction.
            // We need to check if the entityId belongs to user.
            // A more efficient way: Get all unique entityIds involved.
            return true; 
        });
        
        // Let's refine verification. 
        // We need to efficiently check if ANY of these transactions belong to an entity NOT owned by user.
        // We'll trust the 'verifyEntityOwnership' helper but we need to call it for each unique entity found.
        const uniqueEntityIds = [...new Set(transactions.map(tx => tx.entityId))];
        
        for (const entityId of uniqueEntityIds) {
             const entity = await Entity.findByPk(entityId);
             if (!entity || entity.userId !== req.user.id) {
                 await t.rollback();
                 return res.status(403).json({ message: 'Not authorized for some transactions' });
             }
        }

        if (action === 'DELETE') {
            await Transaction.destroy({ 
                where: { id: ids },
                transaction: t
            });
        } else if (action === 'UPDATE') {
            if (!payload) {
                await t.rollback();
                return res.status(400).json({ message: 'Payload required for UPDATE' });
            }
            
            // Whitelist allowed updates
            const updateData = {};
            if (payload.categoryId !== undefined) updateData.categoryId = payload.categoryId === 'null' ? null : payload.categoryId;
            if (payload.date) updateData.date = payload.date;
            
            await Transaction.update(updateData, {
                where: { id: ids },
                transaction: t
            });
        }

        await t.commit();
        res.json({ message: 'Bulk action completed', count: ids.length });

    } catch (error) {
        await t.rollback();
        next(error);
    }
};
