const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // memory storage

const {
  sendOrderConfirmation,
  sendEnquiryReply,
  sendMarketingEmail,
  sendOrderEnquiry,
  sendTestEmail,
  sendMarketingTestEmail,
} = require('../controllers/emailController');

router.post('/send-order-confirmation', upload.array('attachments'), sendOrderConfirmation);
router.post('/send-enquiry-reply', sendEnquiryReply);
router.post('/send-marketing-email', sendMarketingEmail);
router.post('/send-order-enquiry', sendOrderEnquiry);
router.post('/test-email', sendTestEmail);
router.post('/test-marketing-email', sendMarketingTestEmail);

module.exports = router; 