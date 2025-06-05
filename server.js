require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY);
const nodemailer = require('nodemailer');
const admin = require("firebase-admin");

const app = express();

var serviceAccount = require("./bakesbyolayide-firebase-adminsdk-fbsvc-a7bcd79c25.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const firestore = admin.firestore();

// Middleware
app.use(cors({
  origin: [
    'https://bakesbyolayide.co.uk',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

// Email routes (temporarily removed)
// app.post('/api/send-order-confirmation', ...)
// app.post('/api/send-enquiry-confirmation', ...)
// app.post('/api/send-password-reset', ...)

const ordersTransporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_ORDERS_USER,
    pass: process.env.ZOHO_ORDERS_PASS,
  },
});

const enquiriesTransporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_ENQUIRIES_USER,
    pass: process.env.ZOHO_ENQUIRIES_PASS,
  },
});

const marketingTransporter = nodemailer.createTransport({
  host: process.env.ZOHO_SMTP_HOST,
  port: process.env.ZOHO_SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.ZOHO_MARKETING_USER,
    pass: process.env.ZOHO_MARKETING_PASS,
  },
});

async function sendOrderConfirmation({ to, subject, html }) {
  return ordersTransporter.sendMail({
    from: `"Bakes by Olayide" <${process.env.ZOHO_ORDERS_USER}>`,
    to,
    subject,
    html,
  });
}

async function sendEnquiryReply({ to, subject, html }) {
  return enquiriesTransporter.sendMail({
    from: `"Bakes by Olayide Enquiries" <${process.env.ZOHO_ENQUIRIES_USER}>`,
    to,
    subject,
    html,
  });
}

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    if (!process.env.REACT_APP_STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe Secret Key');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      setup_future_usage: 'off_session',
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { cart, guestInfo, pickupDate, pickupTime, orderId } = req.body;
    if (!process.env.REACT_APP_STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe Secret Key');
    }
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty or invalid' });
    }
    if (!guestInfo || !guestInfo.email) {
      console.error('Missing guestInfo or guestInfo.email:', guestInfo);
      return res.status(400).json({ error: 'Missing customer email address' });
    }
    console.log('Received guestInfo:', guestInfo);
    // Build line_items from cart
    const line_items = cart.map(item => ({
      price_data: {
        currency: 'gbp',
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));
    // Add a £0 line item for pickup info if provided
    if (pickupDate || pickupTime) {
      let pickupLabel = 'Pickup';
      if (pickupDate) pickupLabel += `: ${pickupDate}`;
      if (pickupTime) pickupLabel += ` ${pickupTime}`;
      line_items.push({
        price_data: {
          currency: 'gbp',
          product_data: { name: pickupLabel },
          unit_amount: 0,
        },
        quantity: 1,
      });
    }
    // Format pickup date and time for human readability (YYYY-MM-DD HH:mm)
    let pickupDetails = '';
    if (pickupDate) {
      try {
        const dateObj = new Date(pickupDate);
        const dateStr = dateObj.toISOString().slice(0, 10); // YYYY-MM-DD
        let timeStr = '';
        if (pickupTime) {
          // Format as HH:mm (24-hour)
          const [hour, minute] = pickupTime.split(':');
          timeStr = `${hour.padStart(2, '0')}:${(minute || '00').padStart(2, '0')}`;
          pickupDetails = `${dateStr} ${timeStr}`;
        } else {
          pickupDetails = dateStr;
        }
      } catch (e) {
        pickupDetails = pickupDate;
      }
    } else if (pickupTime) {
      pickupDetails = pickupTime;
    }
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'https://bakesbyolayide.co.uk/order-confirmation?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://bakesbyolayide.co.uk/checkout?canceled=true',
      metadata: {
        orderId: orderId || '',
        guestName: guestInfo?.name || '',
        guestEmail: guestInfo?.email || '',
        guestPhone: guestInfo?.phone || '',
        pickupDetails,
      },
    });
    res.json({ sessionId: session.id });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to fetch Stripe session by session_id
app.get('/api/stripe-session', async (req, res) => {
  const { session_id } = req.query;
  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stripe-webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    // Get customer email and order details from session
    const to = session.customer_details.email;
    const subject = 'Your Bakes by Olayide Order Confirmation';
    const html = `<h1>Thank you for your order!</h1><p>Order ID: ${session.metadata.orderId}</p>`;
    try {
      console.log('Attempting to send order confirmation to:', to);
      await sendOrderConfirmation({ to, subject, html });
      console.log('Email sent successfully!');
    } catch (e) {
      console.error('Email send error:', e);
    }
  }
  res.json({ received: true });
});

app.post('/api/test-email', async (req, res) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });
  try {
    const subject = 'Test Email from Bakes by Olayide';
    const html = '<h1>This is a test email from your server.</h1>';
    console.log('Attempting to send test email to:', to);
    await sendOrderConfirmation({ to, subject, html });
    console.log('Test email sent successfully!');
    res.json({ success: true });
  } catch (e) {
    console.error('Test email send error:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/send-order-confirmation', async (req, res) => {
  const { to, subject, html } = req.body;
  if (!to) return res.status(400).json({ error: 'Missing recipient email' });
  try {
    await sendOrderConfirmation({ to, subject, html });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/send-enquiry-reply', async (req, res) => {
  console.log('Received enquiry reply request:', req.body);
  const { to, subject, html } = req.body;
  if (!to) {
    console.error('Missing recipient email in enquiry reply');
    return res.status(400).json({ error: 'Missing recipient email' });
  }
  try {
    await sendEnquiryReply({ to, subject, html });
    res.json({ success: true });
  } catch (e) {
    console.error('Error sending enquiry reply:', e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/send-marketing-email', async (req, res) => {
  const { subject, html } = req.body;
  if (!subject || !html) {
    return res.status(400).json({ error: 'Missing subject or html' });
  }
  try {
    // Fetch all opted-in newsletter subscribers
    const snapshot = await firestore.collection('newsletter').where('optedIn', '==', true).get();
    const emails = snapshot.docs.map(doc => doc.data().email).filter(Boolean);
    if (!emails.length) {
      return res.status(400).json({ error: 'No opted-in subscribers found.' });
    }
    // Send email using BCC
    await marketingTransporter.sendMail({
      from: `"Bakes by Olayide Marketing" <${process.env.ZOHO_MARKETING_USER}>`,
      to: process.env.ZOHO_MARKETING_USER, // To self, BCC to all
      bcc: emails,
      subject,
      html,
    });
    res.json({ success: true, sent: emails.length });
  } catch (err) {
    console.error('Marketing email send error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Place this at the very end, after all API routes
app.use(express.static('build'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Stripe key available:', !!process.env.REACT_APP_STRIPE_SECRET_KEY);
}); 