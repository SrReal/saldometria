const express = require('express');
const router = express.Router();
const goalsController = require('../controllers/goals.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.get('/', goalsController.getGoals);
router.post('/', goalsController.createGoal);
router.patch('/:id', goalsController.updateGoal);
router.delete('/:id', goalsController.deleteGoal);

module.exports = router;
