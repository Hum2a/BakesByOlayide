const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // memory storage

const { sendOrderConfirmation, sendEnquiryReply, sendMarketingEmail } = require('../controllers/emailController');

router.post('/send-order-confirmation', upload.array('attachments'), sendOrderConfirmation);
router.post('/send-enquiry-reply', sendEnquiryReply);
router.post('/send-marketing-email', sendMarketingEmail);

module.exports = router; 