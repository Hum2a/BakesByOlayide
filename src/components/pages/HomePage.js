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
import Footer from '../common/Footer';
import Header from '../common/Header';

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
      <Header 
        user={user}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        handleMobileMenuClick={handleMobileMenuClick}
        handleProfileClick={handleProfileClick}
        handleAuthClick={handleAuthClick}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsAuthOpen={setIsAuthOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleModalOpen={handleModalOpen}
      />

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

      <section className="homepage-guides">
        <h2 className="guides-title">Guides</h2>
        <div className="guides-grid">
          <div className="guide-card">
            <img src="/images/dandelion.png" alt="Dietary Requirements" />
            <h3>Have Any Dietary Requirements?</h3>
            <p>Over 20% of us in the UK have an allergy of some kind. See what we can do for you.</p>
            <a href="/guides/dietary" className="guide-read-btn">Read More</a>
          </div>
          <div className="guide-card">
            <img src="/images/picnic.png" alt="Special Occasion" />
            <h3>Planning a Special Occasion?</h3>
            <p>There's no better way to finish a large event than to end it with something sweet.</p>
            <a href="/guides/occasions" className="guide-read-btn">Read More</a>
          </div>
        </div>
        <div className="guide-banner">
          <img src="/images/fruit-cake.png" alt="Cake Banner" className="guide-banner-bg" />
          <div className="guide-banner-content">
            <h3>Cake is an all-year thing.</h3>
            <p>Don't make it a one-time affair. Sign up to receive exclusive offers and occasion reminders.</p>
            <form className="guide-signup-form">
              <input type="email" placeholder="Email" required />
              <button type="submit">Sign Up</button>
            </form>
          </div>
        </div>
      </section>

      {/* <CakeBuilder onRequestCake={() => setIsContactOpen(true)} /> */}

      <Footer />

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