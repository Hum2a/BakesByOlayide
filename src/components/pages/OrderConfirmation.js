import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import { auth, db } from '../../firebase/firebase';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import '../styles/OrderConfirmation.css';
import { doc, setDoc, collection, addDoc, Timestamp, getDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
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

  const fetchMostRecentOrder = async () => {
    console.log('Attempting to fetch most recent order from Firebase');
    try {
      let recentOrder = null;

      // First try user's orders if logged in
      if (user) {
        const userOrdersRef = collection(db, 'users', user.uid, 'Orders');
        const userOrdersQuery = query(userOrdersRef, orderBy('createdAt', 'desc'), limit(1));
        const userOrdersSnapshot = await getDocs(userOrdersQuery);
        
        if (!userOrdersSnapshot.empty) {
          const doc = userOrdersSnapshot.docs[0];
          console.log('Found most recent order in user orders:', doc.id);
          return { ...doc.data(), id: doc.id };
        }
      }

      // If no user orders or not logged in, try main orders collection
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'), limit(1));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (!ordersSnapshot.empty) {
        const doc = ordersSnapshot.docs[0];
        console.log('Found most recent order in main orders:', doc.id);
        return { ...doc.data(), id: doc.id };
      }

      console.log('No recent orders found in Firebase');
      return null;
    } catch (error) {
      console.error('Error fetching most recent order:', error);
      return null;
    }
  };

  const fetchOrderFromFirebase = async (orderId) => {
    console.log('Attempting to fetch order from Firebase:', orderId);
    try {
      // Try to get order from main orders collection
      const orderDoc = await getDoc(doc(db, 'orders', orderId));
      if (orderDoc.exists()) {
        console.log('Found order in main orders collection');
        return orderDoc.data();
      }

      // If not found and user is logged in, try user's orders subcollection
      if (user) {
        const userOrderDoc = await getDoc(doc(db, 'users', user.uid, 'Orders', orderId));
        if (userOrderDoc.exists()) {
          console.log('Found order in user orders subcollection');
          return userOrderDoc.data();
        }
      }

      console.log('Order not found in Firebase');
      return null;
    } catch (error) {
      console.error('Error fetching order from Firebase:', error);
      return null;
    }
  };

  useEffect(() => {
    if (loading) return; // Wait until auth state is known

    const sendConfirmationEmail = async (finalOrderData) => {
      console.log('Starting order confirmation email process...');
      console.log('Guest info:', guestInfo);
      console.log('Current user:', user);
      console.log('Final order details:', finalOrderData);
      
      // Validate required data
      if (!finalOrderData.orderId) {
        console.log('Missing orderId, skipping email confirmation');
        return;
      }

      if (!finalOrderData.items || !Array.isArray(finalOrderData.items) || finalOrderData.items.length === 0) {
        console.log('Missing or invalid items, skipping email confirmation');
        return;
      }

      if (!finalOrderData.total || typeof finalOrderData.total !== 'number') {
        console.log('Missing or invalid total, skipping email confirmation');
        return;
      }
      
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
        console.log('Final order details:', {
          orderId: finalOrderData.orderId,
          customerName,
          items: finalOrderData.items,
          total: finalOrderData.total
        });

        const emailPayload = {
          to: emailToUse,
          subject: 'Your Bakes by Olayide Order Confirmation',
          html: buildOrderEmailHtml(finalOrderData, null),
          orderId: finalOrderData.orderId,
          customerName,
          items: finalOrderData.items,
          total: finalOrderData.total
        };

        console.log('Sending email payload:', emailPayload);

        const response = await fetch(`${API_BASE_URL}/api/send-order-confirmation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(emailPayload),
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
          orderId: finalOrderData.orderId,
          customerEmail: emailToUse,
          payload: {
            orderId: finalOrderData.orderId,
            customerName,
            items: finalOrderData.items,
            total: finalOrderData.total
          }
        });
      }
    };

    const processOrderConfirmation = async () => {
      console.log('Order confirmation email useEffect triggered');
      console.log('Current state:', {
        orderId,
        hasGuestInfo: !!guestInfo,
        hasItems: !!items,
        hasTotal: !!total,
        hasUser: !!user,
        itemsLength: items?.length,
        totalValue: total
      });

      let finalOrderData = { orderId, items, total };

      // If orderId is missing, try to fetch the most recent order
      if (!orderId) {
        console.log('No orderId available, attempting to fetch most recent order');
        const recentOrder = await fetchMostRecentOrder();
        if (recentOrder) {
          finalOrderData = {
            orderId: recentOrder.id,
            items: recentOrder.items,
            total: recentOrder.total
          };
        } else {
          console.log('No recent order found, skipping email confirmation');
          return;
        }
      }

      await sendConfirmationEmail(finalOrderData);
    };

    processOrderConfirmation();
  }, [orderId, items, total, guestInfo, user, loading]);

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
            html: buildOrderEmailHtml({ orderId, items, total, guestInfo }, null),
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

// Helper to build order confirmation email HTML
function buildOrderEmailHtml(order, invoice) {
  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding:8px 4px;">
        <img src="${item.image}" alt="${item.name}" style="width:60px;height:60px;object-fit:cover;border-radius:6px;" /><br/>
        <b>${item.name}</b>
      </td>
      <td style="padding:8px 4px;">${item.quantity}</td>
      <td style="padding:8px 4px;">£${item.price?.toFixed(2) || '0.00'}</td>
      <td style="padding:8px 4px;">
        Size: ${item.selectedSize?.size || ''}<br/>
        Shape: ${item.selectedShape?.name || ''}<br/>
        Finish: ${item.selectedFinish?.name || ''}<br/>
        Occasion: ${item.occasion || ''}<br/>
        Addons: ${(item.addons || []).join(', ')}<br/>
        Notes: ${item.notes || ''}
      </td>
    </tr>
  `).join('');

  return `
    <div style="font-family:sans-serif;max-width:600px;margin:auto;">
      <h1>Thank you for your order!</h1>
      <p>Order ID: <b>${order.orderId}</b></p>
      <p>Status: <b>${order.status || invoice?.status || ''}</b></p>
      <p>Order Date: <b>${order.createdAt ? (order.createdAt.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleString() : new Date(order.createdAt).toLocaleString()) : ''}</b></p>
      <p>Pickup: <b>${order.pickupDate || ''} ${order.pickupTime || ''}</b></p>
      <h2>Customer Details</h2>
      <p>
        Name: <b>${order.guestInfo?.name || order.customerName || ''}</b><br/>
        Email: <b>${order.guestInfo?.email || order.userEmail || ''}</b><br/>
        Phone: <b>${order.guestInfo?.phone || ''}</b>
      </p>
      <h2>Order Items</h2>
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr>
            <th style="border-bottom:1px solid #ccc;">Item</th>
            <th style="border-bottom:1px solid #ccc;">Qty</th>
            <th style="border-bottom:1px solid #ccc;">Price</th>
            <th style="border-bottom:1px solid #ccc;">Options</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <h2 style="text-align:right;">Total: £${order.total?.toFixed(2) || invoice?.amount?.toFixed(2) || '0.00'}</h2>
      <p style="margin-top:2em;">If you have any questions, reply to this email or contact us at <a href=\"mailto:info@bakesbyolayide.co.uk\">info@bakesbyolayide.co.uk</a>.</p>
    </div>
  `;
}

export default OrderConfirmation; 