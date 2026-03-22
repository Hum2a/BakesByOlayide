const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); // memory storage

const {
  sendOrderConfirmation,
  sendEnquiryReply,
  sendMarketingEmail,
  sendOrderEnquiry,
  notifyContactEnquiry,
  notifyNewReview,
  sendTestEmail,
  sendMarketingTestEmail,
} = require('../controllers/emailController');

router.post('/send-order-confirmation', upload.array('attachments'), sendOrderConfirmation);
router.post('/send-enquiry-reply', sendEnquiryReply);
router.post('/send-marketing-email', sendMarketingEmail);
router.post('/send-order-enquiry', sendOrderEnquiry);
router.post('/notify-contact-enquiry', notifyContactEnquiry);
router.post('/notify-new-review', notifyNewReview);
router.post('/test-email', sendTestEmail);
router.post('/test-marketing-email', sendMarketingTestEmail);

module.exports = router; 