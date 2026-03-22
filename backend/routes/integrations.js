const express = require('express');
const router = express.Router();
const { getIntegrationsStatus } = require('../controllers/integrationsController');

router.get('/integrations/status', getIntegrationsStatus);

module.exports = router;
