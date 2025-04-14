import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../../stripe/config';
import StripePaymentForm from '../payment/StripePaymentForm';
import { auth, db } from '../../firebase/firebase';
import { doc, setDoc, collection, Timestamp, increment } from 'firebase/firestore';
import '../styles/Checkout.css';

const GuestForm = ({ onSubmit, isLoading }) => (
  <form onSubmit={onSubmit} className="guest-form">
    <div className="form-group">
      <label htmlFor="name">Full Name *</label>
      <input
        type="text"
        id="name"
        name="name"
        required
        placeholder="Enter your full name"
      />
    </div>
    <div className="form-group">
      <label htmlFor="email">Email Address *</label>
      <input
        type="email"
        id="email"
        name="email"
        required
        placeholder="Enter your email address"
      />
    </div>
    <div className="form-group">
      <label htmlFor="phone">Phone Number *</label>
      <input
        type="tel"
        id="phone"
        name="phone"
        required
        placeholder="Enter your phone number"
      />
    </div>
    <button type="submit" className="continue-button" disabled={isLoading}>
      Continue to Payment
    </button>
  </form>
);

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [guestInfo, setGuestInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  if (cart.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <p>Please add some items to your cart before proceeding to checkout.</p>
        <button onClick={() => navigate('/cakes')} className="return-to-shop">
          Return to Shop
        </button>
      </div>
    );
  }

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setGuestInfo({
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone')
    });
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      setIsLoading(true);
      const orderDate = Timestamp.now();
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Create order object
      const order = {
        id: orderId,
        userId: auth.currentUser?.uid || null,
        customerInfo: !auth.currentUser ? guestInfo : null, // Only include guest info if not logged in
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        status: 'confirmed',
        paymentStatus: 'paid',
        paymentId: paymentIntent.id,
        subtotal: totalPrice,
        total: totalPrice,
        createdAt: orderDate,
        pickupStatus: 'pending',
        pickupDate: null
      };

      // Create invoice object
      const invoice = {
        id: `INV-${orderId}`,
        orderId: orderId,
        userId: auth.currentUser?.uid || null,
        customerInfo: !auth.currentUser ? guestInfo : null,
        amount: totalPrice,
        paymentId: paymentIntent.id,
        paymentMethod: paymentIntent.payment_method,
        status: 'paid',
        createdAt: orderDate,
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity
        }))
      };

      if (auth.currentUser) {
        // If user is logged in, save to their collections
        const userId = auth.currentUser.uid;
        await setDoc(doc(db, 'users', userId, 'Invoices', invoice.id), invoice);
        await setDoc(doc(db, 'users', userId, 'Orders', order.id), order);
        await setDoc(doc(db, 'users', userId), {
          lastOrder: orderDate,
          orderCount: increment(1)
        }, { merge: true });
      }

      // Always save to main orders collection
      await setDoc(doc(db, 'orders', order.id), order);

      // Clear cart and navigate to confirmation
      clearCart();
      navigate('/order-confirmation', { 
        state: { 
          orderId,
          total: totalPrice,
          items: cart,
          guestInfo: !auth.currentUser ? guestInfo : null
        }
      });

    } catch (error) {
      console.error('Error saving order:', error);
      clearCart();
      navigate('/order-confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    setIsLoading(false);
  };

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="pickup-notice">
            <p>📍 This order will be available for pickup at our store location.</p>
            <p>We'll contact you to arrange a pickup time after your order is confirmed.</p>
          </div>
          <div className="checkout-items">
            {cart.map((item) => (
              <div key={item.id} className="checkout-item">
                <img src={item.image} alt={item.name} className="checkout-item-image" />
                <div className="checkout-item-details">
                  <h3>{item.name}</h3>
                  <p className="checkout-item-price">
                    ${item.price.toFixed(2)} x {item.quantity}
                  </p>
                </div>
                <p className="checkout-item-total">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <div className="checkout-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {!auth.currentUser && !guestInfo ? (
          <div className="auth-section">
            <h2>Account Options</h2>
            <div className="auth-options">
              <div className="login-option">
                <h3>Have an account?</h3>
                <p>Sign in to access your saved information and track your orders.</p>
                <Link to="/login" className="login-button">Sign In</Link>
              </div>
              <div className="guest-option">
                <h3>Continue as Guest</h3>
                <p>You can place your order without creating an account.</p>
                <GuestForm onSubmit={handleGuestSubmit} isLoading={isLoading} />
              </div>
            </div>
          </div>
        ) : (
          <div className="payment-section">
            <h2>Payment Information</h2>
            {guestInfo && (
              <div className="guest-info-summary">
                <h3>Order Information</h3>
                <p>Name: {guestInfo.name}</p>
                <p>Email: {guestInfo.email}</p>
                <p>Phone: {guestInfo.phone}</p>
                <button 
                  onClick={() => setGuestInfo(null)} 
                  className="edit-info-button"
                >
                  Edit Information
                </button>
              </div>
            )}
            <Elements stripe={stripePromise}>
              <StripePaymentForm
                amount={Math.round(totalPrice * 100)}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout; 