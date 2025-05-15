import React, { useState, useEffect } from 'react';
import '../styles/GuidesPage.css';
import Footer from '../common/Footer';
import Guides from '../widgets/Guides';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaUser } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { auth } from '../../firebase/firebase';
import AuthModal from '../modals/AuthModal';
import ProfileDropdown from '../widgets/ProfileDropdown';
import ProfileModal from '../modals/ProfileModal';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import SettingsModal from '../modals/SettingsModal';
import CartModal from '../modals/CartModal';
import SearchModal from '../modals/SearchModal';

const GuidesPage = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleProfileClick = (e) => {
    e.preventDefault();
    setIsProfileOpen(!isProfileOpen);
  };

  const handleAuthClick = (e) => {
    e.preventDefault();
    setIsAuthOpen(true);
  };

  const handleModalOpen = (modal) => {
    setActiveModal(modal);
    setIsProfileOpen(false);
  };

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
          <button className="cakepage-nav-button" onClick={() => handleModalOpen('search')} aria-label="Search">
            <FaSearch />
          </button>
          {user ? (
            <button className="cakepage-nav-button" onClick={handleProfileClick} aria-label="Account">
              <FaUser />
            </button>
          ) : (
            <button className="cakepage-nav-button" onClick={handleAuthClick} aria-label="Login">
              <FaUser />
            </button>
          )}
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

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
      <ProfileDropdown 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        onModalOpen={handleModalOpen}
      />
      
      {activeModal === 'profile' && (
        <ProfileModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'orders' && (
        <OrderHistoryModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'cart' && (
        <CartModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'settings' && (
        <SettingsModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}
      {activeModal === 'search' && (
        <SearchModal isOpen={true} onClose={() => setActiveModal(null)} />
      )}

      <Footer />
    </div>
  );
};

export default GuidesPage;
