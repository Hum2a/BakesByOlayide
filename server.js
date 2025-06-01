require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY);
// const { sendOrderConfirmation, sendEnquiryConfirmation, sendPasswordReset } = require('./src/utils/emailService');

const app = express();

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
        pickupDate: pickupDate || '',
        pickupTime: pickupTime || '',
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

// Place this at the very end, after all API routes
app.use(express.static('build'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Stripe key available:', !!process.env.REACT_APP_STRIPE_SECRET_KEY);
}); 