import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';
import About from '../modals/about';
import Contact from '../modals/contact';
import AuthModal from '../modals/AuthModal';
import ProfileDropdown from '../widgets/ProfileDropdown';
import CakeBuilder from '../widgets/CakeBuilder';
import SignatureCreations from '../widgets/SignatureCreations';
import { FaBars, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter, FaUser } from 'react-icons/fa';
import { auth } from '../../firebase/firebase';

const HomePage = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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

  return (
    <div className="homepage-container">
      <header className={`homepage-header ${isScrolled ? 'scrolled' : ''}`}>
        <nav className="homepage-nav">
          <div className="homepage-logo">
            <h1>BakesByOlayide</h1>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={handleMobileMenuClick}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <ul className={`homepage-nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li><a href="/" className="active">Home</a></li>
            <li><a href="/cakes">Cakes</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setIsAboutOpen(true); }}>About</a></li>
            <li><a href="#" onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }}>Contact</a></li>
            <li className="auth-nav-item">
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
            </li>
          </ul>
        </nav>
      </header>

      <section className="homepage-hero">
        <div className="homepage-hero-content">
          <h2>Artisanal Celebration Cakes</h2>
          <p>Experience the magic of handcrafted cakes, where every creation tells your unique story</p>
          <a href="/cakes" className="homepage-cta-button">Explore Our Cakes</a>
        </div>
      </section>

      <SignatureCreations />

      <section className="homepage-about-preview">
        <div className="homepage-about-content">
          <h2>Our Story</h2>
          <p>BakesByOlayide began as a passion for creating memorable celebrations through exquisite cakes. Each creation is crafted with love, skill, and attention to detail, making your special moments even more extraordinary.</p>
          <button 
            className="homepage-learn-more"
            onClick={() => setIsAboutOpen(true)}
          >
            Learn More
          </button>
        </div>
      </section>

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
      <ProfileDropdown isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
};

export default HomePage; 