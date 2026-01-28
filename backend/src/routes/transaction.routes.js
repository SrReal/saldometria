const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', transactionController.getAll);
router.post('/', transactionController.create);
router.patch('/:id', transactionController.update);
router.delete('/:id', transactionController.deleteTransaction);
router.post('/bulk-action', transactionController.bulkAction);

module.exports = router;
