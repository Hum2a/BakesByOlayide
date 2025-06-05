const express = require('express');
const router = express.Router();
const { sendOrderConfirmation, sendEnquiryReply, sendMarketingEmail } = require('../controllers/emailController');

router.post('/send-order-confirmation', sendOrderConfirmation);
router.post('/send-enquiry-reply', sendEnquiryReply);
router.post('/send-marketing-email', sendMarketingEmail);

module.exports = router; 