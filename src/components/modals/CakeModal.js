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
                {cake.ingredients && cake.ingredients.length > 0 && (
                  <li>Ingredients: {cake.ingredients.join(', ')}</li>
                )}
                {cake.dietaryInfo && cake.dietaryInfo.length > 0 && (
                  <li>Dietary Information: {cake.dietaryInfo.join(', ')}</li>
                )}
                {cake.allergens && cake.allergens.length > 0 && (
                  <li>Allergens: {cake.allergens.join(', ')}</li>
                )}
                {cake.servingSize && (
                  <li>Serves: {cake.servingSize} people</li>
                )}
                {cake.dimensions && (
                  <li>Size: {cake.dimensions.size}{cake.dimensions.unit} {cake.dimensions.shape}</li>
                )}
                {cake.prepTime && (
                  <li>Preparation Time: {cake.prepTime.value} {cake.prepTime.unit}</li>
                )}
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