import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, getDocs, orderBy, doc as firestoreDoc, updateDoc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { FaCalendar, FaUser, FaClock, FaBox, FaTruck, FaTimes, FaFileInvoice } from 'react-icons/fa';
import InvoiceModal from './InvoiceModal';
import '../../styles/OrderManagement.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const ordersData = await Promise.all(querySnapshot.docs.map(async (doc) => {
        const orderData = { id: doc.id, ...doc.data() };
        
        // Fetch user data if userId exists
        if (orderData.userId) {
          try {
            const userDoc = await getDoc(firestoreDoc(db, 'users', orderData.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              orderData.customerName = userData.displayName;
              orderData.customerEmail = userData.email;
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            orderData.customerName = 'Unknown Customer';
            orderData.customerEmail = 'N/A';
          }
        }
        
        return orderData;
      }));
      
      setOrders(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, invoiceRef) => {
    try {
      const orderRef = firestoreDoc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      // If confirming, also update invoice status to paid
      if (newStatus === 'confirmed' && invoiceRef) {
        try {
          await setDoc(firestoreDoc(db, invoiceRef), { status: 'paid' }, { merge: true });
        } catch (e) {
          // ignore
        }
      }
      await fetchOrders(); // Refresh orders after update
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
    }
  };

  const deleteOrder = async (orderId, invoiceRef) => {
    if (!window.confirm('Are you sure you want to delete this order? This cannot be undone.')) return;
    try {
      await deleteDoc(firestoreDoc(db, 'orders', orderId));
      if (invoiceRef) {
        try {
          await deleteDoc(firestoreDoc(db, invoiceRef));
        } catch (e) {}
      }
      await fetchOrders();
    } catch (error) {
      alert('Failed to delete order.');
      console.error('Error deleting order:', error);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate();
    return {
      date: date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return {
          icon: <FaBox />,
          class: 'status-confirmed',
          label: 'Confirmed'
        };
      case 'ready':
        return {
          icon: <FaTruck />,
          class: 'status-ready',
          label: 'Ready for Pickup'
        };
      case 'completed':
        return {
          icon: <FaBox />,
          class: 'status-completed',
          label: 'Completed'
        };
      case 'cancelled':
        return {
          icon: <FaTimes />,
          class: 'status-cancelled',
          label: 'Cancelled'
        };
      default:
        return {
          icon: <FaClock />,
          class: 'status-pending',
          label: 'Processing'
        };
    }
  };

  const handleViewInvoice = (url) => {
    setInvoiceUrl(url);
    setInvoiceModalOpen(true);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchOrders}>Retry</button>
      </div>
    );
  }

  return (
    <div className="order-management">
      <div className="order-management-header">
        <h2>Order Management</h2>
        <button onClick={fetchOrders} className="refresh-button">
          Refresh Orders
        </button>
      </div>

      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Invoice</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const formattedDate = formatDate(order.createdAt);
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <tr key={order.id}>
                  <td className="order-id">
                    <span className="id-label">#{order.id.slice(-8)}</span>
                  </td>
                  <td className="customer-info">
                    <div className="customer-name">
                      <FaUser className="icon" />
                      {order.customerName || 'Unknown Customer'}
                    </div>
                    <div className="customer-email">{order.customerEmail || 'N/A'}</div>
                    {/* Show userId and userEmail if available */}
                    {order.userId && (
                      <div className="customer-userid" style={{ color: '#bbb', fontSize: '0.8em', marginLeft: '1.5rem' }}>User ID: {order.userId}</div>
                    )}
                    {order.userEmail && order.userEmail !== order.customerEmail && (
                      <div className="customer-useremail" style={{ color: '#bbb', fontSize: '0.8em', marginLeft: '1.5rem' }}>User Email: {order.userEmail}</div>
                    )}
                  </td>
                  <td className="order-date">
                    <div className="date">
                      <FaCalendar className="icon" />
                      {formattedDate.date}
                    </div>
                    <div className="time">{formattedDate.time}</div>
                  </td>
                  <td className="order-items">
                    {order.items.map((item, index) => (
                      <div key={index} className="order-item-mini">
                        <span className="item-name">{item.name}</span>
                        <span className="item-quantity">×{item.quantity}</span>
                      </div>
                    ))}
                  </td>
                  <td className="order-total">£{order.total.toFixed(2)}</td>
                  <td className="order-status">
                    <span className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  </td>
                  <td className="order-invoice">
                    {order.invoiceRef ? (
                      <button
                        className="invoice-link-btn"
                        onClick={() => handleViewInvoice(order.invoiceRef)}
                        title="View Invoice"
                        type="button"
                      >
                        <FaFileInvoice style={{ marginRight: '0.4em' }} />View Invoice
                      </button>
                    ) : (
                      <span style={{ color: '#bbb' }}>N/A</span>
                    )}
                  </td>
                  <td className="order-actions">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value, order.invoiceRef)}
                      className="status-select"
                    >
                      <option value="confirmed">Confirm</option>
                      <option value="ready">Ready for Pickup</option>
                      <option value="completed">Complete</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                    {/* Manual confirm button for incomplete/unpaid/pending orders */}
                    {['pending', 'unpaid', 'incomplete'].includes((order.status || '').toLowerCase()) && (
                      <button
                        className="manual-confirm-btn"
                        style={{ marginTop: 8, background: '#f3c307', color: '#111', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                        onClick={() => updateOrderStatus(order.id, 'confirmed', order.invoiceRef)}
                        title="Manually confirm this order and mark invoice as paid"
                      >
                        Confirm Order
                      </button>
                    )}
                    {/* Delete order button */}
                    <button
                      className="delete-order-btn"
                      style={{ marginTop: 8, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 1rem', fontWeight: 600, cursor: 'pointer' }}
                      onClick={() => deleteOrder(order.id, order.invoiceRef)}
                      title="Delete this order and its invoice"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <InvoiceModal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        invoiceUrl={invoiceUrl}
      />
    </div>
  );
};

export default OrderManagement; 