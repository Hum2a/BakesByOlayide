import React from 'react';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const CookiesCollection = () => {
  return (
    <div className="cupcake-collection-container">
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/cookies.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Cookies</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Cookies</span>
      </div>
      <div className="cupcake-description">
        Our cookies are baked fresh daily and come in a variety of flavours. Perfect for snacking or sharing!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          <div className="cupcake-flavour-card">
            <img src="/images/range/cookie-1.jpg" alt="Chocolate Chip" className="cupcake-flavour-img" />
            <div className="cupcake-flavour-info">
              <h3>Chocolate Chip</h3>
              <p>Classic chewy cookies loaded with chocolate chips.</p>
              <span className="cupcake-flavour-price">From £8</span>
            </div>
          </div>
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          <div className="cupcake-standard-card">
            <img src="/images/range/cookie-2.jpg" alt="Oatmeal Raisin" className="cupcake-standard-img" />
            <div className="cupcake-standard-info">
              <h3>Oatmeal Raisin</h3>
              <span className="cupcake-standard-price">From £8</span>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default CookiesCollection; 