import nodemailer from 'nodemailer';
import zohoConfig from '../config/zoho';

// Create reusable transporter object using Zoho SMTP transport
const transporter = nodemailer.createTransport({
  host: zohoConfig.smtpHost,
  port: zohoConfig.smtpPort,
  secure: zohoConfig.secure,
  auth: {
    user: zohoConfig.email,
    pass: zohoConfig.password,
  },
});

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to take our messages');
  }
});

// Email templates
const emailTemplates = {
  orderConfirmation: (orderDetails) => ({
    subject: `Order Confirmation - Order #${orderDetails.orderId}`,
    html: `
      <h1>Thank you for your order!</h1>
      <p>Dear ${orderDetails.customerName},</p>
      <p>Your order has been received and is being processed.</p>
      <h2>Order Details:</h2>
      <ul>
        ${orderDetails.items.map(item => `
          <li>${item.name} - Quantity: ${item.quantity} - £${item.price}</li>
        `).join('')}
      </ul>
      <p>Total Amount: £${orderDetails.total}</p>
      <p>We'll contact you shortly to arrange pickup.</p>
    `
  }),
  
  enquiryConfirmation: (enquiryDetails) => ({
    subject: 'Thank you for your enquiry',
    html: `
      <h1>Thank you for contacting us!</h1>
      <p>Dear ${enquiryDetails.name},</p>
      <p>We have received your enquiry and will get back to you shortly.</p>
      <p>Your enquiry details:</p>
      <p>${enquiryDetails.message}</p>
    `
  }),
  
  passwordReset: (resetLink) => ({
    subject: 'Password Reset Request',
    html: `
      <h1>Password Reset Request</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
    `
  })
};

// Email sending functions
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailOptions = {
      from: zohoConfig.email,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Specific email sending functions
export const sendOrderConfirmation = async (orderDetails) => {
  const { subject, html } = emailTemplates.orderConfirmation(orderDetails);
  return sendEmail({
    to: orderDetails.customerEmail,
    subject,
    html
  });
};

export const sendEnquiryConfirmation = async (enquiryDetails) => {
  const { subject, html } = emailTemplates.enquiryConfirmation(enquiryDetails);
  return sendEmail({
    to: enquiryDetails.email,
    subject,
    html
  });
};

export const sendPasswordReset = async (email, resetLink) => {
  const { subject, html } = emailTemplates.passwordReset(resetLink);
  return sendEmail({
    to: email,
    subject,
    html
  });
}; 