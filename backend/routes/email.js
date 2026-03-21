const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // memory storage

const {
  sendOrderConfirmation,
  sendEnquiryReply,
  sendMarketingEmail,
  sendOrderEnquiry,
} = require('../controllers/emailController');

router.post('/send-order-confirmation', upload.array('attachments'), sendOrderConfirmation);
router.post('/send-enquiry-reply', sendEnquiryReply);
router.post('/send-marketing-email', sendMarketingEmail);
router.post('/send-order-enquiry', sendOrderEnquiry);

module.exports = router; 