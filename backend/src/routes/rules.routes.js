const express = require('express');
const router = express.Router();
const rulesController = require('../controllers/rules.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', rulesController.getRules);
router.post('/', rulesController.createRule);
router.post('/apply', rulesController.applyRules);
router.post('/bulk-delete', rulesController.bulkDeleteRules);
router.put('/:id', rulesController.updateRule);
router.delete('/:id', rulesController.deleteRule);

module.exports = router;
