import React from 'react';
import './CakeCard.css';

const CakeCard = ({ cake }) => {
  // Calculate minimum price from sizes array
  const minPrice = Array.isArray(cake.sizes) && cake.sizes.length > 0
    ? Math.min(...cake.sizes.map(s => s.price))
    : 0;

  return (
    <div className="cake-card">
      <div className="cake-image">
        <img src={cake.image} alt={cake.name} />
        <div className="cake-overlay">
          <span className="view-details">View Details</span>
        </div>
      </div>
      <div className="cake-info">
        <h3>{cake.name}</h3>
        <p className="cake-description">{cake.description}</p>
        <div className="cake-footer">
          <span className="cake-price">From £{minPrice.toFixed(2)}</span>
          <span className="cake-category">{cake.category}</span>
        </div>
      </div>
    </div>
  );
};

export default CakeCard; 