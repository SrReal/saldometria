const express = require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireEntityOwnership } = require('../middleware/entity.middleware');

// Apply auth middleware to all routes
router.use(requireAuth);

// Routes
// Note: requireEntityOwnership might need adjustment to handle 'creating' an account for an entity (POST) 
// vs accessing a specific account (GET/PATCH/DELETE).
// For now, let's assume the frontend passes entityId for list/create.

router.get('/', accountController.getAccounts);
router.post('/', accountController.createAccount);
router.patch('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

module.exports = router;
