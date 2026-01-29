const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');

router.get('/', alertController.getAlerts);
router.post('/', alertController.createAlert);
router.patch('/:id', alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);
router.post('/:id/dismiss', alertController.dismissAlert);

module.exports = router;
