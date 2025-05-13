import React from 'react';
import '../styles/GuidesPage.css';
import Footer from '../common/Footer';
import Guides from '../widgets/Guides';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';

const GuidesPage = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();

  return (
    <div className="guides-page-container">
      {/* CakePage-style Header */}
      <header className="cakepage-hero">
        <img 
          src="/logos/LogoYellowTransparent.png" 
          alt="Bakes by Olayide Logo" 
          className="cakepage-hero-logo" 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')} 
        />
        <nav className="cakepage-hero-nav">
          <a href="/cakes">Our Range</a>
          <a href="/guides">Guides</a>
          <a href="/about">Our Story</a>
          <a href="/contact">Contact Us</a>
          <button className="cakepage-cart-button" onClick={() => navigate('/cart')} aria-label="View Cart">
            <FaShoppingCart />
            {totalItems > 0 && <span className={`cart-count${totalItems ? ' cart-count-animate' : ''}`}>{totalItems}</span>}
          </button>
        </nav>
        <div className="cakepage-hero-bgimg-wrap">
          <img src="/images/guide/GuideHeroImage.jpg" alt="Guides" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Guides</h1>
        </div>
      </header>

      <main className="guides-page-content">
        <Guides />
      </main>

      <Footer />
    </div>
  );
};

export default GuidesPage;
