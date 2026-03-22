const express = require('express');
const router = express.Router();
const { getIntegrationsStatus } = require('../controllers/integrationsController');
const { requireStaffAuth } = require('../middleware/requireStaffAuth');

router.get('/integrations/status', requireStaffAuth, getIntegrationsStatus);

module.exports = router;
