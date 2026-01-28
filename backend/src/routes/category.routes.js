const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', categoryController.getAll);
router.post('/', categoryController.create);
router.patch('/:id', categoryController.update);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
