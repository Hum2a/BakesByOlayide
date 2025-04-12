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
    <div className="cakemodal-overlay" onClick={onClose}>
      <div className="cakemodal-content" onClick={e => e.stopPropagation()}>
        <button className="cakemodal-close" onClick={onClose}>×</button>
        
        <div className="cakemodal-grid">
          <div className="cakemodal-image">
            <img src={cake.image} alt={cake.name} />
          </div>
          
          <div className="cakemodal-details">
            <h2>{cake.name}</h2>
            <p className="cakemodal-price">£{cake.price.toFixed(2)}</p>
            <p className="cakemodal-description">{cake.description}</p>
            
            <div className="cakemodal-features">
              <h3>Features</h3>
              <ul>
                <li>Handcrafted with premium ingredients</li>
                <li>Customizable decorations available</li>
                <li>Freshly baked to order</li>
                <li>Available in various sizes</li>
              </ul>
            </div>
            
            <div className="cakemodal-actions">
              <button 
                className="cakemodal-add-to-cart-btn"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>
              <button 
                className="cakemodal-customize-btn"
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