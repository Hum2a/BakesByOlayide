import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import { auth } from '../../firebase/firebase';
import '../styles/OrderConfirmation.css';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total, items, guestInfo } = location.state || {};
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  return (
    <div className="order-confirmation">
      <div className="confirmation-container">
        <div className="confirmation-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your order. We'll send you an email confirmation shortly.</p>
        
        {orderId && (
          <div className="order-details">
            <h2>Order Details</h2>
            <p className="order-id">Order ID: {orderId}</p>
            
            {items && items.length > 0 && (
              <div className="order-items">
                <h3>Items Ordered</h3>
                {items.map((item, index) => (
                  <div key={index} className="order-item">
                    <div className="item-image">
                      <img src={item.image} alt={item.name} />
                    </div>
                    <div className="item-details">
                      <h4>{item.name}</h4>
                      <p>Quantity: {item.quantity}</p>
                      <p>Price: ${item.price.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {total && (
              <div className="order-total">
                <p>Total Amount: <span>${total.toFixed(2)}</span></p>
              </div>
            )}
          </div>
        )}

        <div className="confirmation-details">
          <p>Your order has been received and is being processed.</p>
          <p>We'll contact you to arrange a pickup time.</p>
          {guestInfo && (
            <div className="guest-info">
              <p>Order confirmation has been sent to: {guestInfo.email}</p>
            </div>
          )}
        </div>
        
        <div className="confirmation-actions">
          <button 
            onClick={() => navigate('/')}
            className="continue-shopping-btn"
          >
            Continue Shopping
          </button>
          {auth.currentUser ? (
            <button 
              onClick={() => setShowOrderHistory(true)}
              className="view-orders-btn"
            >
              View Orders
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="login-btn"
            >
              Login to Track Orders
            </button>
          )}
        </div>
      </div>

      {showOrderHistory && (
        <OrderHistoryModal
          isOpen={showOrderHistory}
          onClose={() => setShowOrderHistory(false)}
        />
      )}
    </div>
  );
};

export default OrderConfirmation; 