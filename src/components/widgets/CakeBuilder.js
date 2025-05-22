import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';
import { FaShoppingCart, FaCheck } from 'react-icons/fa';
import CartModal from '../modals/CartModal';
import { db } from '../../firebase/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import CakePreview3D from './CakePreview3D';
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
  const [options, setOptions] = useState({
    sizes: [],
    flavors: [],
    frostings: [],
    decorations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setLoading(true);
        const optionsRef = doc(db, 'cakeOptions', 'customizationOptions');
        const snapshot = await getDoc(optionsRef);
        
        if (snapshot.exists()) {
          setOptions(snapshot.data());
        } else {
          setOptions({
            sizes: [],
            flavors: [],
            frostings: [],
            decorations: []
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching options:', err);
        setError('Failed to load cake options. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const calculatePrice = () => {
    let total = 0;
    
    if (selections.size) {
      const sizeOption = options.sizes.find(opt => opt.name === selections.size);
      if (sizeOption) total += sizeOption.price;
    }
    
    if (selections.flavor) {
      const flavorOption = options.flavors.find(opt => opt.name === selections.flavor);
      if (flavorOption) total += flavorOption.price;
    }
    
    if (selections.frosting) {
      const frostingOption = options.frostings.find(opt => opt.name === selections.frosting);
      if (frostingOption) total += frostingOption.price;
    }
    
    selections.decorations.forEach(decoration => {
      const decorationOption = options.decorations.find(opt => opt.name === decoration);
      if (decorationOption) total += decorationOption.price;
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
      image: '/images/custom-cake.jpg',
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

  if (loading) {
    return (
      <div className="design-cake-container">
        <div className="loading-spinner">Loading customization options...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="design-cake-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

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
            <span className="cart-total">£{totalPrice.toFixed(2)}</span>
          </button>
        </div>
        <p>Create your perfect cake with our easy customization options</p>
        
        <div className="design-options">
          <div className="design-option-group">
            <h3>Size</h3>
            <div className="option-buttons">
              {options.sizes.map(size => (
                <button
                  key={size.name}
                  className={`option-button ${isOptionSelected('size', size.name) ? 'selected' : ''}`}
                  onClick={() => handleSelection('size', size.name)}
                >
                  {size.name}
                  <span className="price-tag">+£{size.price}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="design-option-group">
            <h3>Cake Flavor</h3>
            <div className="option-buttons">
              {options.flavors.map(flavor => (
                <button
                  key={flavor.name}
                  className={`option-button ${isOptionSelected('flavor', flavor.name) ? 'selected' : ''}`}
                  onClick={() => handleSelection('flavor', flavor.name)}
                >
                  {flavor.name}
                  {flavor.price > 0 && <span className="price-tag">+£{flavor.price}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="design-option-group">
            <h3>Frosting</h3>
            <div className="option-buttons">
              {options.frostings.map(frosting => (
                <button
                  key={frosting.name}
                  className={`option-button ${isOptionSelected('frosting', frosting.name) ? 'selected' : ''}`}
                  onClick={() => handleSelection('frosting', frosting.name)}
                >
                  {frosting.name}
                  {frosting.price > 0 && <span className="price-tag">+£{frosting.price}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="design-option-group">
            <h3>Decorations</h3>
            <div className="option-buttons">
              {options.decorations.map(decoration => (
                <button
                  key={decoration.name}
                  className={`option-button ${isOptionSelected('decorations', decoration.name) ? 'selected' : ''}`}
                  onClick={() => handleSelection('decorations', decoration.name)}
                >
                  {decoration.name}
                  <span className="price-tag">+£{decoration.price}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="cake-price-summary">
          <h3>Total Price: £{calculatePrice()}</h3>
        </div>

        <CakePreview3D selections={selections} />

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
