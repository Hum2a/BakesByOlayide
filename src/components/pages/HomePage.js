import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';
import About from '../modals/about';
import Contact from '../modals/contact';
import CakeBuilder from '../widgets/CakeBuilder';
import SignatureCreations from '../widgets/SignatureCreations';
import { FaBars, FaTimes, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaInstagram, FaTwitter } from 'react-icons/fa';

const HomePage = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleNavLinkClick = (action) => {
    setIsMobileMenuOpen(false);
    action();
  };

  return (
    <div className="homepage-container">
      <header className={`homepage-header ${isScrolled ? 'scrolled' : ''}`}>
        <nav className="homepage-nav">
          <div className="homepage-logo">
            <h1>Sweet Delights</h1>
          </div>
          <button 
            className="mobile-menu-toggle"
            onClick={handleMobileMenuClick}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
          <ul className={`homepage-nav-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            <li>
              <a 
                href="/" 
                className="active"
                onClick={() => handleNavLinkClick(() => {})}
              >
                Home
              </a>
            </li>
            <li>
              <a 
                href="/cakes"
                onClick={() => handleNavLinkClick(() => {})}
              >
                Cakes
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavLinkClick(() => setIsAboutOpen(true));
                }}
              >
                About
              </a>
            </li>
            <li>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavLinkClick(() => setIsContactOpen(true));
                }}
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main className="homepage-main">
        <section className="homepage-hero">
          <div className="homepage-hero-content">
            <h2>Handcrafted Cakes for Every Occasion</h2>
            <p>Indulge in our delicious, freshly baked creations made with love and the finest ingredients</p>
            <a href="/cakes" className="homepage-cta-button">View Our Cakes</a>
          </div>
        </section>

        <SignatureCreations />

        <section className="homepage-about-preview">
          <div className="homepage-about-content">
            <h2>Our Story</h2>
            <p>Founded in 2010, Sweet Delights Bakery has been creating memorable moments through our delicious cakes and pastries. Our team of expert bakers combines traditional techniques with modern creativity to bring you the perfect treat for any occasion.</p>
            <button 
              className="homepage-learn-more"
              onClick={() => setIsAboutOpen(true)}
            >
              Learn More
            </button>
          </div>
        </section>

        <CakeBuilder onRequestCake={() => setIsContactOpen(true)} />
      </main>

      <footer className="homepage-footer">
        <div className="homepage-footer-content">
          <div className="homepage-footer-section">
            <h3>Contact Us</h3>
            <p><FaPhone /> (123) 456-7890</p>
            <p><FaEnvelope /> info@sweetdelights.com</p>
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
          <p>&copy; 2024 Sweet Delights Bakery. All rights reserved.</p>
        </div>
      </footer>

      <About isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <Contact isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </div>
  );
};

export default HomePage; 