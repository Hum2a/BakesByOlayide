import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, getDocs, orderBy, doc as firestoreDoc, updateDoc, getDoc } from 'firebase/firestore';
import { FaCalendar, FaUser, FaClock, FaBox, FaTruck, FaTimes } from 'react-icons/fa';
import '../../styles/OrderManagement.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = firestoreDoc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });
      await fetchOrders(); // Refresh orders after update
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status');
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
                  <td className="order-total">
                    ${order.total.toFixed(2)}
                  </td>
                  <td className="order-status">
                    <span className={`status-badge ${statusInfo.class}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </span>
                  </td>
                  <td className="order-actions">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className="status-select"
                    >
                      <option value="confirmed">Confirm</option>
                      <option value="ready">Ready for Pickup</option>
                      <option value="completed">Complete</option>
                      <option value="cancelled">Cancel</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement; 