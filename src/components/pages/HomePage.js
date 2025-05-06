import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';
import About from '../modals/about';
import Contact from '../modals/contact';
import AuthModal from '../modals/AuthModal';
import ProfileDropdown from '../widgets/ProfileDropdown';
import ProfileModal from '../modals/ProfileModal';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import SettingsModal from '../modals/SettingsModal';
import CartModal from '../modals/CartModal';
import CakeBuilder from '../widgets/CakeBuilder';
import SignatureCreations from '../widgets/SignatureCreations';
import { FaBars, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaUser } from 'react-icons/fa';
import { auth } from '../../firebase/firebase';

const HomePage = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    setIsProfileOpen(!isProfileOpen);
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = (e) => {
    e.preventDefault();
    setIsAuthOpen(true);
    setIsMobileMenuOpen(false);
  };

  const handleModalOpen = (modal) => {
    setActiveModal(modal);
    setIsProfileOpen(false);
  };

  return (
    <div className="homepage-container">
      <header className={`homepage-header ${isScrolled ? 'scrolled' : ''}`} style={{ background: '#000' }}>
        <nav className="homepage-nav">
          <div className="homepage-logo">
            <img src="/logos/LogoYellowLayeredTransparent.png" alt="BakesByOlayide Logo" className="homepage-logo-image" />
          </div>
          <ul className="homepage-nav-links main-nav-links">
            <li><a href="/cakes" className="nav-link">Our Range</a></li>
            <li><a href="/guides" className="nav-link">Guides</a></li>
            <li><a href="/about" className="nav-link">About Us</a></li>
            <li><a href="/contact" className="nav-link">Contact Us</a></li>
          </ul>
          <div className="homepage-nav-icons">
            {user ? (
              <button 
                className="auth-nav-button profile-button"
                onClick={handleProfileClick}
              >
                {user.photoURL ? (
                  <img src={user.photoURL} alt="Profile" className="profile-image" />
                ) : (
                  <FaUser />
                )}
              </button>
            ) : (
              <button 
                className="auth-nav-button"
                onClick={handleAuthClick}
              >
                <FaUser /> Account
              </button>
            )}
            <a href="/cart" className="nav-icon-link" aria-label="Cart">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </a>
          </div>
        </nav>
      </header>

      <section className="homepage-hero">
        <div className="homepage-hero-content">
          <h2>Cakes and Bakes for Every Occasion</h2>
          <a href="/cakes" className="homepage-cta-button">Browse</a>
        </div>
      </section>

      <SignatureCreations />

      <div className="homepage-hero-image">
        <img src="/images/HeroImage2.png" alt="Hero" />
      </div>

      <CakeBuilder onRequestCake={() => setIsContactOpen(true)} />

      <footer className="homepage-footer">
        <div className="homepage-footer-content">
          <div className="homepage-footer-section">
            <h3>Contact Us</h3>
            <p><FaPhone /> (123) 456-7890</p>
            <p><FaEnvelope /> info@bakesbyolayide.com</p>
            <p><FaMapMarkerAlt /> 123 Bakery Street, Sweet City</p>
          </div>
          <div className="homepage-footer-section">
            <h3>Follow Us</h3>
            <div className="homepage-social-links">
              <a href="#" aria-label="Facebook"><FaFacebook /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
            </div>
          </div>
        </div>
        <div className="homepage-footer-bottom">
          <p>&copy; {new Date().getFullYear()} BakesByOlayide. All rights reserved.</p>
        </div>
      </footer>

      <About isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <Contact isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
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
    </div>
  );
};

export default HomePage; 