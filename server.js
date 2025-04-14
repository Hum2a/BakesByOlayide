require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static('build'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is running!' });
});

app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, payment_method_id } = req.body;

    if (!process.env.REACT_APP_STRIPE_SECRET_KEY) {
      throw new Error('Missing Stripe Secret Key');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'gbp',
      payment_method: payment_method_id,
      confirm: false, // Don't confirm yet, let the client handle confirmation
      setup_future_usage: 'off_session', // Allow the payment method to be used for future payments
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error('Stripe Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Stripe key available:', !!process.env.REACT_APP_STRIPE_SECRET_KEY);
}); 