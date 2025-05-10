import React from 'react';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const LargeCakesCollection = () => {
  return (
    <div className="cupcake-collection-container">
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/LargeCakes.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Large Cakes</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Large Cakes</span>
      </div>
      <div className="cupcake-description">
        Our Large Cakes are perfect for celebrations and special occasions. Choose from a variety of flavours and designs.
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          <div className="cupcake-flavour-card">
            <img src="/images/range/large-cake-1.jpg" alt="Chocolate Celebration" className="cupcake-flavour-img" />
            <div className="cupcake-flavour-info">
              <h3>Chocolate Celebration</h3>
              <p>Rich chocolate sponge with chocolate buttercream.</p>
              <span className="cupcake-flavour-price">From £35</span>
            </div>
          </div>
          <div className="cupcake-flavour-card">
            <img src="/images/range/large-cake-2.jpg" alt="Lemon Drizzle" className="cupcake-flavour-img" />
            <div className="cupcake-flavour-info">
              <h3>Lemon Drizzle</h3>
              <p>Light lemon sponge with zesty lemon icing.</p>
              <span className="cupcake-flavour-price">From £32</span>
            </div>
          </div>
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          <div className="cupcake-standard-card">
            <img src="/images/range/large-cake-3.jpg" alt="Classic Victoria" className="cupcake-standard-img" />
            <div className="cupcake-standard-info">
              <h3>Classic Victoria</h3>
              <span className="cupcake-standard-price">From £30</span>
            </div>
          </div>
          <div className="cupcake-standard-card">
            <img src="/images/range/large-cake-4.jpg" alt="Carrot Cake" className="cupcake-standard-img" />
            <div className="cupcake-standard-info">
              <h3>Carrot Cake</h3>
              <span className="cupcake-standard-price">From £32</span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default LargeCakesCollection; 