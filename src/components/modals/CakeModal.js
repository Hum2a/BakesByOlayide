import React from 'react';
import { useCart } from '../../context/CartContext';
import '../styles/CakeModal.css';

const CakeModal = ({ cake, onClose, onAddToCart }) => {
  const { addToCart } = useCart();

  const handleAddToCart = () => {
    addToCart(cake);
    if (onAddToCart) {
      onAddToCart();
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-grid">
          <div className="modal-image">
            <img src={cake.image} alt={cake.name} />
          </div>
          
          <div className="modal-details">
            <h2>{cake.name}</h2>
            <p className="modal-price">£{cake.price.toFixed(2)}</p>
            <p className="modal-description">{cake.description}</p>
            
            <div className="modal-features">
              <h3>Features</h3>
              <ul>
                <li>Handcrafted with premium ingredients</li>
                <li>Customizable decorations available</li>
                <li>Freshly baked to order</li>
                <li>Available in various sizes</li>
              </ul>
            </div>
            
            <div className="modal-actions">
              <button 
                className="add-to-cart-btn"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button 
                className="customize-btn"
                onClick={() => window.location.href = '/cake-builder'}
              >
                Customize
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CakeModal; 