const importService = require('../services/import.service');
const { Transaction, Account, Category, Sequelize } = require('../models');
const { Op } = require('sequelize');
const fs = require('fs');

exports.uploadCsv = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { accountId, entityId, adapterType } = req.body;

        if (!accountId || !entityId || !adapterType) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Verify ownership
        const account = await Account.findByPk(accountId);
        if (!account || account.entityId !== parseInt(entityId)) {
            return res.status(403).json({ message: 'Invalid account for this entity' });
        }

        // Read file buffer
        const fileBuffer = fs.readFileSync(req.file.path);

        // Parse transactions
        const rawTransactions = await importService.importFile(fileBuffer, adapterType, entityId, accountId);

        // Fetch Active Rules
        const rules = await Rule.findAll({
            where: { entityId, isActive: true }
        });

        // Transform to DB model format & Apply Rules
        const transactionsToCreate = rawTransactions.map(t => {
            let categoryId = null;

            // Apply Rules
            if (t.description) {
                const upperDesc = t.description.toUpperCase();
                for (const rule of rules) {
                     if (upperDesc.includes(rule.pattern.toUpperCase())) {
                         categoryId = rule.categoryId;
                         break; // First match wins
                     }
                }
            }

            return {
                date: t.date,
                amount: Math.abs(t.amount),
                balance: t.balance, // New field from import
                type: t.amount >= 0 ? 'INCOME' : 'EXPENSE',
                description: t.description,
                entityId,
                accountId,
                categoryId, // Assigned by rule or null
                source: 'BANK', // Distinct from CASH
                status: 'COMPLETED'
            };
        });

        if (transactionsToCreate.length === 0) {
             return res.status(200).json({ message: 'No valid transactions found in file', count: 0 });
        }

        // Duplicate Detection
        const { Op } = require('sequelize'); // Ensure Op is available

        // 1. Get range of dates
        const dates = transactionsToCreate.map(t => t.date);
        const minDate = new Date(Math.min.apply(null, dates));
        const maxDate = new Date(Math.max.apply(null, dates));
        
        // 2. Fetch existing transactions in this range for this account
        const existingTransactions = await Transaction.findAll({
            where: {
                accountId,
                date: {
                    [Op.between]: [minDate, maxDate]
                }
            }
        });

        // 3. Filter duplicates (matching date, amount, description)
        // Note: Amount in DB is absolute, but type distinguishes sign.
        // We compare raw imported amount vs db amount + type
        
        const finalTransactions = transactionsToCreate.filter(newTx => {
            const isDuplicate = existingTransactions.some(existing => {
                const existingAmount = parseFloat(existing.amount);
                const newAmount = parseFloat(newTx.amount);
                
                // Compare Date (DateOnly string vs Date object)
                const existingDateStr = new Date(existing.date).toISOString().split('T')[0];
                const newDateStr = newRxDate(newTx.date).toISOString().split('T')[0];

                const typesMatch = existing.type === newTx.type;
                const amountsMatch = Math.abs(existingAmount - newAmount) < 0.01;
                const descriptionsMatch = existing.description === newTx.description;
                const datesMatch = existingDateStr === newDateStr;

                return typesMatch && amountsMatch && descriptionsMatch && datesMatch;
            });
            return !isDuplicate;
        });

        if (finalTransactions.length === 0) {
            return res.status(200).json({ message: 'No new transactions to import (all duplicates)', count: 0 });
        }

        // Bulk create
        await Transaction.bulkCreate(finalTransactions);

        // Update Account Balance
        // Find the transaction with the latest date that has a balance
        // Valid for Santander: The file comes sorted? Usually yes.
        // Let's sort finalTransactions by date descending just to be sure
        const sortedWithBalance = [...finalTransactions].filter(t => t.balance != null).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedWithBalance.length > 0) {
            const latestTx = sortedWithBalance[0];
            // Update account
             await Account.update({ balance: latestTx.balance }, { where: { id: accountId } });
        }
        
        // Helper date function since original helper missing in scope
        function newRxDate(d) { return new Date(d); }
        
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.status(201).json({
            message: 'Import successful',
            count: transactionsToCreate.length,
            preview: transactionsToCreate.slice(0, 5)
        });

    } catch (error) {
        // Clean up on error
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Import error:', error);
        res.status(500).json({ message: 'Import failed: ' + error.message });
    }
};
