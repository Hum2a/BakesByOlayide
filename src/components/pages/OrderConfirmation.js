import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import { auth } from '../../firebase/firebase';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import '../styles/OrderConfirmation.css';
const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total, items, guestInfo, emailDeliveryFailed, emailInBackground } = location.state || {};
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (orderId && items && guestInfo) {
      setOrderData({ orderId, items, total, guestInfo });
    }
  }, [loading, orderId, items, total, guestInfo]);

  if (loading) {
    return (
      <div className="order-confirmation-container">
        <PageTitle title="Order request received" />
        <Header />
        <div className="order-confirmation">
          <div className="confirmation-container">
            <div className="loading-spinner">Loading...</div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="order-confirmation-container">
      <PageTitle title="Order request received" />
      <Header />
      <div className="order-confirmation">
        <div className="confirmation-container">
          <div className="confirmation-icon">✓</div>
          <h1>Thank you — we’ve received your request</h1>
          <p>
            Your order enquiry is saved
            {emailDeliveryFailed
              ? '. We could not send emails automatically — please contact the bakery with your order reference below.'
              : emailInBackground
                ? '. Confirmation emails are being sent now — you should see them shortly (check spam). Our team will contact you by email or phone to confirm details and arrange payment in person.'
                : ' and we’ve emailed you a summary. Our team will contact you by email or phone to confirm details and arrange payment in person.'}
          </p>
          
          {orderData && (
            <div className="order-details">
              <h2>Order Details</h2>
              <p className="order-id">Order ID: {orderData.orderId}</p>
              
              {orderData.items && orderData.items.length > 0 && (
                <div className="order-items">
                  <h3>Items Ordered</h3>
                  {orderData.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-image">
                        <img src={item.image} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                        <p>Price: £{item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {orderData.total && (
                <div className="order-total">
                  <p>Quoted total: <span>£{orderData.total.toFixed(2)}</span></p>
                </div>
              )}
            </div>
          )}

          <div className="confirmation-details">
            <p>We’ll review your basket and confirm pickup, pricing, and payment (in person) with you directly.</p>
            {guestInfo && !emailDeliveryFailed && (
              <div className="guest-info">
                <p>
                  {emailInBackground
                    ? `We’re sending a copy to: ${guestInfo.email}`
                    : `A copy has been sent to: ${guestInfo.email}`}
                </p>
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
            {user ? (
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
      <Footer />
    </div>
  );
};

export default OrderConfirmation;