import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';
import CartModal from '../modals/CartModal';
import '../styles/CakeBuilder.css';

const CakeBuilder = ({ onRequestCake }) => {
  const { addToCart, totalItems, totalPrice } = useCart();
  const [selections, setSelections] = useState({
    size: '',
    flavor: '',
    frosting: '',
    decorations: []
  });
  const [showAddedAnimation, setShowAddedAnimation] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const prices = {
    size: {
      '6"': 30,
      '8"': 40,
      '10"': 55,
      'Custom Size': 70
    },
    flavor: {
      'Vanilla': 0,
      'Chocolate': 0,
      'Red Velvet': 5,
      'Marble': 5,
      'Carrot': 5
    },
    frosting: {
      'Buttercream': 0,
      'Cream Cheese': 5,
      'Chocolate Ganache': 8,
      'Fondant': 15
    },
    decorations: {
      'Fresh Flowers': 10,
      'Fresh Fruit': 8,
      'Sprinkles': 3,
      'Custom Design': 20
    }
  };

  const calculatePrice = () => {
    let total = 0;
    if (selections.size) total += prices.size[selections.size];
    if (selections.flavor) total += prices.flavor[selections.flavor];
    if (selections.frosting) total += prices.frosting[selections.frosting];
    selections.decorations.forEach(dec => {
      total += prices.decorations[dec];
    });
    return total;
  };

  const handleSelection = (category, value) => {
    setSelections(prev => {
      if (category === 'decorations') {
        const decorations = prev.decorations.includes(value)
          ? prev.decorations.filter(d => d !== value)
          : [...prev.decorations, value];
        return { ...prev, decorations };
      }
      return { ...prev, [category]: value };
    });
  };

  const isOptionSelected = (category, value) => {
    if (category === 'decorations') {
      return selections.decorations.includes(value);
    }
    return selections[category] === value;
  };

  const canAddToCart = () => {
    return selections.size && selections.flavor && selections.frosting;
  };

  const handleAddToCart = () => {
    const customCake = {
      id: `custom-cake-${Date.now()}`,
      name: 'Custom Design Cake',
      description: `${selections.size} ${selections.flavor} cake with ${selections.frosting} frosting${selections.decorations.length ? ` and ${selections.decorations.join(', ')}` : ''}`,
      price: calculatePrice(),
      image: '/images/custom-cake.jpg', // You'll need to add a default image for custom cakes
      customizations: selections
    };

    addToCart(customCake);
    setShowAddedAnimation(true);
    setTimeout(() => {
      setShowAddedAnimation(false);
      setSelections({
        size: '',
        flavor: '',
        frosting: '',
        decorations: []
      });
    }, 2000);
  };

  return (
    <section className="homepage-design-cake">
      <div className="design-cake-container">
        <div className="design-cake-header">
          <h2>Design Your Dream Cake</h2>
          <button 
            className="cart-preview-button" 
            onClick={() => setIsCartOpen(true)}
          >
            <FaShoppingCart />
            <span className="cart-items-count">{totalItems}</span>
            <span className="cart-total">${totalPrice.toFixed(2)}</span>
          </button>
        </div>
        <p>Create your perfect cake with our easy customization options</p>
        
        <div className="design-options">
          <div className="design-option-group">
            <h3>Size</h3>
            <div className="option-buttons">
              {Object.keys(prices.size).map(size => (
                <button
                  key={size}
                  className={`option-button ${isOptionSelected('size', size) ? 'selected' : ''}`}
                  onClick={() => handleSelection('size', size)}
                >
                  {size} {size !== 'Custom Size' && `(${size === '6"' ? '8-10' : size === '8"' ? '12-15' : '20-25'} servings)`}
                  <span className="price-tag">+${prices.size[size]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="design-option-group">
            <h3>Cake Flavor</h3>
            <div className="option-buttons">
              {Object.keys(prices.flavor).map(flavor => (
                <button
                  key={flavor}
                  className={`option-button ${isOptionSelected('flavor', flavor) ? 'selected' : ''}`}
                  onClick={() => handleSelection('flavor', flavor)}
                >
                  {flavor}
                  {prices.flavor[flavor] > 0 && <span className="price-tag">+${prices.flavor[flavor]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="design-option-group">
            <h3>Frosting</h3>
            <div className="option-buttons">
              {Object.keys(prices.frosting).map(frosting => (
                <button
                  key={frosting}
                  className={`option-button ${isOptionSelected('frosting', frosting) ? 'selected' : ''}`}
                  onClick={() => handleSelection('frosting', frosting)}
                >
                  {frosting}
                  {prices.frosting[frosting] > 0 && <span className="price-tag">+${prices.frosting[frosting]}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="design-option-group">
            <h3>Decorations</h3>
            <div className="option-buttons">
              {Object.keys(prices.decorations).map(decoration => (
                <button
                  key={decoration}
                  className={`option-button ${isOptionSelected('decorations', decoration) ? 'selected' : ''}`}
                  onClick={() => handleSelection('decorations', decoration)}
                >
                  {decoration}
                  <span className="price-tag">+${prices.decorations[decoration]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cake-price-summary">
          <h3>Total Price: ${calculatePrice()}</h3>
        </div>

        <button 
          className={`design-submit-button ${showAddedAnimation ? 'added' : ''}`}
          onClick={handleAddToCart}
          disabled={!canAddToCart()}
        >
          {showAddedAnimation ? (
            <>
              <FaCheck className="button-icon" />
              Added to Cart!
            </>
          ) : (
            <>
              <FaShoppingCart className="button-icon" />
              Add Custom Cake to Cart
            </>
          )}
        </button>

        {isCartOpen && <CartModal onClose={() => setIsCartOpen(false)} />}
      </div>
    </section>
  );
};

export default CakeBuilder;
