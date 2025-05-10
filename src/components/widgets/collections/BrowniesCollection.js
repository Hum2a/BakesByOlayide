import React from 'react';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const BrowniesCollection = () => {
  return (
    <div className="cupcake-collection-container">
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/Brownies.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Brownies</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Brownies</span>
      </div>
      <div className="cupcake-description">
        Our brownies are rich, fudgy, and perfect for any chocolate lover. Try our classic and seasonal flavours!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          <div className="cupcake-flavour-card">
            <img src="/images/range/brownie-1.jpg" alt="Classic Fudge" className="cupcake-flavour-img" />
            <div className="cupcake-flavour-info">
              <h3>Classic Fudge</h3>
              <p>Deep chocolate fudge brownies with a gooey centre.</p>
              <span className="cupcake-flavour-price">From £10</span>
            </div>
          </div>
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          <div className="cupcake-standard-card">
            <img src="/images/range/brownie-2.jpg" alt="Walnut Brownie" className="cupcake-standard-img" />
            <div className="cupcake-standard-info">
              <h3>Walnut Brownie</h3>
              <span className="cupcake-standard-price">From £12</span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BrowniesCollection; 