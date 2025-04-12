import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const navigate = useNavigate();

  return (
    <div className="order-confirmation">
      <div className="confirmation-container">
        <div className="confirmation-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your order. We'll send you an email confirmation shortly.</p>
        <div className="confirmation-details">
          <p>Your order has been received and is being processed.</p>
          <p>We'll contact you if we need any additional information.</p>
        </div>
        <button 
          onClick={() => navigate('/')}
          className="continue-shopping-btn"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderConfirmation; 