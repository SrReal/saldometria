const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // Temp storage
const importController = require('../controllers/import.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth);

router.post('/', upload.single('file'), importController.uploadCsv);

module.exports = router;
