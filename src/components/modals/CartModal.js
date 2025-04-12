import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { FaMinus, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import '../styles/CartModal.css';

const CartModal = ({ onClose }) => {
  const { cart, totalPrice, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  const [itemToRemove, setItemToRemove] = useState(null);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  const handleRemoveItem = (itemId) => {
    setItemToRemove(itemId);
    setTimeout(() => {
      removeFromCart(itemId);
      setItemToRemove(null);
    }, 500); // Match animation duration
  };

  const generateParticles = () => {
    return Array.from({ length: 12 }).map((_, i) => (
      <div key={i} className="particle" />
    ));
  };

  return (
    <div className="cart-modal-overlay" onClick={onClose}>
      <div className="cart-modal" onClick={e => e.stopPropagation()}>
        <div className="cart-modal-header">
          <h2>Your Shopping Cart</h2>
          <button className="close-modal" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="cart-empty">
            <p>Your cart is empty</p>
            <button className="continue-shopping" onClick={onClose}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.map((item) => (
                <div 
                  key={item.id} 
                  className={`cart-item ${itemToRemove === item.id ? 'removing' : ''}`}
                >
                  <img src={item.image} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="cart-item-price">${item.price.toFixed(2)}</p>
                    <div className="cart-item-quantity">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        <FaMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        <FaPlus />
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="remove-item"
                  >
                    <FaTrash />
                  </button>
                  {itemToRemove === item.id && (
                    <div className="particles-container">
                      {generateParticles()}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button className="checkout-btn" onClick={handleCheckout}>
                Proceed to Checkout
              </button>
              <button className="continue-shopping" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartModal; 