import React, { useState, useEffect } from 'react';
import { FaTimes, FaShoppingBag, FaCalendarAlt, FaClock, FaBox, FaTruck, FaStar } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import ReviewModal from './ReviewModal';
import '../styles/OrderHistoryModal.css';

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewedItems, setReviewedItems] = useState(new Set());

  useEffect(() => {
    const fetchOrders = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }

      try {
        const ordersRef = collection(db, 'users', auth.currentUser.uid, 'Orders');
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(ordersQuery);
        
        const ordersData = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        setOrders(ordersData);
        await fetchReviewedItems(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  const fetchReviewedItems = async (orders) => {
    try {
      const reviewedSet = new Set();
      
      for (const order of orders) {
        for (const item of order.items) {
          const reviewsQuery = query(
            collection(db, 'cakes', item.id, 'reviews'),
            where('userId', '==', auth.currentUser.uid),
            where('orderId', '==', order.id)
          );
          const reviewsSnapshot = await getDocs(reviewsQuery);
          
          if (!reviewsSnapshot.empty) {
            reviewedSet.add(`${order.id}-${item.id}`);
          }
        }
      }
      
      setReviewedItems(reviewedSet);
    } catch (error) {
      console.error('Error fetching reviewed items:', error);
    }
  };

  const handleReviewClick = (item, orderId) => {
    setSelectedItem({ ...item, orderId });
  };

  const handleReviewClose = () => {
    setSelectedItem(null);
    // Refresh the reviewed items list
    fetchReviewedItems(orders);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      // Handle Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      // Handle Date object
      date = timestamp;
    } else if (typeof timestamp === 'number') {
      // Handle Unix timestamp
      date = new Date(timestamp);
    } else if (typeof timestamp === 'string') {
      // Handle date string
      date = new Date(timestamp);
    } else {
      return 'Invalid Date';
    }

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
          label: 'Order Confirmed'
        };
      case 'completed':
        return {
          icon: <FaTruck />,
          class: 'status-completed',
          label: 'Ready for Pickup'
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

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content order-history-modal">
        <div className="order-history-header">
          <h2>Order History</h2>
          <button className="close-button" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="no-orders">
            <FaShoppingBag />
            <h3>No Orders Yet</h3>
            <p>When you place orders, they will appear here</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const formattedDate = formatDate(order.createdAt);
              const statusInfo = getStatusInfo(order.status);
              
              return (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-info">
                      <div className="order-number">
                        Order #{order.id.slice(-8)}
                      </div>
                      <div className="order-date">
                        <FaCalendarAlt />
                        <div className="date-time">
                          <span>{formattedDate.date}</span>
                          <span className="time">{formattedDate.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className={`order-status ${statusInfo.class}`}>
                      {statusInfo.icon}
                      <span>{statusInfo.label}</span>
                    </div>
                  </div>

                  <div className="order-items-grid">
                    {order.items.map((item, index) => {
                      const isReviewed = reviewedItems.has(`${order.id}-${item.id}`);
                      
                      return (
                        <div key={index} className="order-item-card">
                          <div className="item-image">
                            <img src={item.image} alt={item.name} />
                          </div>
                          <div className="item-details">
                            <h4>{item.name}</h4>
                            <div className="item-meta">
                              <span className="quantity">Qty: {item.quantity}</span>
                              <span className="price">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {(order.status?.toLowerCase() === 'completed' || 
                              order.status?.toLowerCase() === 'confirmed' ||
                              order.status?.toLowerCase() === 'order confirmed') && (
                              <button
                                className={`review-btn ${isReviewed ? 'reviewed' : ''}`}
                                onClick={() => !isReviewed && handleReviewClick(item, order.id)}
                                disabled={isReviewed}
                              >
                                <FaStar />
                                {isReviewed ? 'Reviewed' : 'Write Review'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="order-footer">
                    <div className="pickup-info">
                      {order.pickupDate ? (
                        <>
                          <FaTruck />
                          <span>Pickup scheduled for: {formatDate(order.pickupDate).date}</span>
                        </>
                      ) : (
                        <>
                          <FaClock />
                          <span>Pickup time will be confirmed soon</span>
                        </>
                      )}
                    </div>
                    <div className="order-totals">
                      <div className="subtotal">
                        <span>Subtotal</span>
                        <span>${(order.subtotal || 0).toFixed(2)}</span>
                      </div>
                      <div className="total">
                        <span>Total</span>
                        <span>${(order.total || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedItem && (
        <ReviewModal
          isOpen={true}
          onClose={handleReviewClose}
          item={selectedItem}
          orderId={selectedItem.orderId}
        />
      )}
    </div>
  );
};

export default OrderHistoryModal; 