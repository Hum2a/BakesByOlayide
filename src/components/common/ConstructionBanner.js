import React from 'react';
import '../styles/ConstructionBanner.css';

const ConstructionBanner = () => {
  return (
    <div className="construction-overlay">
      <div className="construction-content">
        <div className="construction-icon">🚧</div>
        <h1 className="construction-title">Site Under Construction</h1>
        <p className="construction-message">
          We're working hard to bring you something amazing. Please check back soon!
        </p>
      </div>
    </div>
  );
};

export default ConstructionBanner;
