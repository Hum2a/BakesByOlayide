const app = require('./app');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Stripe key available:', !!process.env.REACT_APP_STRIPE_SECRET_KEY);
}); 