const express = require('express');
const router = express.Router();
const budgetController = require('../controllers/budget.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', budgetController.getBudgets);
router.post('/', budgetController.upsertBudget);
router.delete('/:id', budgetController.deleteBudget);
router.get('/status', budgetController.getBudgetStatus);

module.exports = router;
