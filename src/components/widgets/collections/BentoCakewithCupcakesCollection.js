import React from 'react';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const BentoCakewithCupcakesCollection = () => {
  return (
    <div className="cupcake-collection-container">
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/BentoCake.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Bento Cake with Cupcakes</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Bento Cake with Cupcakes</span>
      </div>
      <div className="cupcake-description">
        Our Bento Cakes with Cupcakes are a delightful combination for sharing and gifting. Choose your favourite flavours!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          <div className="cupcake-flavour-card">
            <img src="/images/range/bento-cake-1.jpg" alt="Strawberry Bento" className="cupcake-flavour-img" />
            <div className="cupcake-flavour-info">
              <h3>Strawberry Bento</h3>
              <p>Fresh strawberry cake with vanilla buttercream.</p>
              <span className="cupcake-flavour-price">From £18</span>
            </div>
          </div>
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          <div className="cupcake-standard-card">
            <img src="/images/range/bento-cake-2.jpg" alt="Chocolate Bento" className="cupcake-standard-img" />
            <div className="cupcake-standard-info">
              <h3>Chocolate Bento</h3>
              <span className="cupcake-standard-price">From £18</span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BentoCakewithCupcakesCollection; 