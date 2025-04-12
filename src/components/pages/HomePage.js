import React, { useState, useEffect } from 'react';
import '../styles/HomePage.css';
import About from '../modals/about';
import Contact from '../modals/contact';
import CakeBuilder from '../widgets/CakeBuilder';
import SignatureCreations from '../widgets/SignatureCreations';

const HomePage = () => {
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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

  return (
    <div className="homepage-container">
      <header className={`homepage-header ${isScrolled ? 'scrolled' : ''}`}>
        <nav className="homepage-nav">
          <div className="homepage-logo">
            <h1>Sweet Delights</h1>
          </div>
          <ul className="homepage-nav-links">
            <li><a href="/" className="active">Home</a></li>
            <li><a href="/cakes">Cakes</a></li>
            <li><a href="#" onClick={(e) => {
              e.preventDefault();
              setIsAboutOpen(true);
            }}>About</a></li>
            <li><a href="#" onClick={(e) => {
              e.preventDefault();
              setIsContactOpen(true);
            }}>Contact</a></li>
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
            <p><i className="fas fa-phone"></i> (123) 456-7890</p>
            <p><i className="fas fa-envelope"></i> info@sweetdelights.com</p>
            <p><i className="fas fa-map-marker-alt"></i> 123 Bakery Street, Sweet City</p>
          </div>
          <div className="homepage-footer-section">
            <h3>Follow Us</h3>
            <div className="homepage-social-links">
              <a href="#"><i className="fab fa-facebook"></i></a>
              <a href="#"><i className="fab fa-instagram"></i></a>
              <a href="#"><i className="fab fa-twitter"></i></a>
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