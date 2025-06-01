import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import { auth, db } from '../../firebase/firebase';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import '../styles/OrderConfirmation.css';
import { doc, setDoc, collection, addDoc, Timestamp } from 'firebase/firestore';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId, total, items, guestInfo } = location.state || {};
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  useEffect(() => {
    const sendConfirmationEmail = async () => {
      if (guestInfo?.email) {
        try {
          const response = await fetch(`${API_BASE_URL}/api/send-order-confirmation`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId,
              customerName: `${guestInfo.firstName} ${guestInfo.lastName}`,
              customerEmail: guestInfo.email,
              items,
              total
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to send confirmation email');
          }
        } catch (error) {
          console.error('Error sending confirmation email:', error);
        }
      }
    };

    sendConfirmationEmail();
  }, [orderId, items, total, guestInfo]);

  useEffect(() => {
    const saveOrderAndInvoice = async () => {
      if (!orderId || !items || !guestInfo) return;

      try {
        // Prepare order data
        const orderData = {
          orderId,
          items,
          total,
          guestInfo,
          createdAt: Timestamp.now(),
          status: 'confirmed',
        };

        // Save order to /orders
        const orderRef = doc(db, 'orders', orderId);
        await setDoc(orderRef, orderData);

        // Optionally, save to user's subcollection if logged in
        if (auth.currentUser) {
          const userOrderRef = doc(db, 'users', auth.currentUser.uid, 'Orders', orderId);
          await setDoc(userOrderRef, orderData);
        }

        // Prepare invoice data
        const invoiceData = {
          orderId,
          items: items.map(item => ({
            ...item,
            total: item.price * item.quantity,
          })),
          amount: total,
          status: 'unpaid',
          createdAt: Timestamp.now(),
          customerEmail: guestInfo.email,
        };

        // Save invoice to /invoices
        const invoiceRef = doc(collection(db, 'invoices'));
        await setDoc(invoiceRef, invoiceData);

        // Optionally, save to user's subcollection if logged in
        if (auth.currentUser) {
          const userInvoiceRef = doc(db, 'users', auth.currentUser.uid, 'Invoices', invoiceRef.id);
          await setDoc(userInvoiceRef, invoiceData);
        }

        // Link invoice to order
        await setDoc(orderRef, { invoiceRef: invoiceRef.path }, { merge: true });
        if (auth.currentUser) {
          const userOrderRef = doc(db, 'users', auth.currentUser.uid, 'Orders', orderId);
          await setDoc(userOrderRef, { invoiceRef: invoiceRef.path }, { merge: true });
        }
      } catch (err) {
        console.error('Error saving order/invoice:', err);
      }
    };

    saveOrderAndInvoice();
  }, [orderId, items, total, guestInfo]);

  return (
    <div className="order-confirmation-container">
      <PageTitle title="Order Confirmation" />
      <Header />
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
      <Footer />
    </div>
  );
};

export default OrderConfirmation; 