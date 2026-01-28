const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');


// Apply ownership check globally for stats? 
// Or per route if we extract entityId from query. 
// Middleware typically expects entityId in params or body. 
// Let's rely on controller verification or add a specific middleware that reads from query.
// For now, simpler to just allow authenticated access and let controller query.
// Ideally usage: requireAuth is already in app.js or applied here?
// We need to import requireAuth if not applied globally.

const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

const forecastController = require('../controllers/forecast.controller');

router.get('/summary', statsController.getSummary);
router.get('/categories', statsController.getCategoryBreakdown);
router.get('/recurring', statsController.getRecurring);
router.get('/calendar', statsController.getCalendarEvents);
router.get('/forecast', forecastController.getForecast);

module.exports = router;
