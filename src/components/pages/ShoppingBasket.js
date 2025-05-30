import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';
import '../styles/ShoppingBasket.css';

const ShoppingBasket = () => {
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
    calculateTotal(savedCart);
  }, []);

  const calculateTotal = (items) => {
    const sum = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    setTotal(sum);
  };

  const updateQuantity = (id, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    calculateTotal(updatedCart);
  };

  const removeItem = (id) => {
    const updatedCart = cart.filter(item => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    calculateTotal(updatedCart);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="shopping-basket-container">
      <PageTitle title="Shopping Basket" />
      <Header />
      <div className="shopping-basket">
        <h1>Your Shopping Basket</h1>
        
        {cart.length === 0 ? (
          <div className="shopping-basket-empty">
            <p>Your basket is empty</p>
            <button onClick={() => navigate('/collections')} className="shopping-basket-continue-btn">
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="shopping-basket-cart-container">
            <div className="shopping-basket-items">
              {cart.map(item => (
                <div key={item.id} className="shopping-basket-item">
                  <img src={item.image} alt={item.name} className="shopping-basket-item-image" />
                  <div className="shopping-basket-item-details">
                    <h3>{item.name}</h3>
                    <p className="shopping-basket-item-price">£{item.price.toFixed(2)}</p>
                    <div className="shopping-basket-quantity-controls">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="shopping-basket-quantity-btn"
                      >
                        -
                      </button>
                      <span className="shopping-basket-quantity">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="shopping-basket-quantity-btn"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeItem(item.id)}
                    className="shopping-basket-remove-btn"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="shopping-basket-summary">
              <h2>Order Summary</h2>
              <div className="shopping-basket-summary-item">
                <span>Subtotal</span>
                <span>£{total.toFixed(2)}</span>
              </div>
              <div className="shopping-basket-summary-item">
                <span>Delivery</span>
                <span>£5.00</span>
              </div>
              <div className="shopping-basket-summary-item shopping-basket-total">
                <span>Total</span>
                <span>£{(total + 5).toFixed(2)}</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="shopping-basket-checkout-btn"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default ShoppingBasket; 