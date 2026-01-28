const express = require('express');
const router = express.Router();
const entityController = require('../controllers/entity.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireEntityOwnership } = require('../middleware/entity.middleware');

router.use(requireAuth); // Protect all entity routes

router.get('/', entityController.getAll);
router.post('/', entityController.create);
router.patch('/:id', requireEntityOwnership, entityController.update);
router.delete('/:id', requireEntityOwnership, entityController.deleteEntity);

module.exports = router;
