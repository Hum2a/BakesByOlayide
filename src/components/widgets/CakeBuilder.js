import React from 'react';
import '../styles/CakeBuilder.css';

const CakeBuilder = ({ onRequestCake }) => {
  return (
    <section className="homepage-design-cake">
      <div className="design-cake-container">
        <h2>Design Your Dream Cake</h2>
        <p>Create your perfect cake with our easy customization options</p>
        
        <div className="design-options">
          <div className="design-option-group">
            <h3>Size</h3>
            <div className="option-buttons">
              <button className="option-button">6" (8-10 servings)</button>
              <button className="option-button">8" (12-15 servings)</button>
              <button className="option-button">10" (20-25 servings)</button>
              <button className="option-button">Custom Size</button>
            </div>
          </div>

          <div className="design-option-group">
            <h3>Cake Flavor</h3>
            <div className="option-buttons">
              <button className="option-button">Vanilla</button>
              <button className="option-button">Chocolate</button>
              <button className="option-button">Red Velvet</button>
              <button className="option-button">Marble</button>
              <button className="option-button">Carrot</button>
            </div>
          </div>

          <div className="design-option-group">
            <h3>Frosting</h3>
            <div className="option-buttons">
              <button className="option-button">Buttercream</button>
              <button className="option-button">Cream Cheese</button>
              <button className="option-button">Chocolate Ganache</button>
              <button className="option-button">Fondant</button>
            </div>
          </div>

          <div className="design-option-group">
            <h3>Decorations</h3>
            <div className="option-buttons">
              <button className="option-button">Fresh Flowers</button>
              <button className="option-button">Fresh Fruit</button>
              <button className="option-button">Sprinkles</button>
              <button className="option-button">Custom Design</button>
            </div>
          </div>
        </div>

        <button 
          className="design-submit-button"
          onClick={onRequestCake}
        >
          Request Your Custom Cake
        </button>
      </div>
    </section>
  );
};

export default CakeBuilder;
