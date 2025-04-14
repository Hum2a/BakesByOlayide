import React, { useState, useEffect } from 'react';
import { FaTimes, FaShoppingBag, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/OrderHistoryModal.css';

const OrderHistoryModal = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOrders(userData.orders || []);
        }
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content order-history-modal">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2>Order History</h2>
        
        {orders.length === 0 ? (
          <div className="no-orders">
            <FaShoppingBag />
            <p>You haven't placed any orders yet</p>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <div key={index} className="order-item">
                <div className="order-header">
                  <span className="order-id">Order #{order.id}</span>
                  <span className="order-date">
                    <FaCalendarAlt /> {new Date(order.date).toLocaleDateString()}
                  </span>
                </div>
                <div className="order-items">
                  {order.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="order-item-detail">
                      <img src={item.image} alt={item.name} />
                      <div className="item-info">
                        <h4>{item.name}</h4>
                        <p>Quantity: {item.quantity}</p>
                      </div>
                      <div className="item-price">
                        <FaDollarSign /> {item.price * item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-footer">
                  <div className="order-total">
                    Total: <FaDollarSign /> {order.total}
                  </div>
                  <div className="order-status">
                    Status: <span className={`status-${order.status.toLowerCase()}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryModal; 