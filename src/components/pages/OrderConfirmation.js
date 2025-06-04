import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import { auth, db } from '../../firebase/firebase';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import '../styles/OrderConfirmation.css';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';
import { saveOrderAndInvoiceToFirebase } from '../../utils/firebaseOrder';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://bakesbyolayide-server.onrender.com';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total, items, guestInfo } = location.state || {};
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
    const sendConfirmationEmail = async () => {
      console.log('Starting order confirmation email process...');
      console.log('Guest info:', guestInfo);
      console.log('Current user:', user);
      
      // Get email from either guest info or user account
      const emailToUse = guestInfo?.email || user?.email;
      const customerName = guestInfo ? 
        `${guestInfo.firstName} ${guestInfo.lastName}` : 
        user?.displayName || 'Valued Customer';
      
      if (!emailToUse) {
        console.log('No email found in guest info or user account, skipping email confirmation');
        return;
      }

      try {
        console.log('Preparing to send confirmation email to:', emailToUse);
        console.log('Order details:', {
          orderId,
          customerName,
          items,
          total
        });

        const response = await fetch(`${API_BASE_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            customerName,
            customerEmail: emailToUse,
            items,
            total
          }),
        });
        
        console.log('Email API Response Status:', response.status);
        console.log('Email API Response Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Email API Error Response:', errorText);
          throw new Error(`Failed to send confirmation email: ${response.status} ${errorText}`);
        }

        const responseData = await response.json();
        console.log('Email API Success Response:', responseData);
        console.log('Order confirmation email sent successfully');
      } catch (error) {
        console.error('Error in order confirmation email process:', {
          error: error.message,
          stack: error.stack,
          orderId,
          customerEmail: emailToUse
        });
      }
    };

    console.log('Order confirmation email useEffect triggered');
    console.log('Current state:', {
      orderId,
      hasGuestInfo: !!guestInfo,
      hasItems: !!items,
      hasTotal: !!total,
      hasUser: !!user
    });

    sendConfirmationEmail();
  }, [orderId, items, total, guestInfo, user]);

  useEffect(() => {
    // If order data is present in location.state, use it
    if (orderId && items && guestInfo) {
      setOrderData({ orderId, items, total, guestInfo });
      saveOrderAndInvoiceToFirebase({ orderId, items, total, guestInfo });
      // Send order confirmation email from frontend
      if (guestInfo.email) {
        fetch(`${API_BASE_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: guestInfo.email,
            subject: 'Your Bakes by Olayide Order Confirmation',
            html: `<h1>Thank you for your order!</h1><p>Order ID: ${orderId}</p>`,
          }),
        }).then(res => {
          if (!res.ok) throw new Error('Failed to send confirmation email');
        }).catch(err => {
          console.error('Order confirmation email error:', err);
        });
      }
      return;
    }
    // Otherwise, try to fetch using session_id from URL
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    if (sessionId) {
      fetch(`${API_BASE_URL}/api/stripe-session?session_id=${sessionId}`)
        .then(res => res.json())
        .then(async ({ session }) => {
          const orderId = session.metadata.orderId;
          if (orderId) {
            // Update order status in Firestore
            await setDoc(doc(db, 'orders', orderId), { status: 'paid' }, { merge: true });
            // Update invoice status in Firestore
            await setDoc(doc(db, 'invoices', orderId), { status: 'paid' }, { merge: true });
          }
        });
    }
  }, []);

  if (loading) {
    return (
      <div className="order-confirmation-container">
        <PageTitle title="Order Confirmation" />
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
      <PageTitle title="Order Confirmation" />
      <Header />
      <div className="order-confirmation">
        <div className="confirmation-container">
          <div className="confirmation-icon">✓</div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your order. We'll send you an email confirmation shortly.</p>
          
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
                        <p>Price: ${item.price.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {orderData.total && (
                <div className="order-total">
                  <p>Total Amount: <span>${orderData.total.toFixed(2)}</span></p>
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