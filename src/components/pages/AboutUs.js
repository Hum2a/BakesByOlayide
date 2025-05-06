import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import '../styles/AboutUs.css';

const AboutUs = () => {
  // Dummy state for header logic (replace with actual logic if needed)
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // Dummy handlers (replace with actual logic if needed)
  const handleMobileMenuClick = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const handleProfileClick = () => setIsProfileOpen(!isProfileOpen);
  const handleAuthClick = () => setIsAuthOpen(true);
  const handleModalOpen = (modal) => setActiveModal(modal);

  return (
    <div className="aboutus-outer-container">
      <div className="aboutus-header-wrap">
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
      </div>
      <div className="aboutus-main-wrap">
        <main className="aboutus-main">
          <h1 className="aboutus-title">Have any dietary Requirements?</h1>
          <p className="aboutus-subtitle">
            Having allergies can be deeply frustrating for many. Here at Bakes by Olayide, we want everyone to be able to enjoy cakes and bakes together.
          </p>
          <div className="aboutus-main-image-wrap">
            <img src="/images/about/big.png" alt="Dietary Requirements" className="aboutus-main-image" />
          </div>
          <section className="aboutus-content">
            <p>To facilitate this, we have some typical default product lines: sugar- or dairy (and gluten)-free alternatives of many recipes are available. For large and custom orders or events, we are able to make more accommodations if you need.</p>
            <ul>
              <li>Milk alternatives</li>
              <li>Gluten-free</li>
              <li>Allergens considered (gluten/nuts/soy)</li>
              <li>Soy</li>
            </ul>
            <p>
              (Above) and any custom order are vegan except for eggs (which substitute). (These can be substituted with our large adult cakes, or for smaller children's treats just note this when you order). This page can be referenced for custom orders, or for more information before your next party or celebration. This can also be referenced for smaller orders.
            </p>
            <p>
              We are also mindful of cross-contact and separate trays for catering specific requirements. However, the wider context of the kitchen means that we cannot guarantee 100% freedom from all allergens, but every attempt is made. Please refer to any issued documentation and speak to us directly, especially if you have a nut and sesame allergy.
            </p>
            <p>
              If you have any questions regarding how allergens are handled, please send us a lengthy letter.
            </p>
          </section>
          <section className="aboutus-related-guides">
            <h2>Related Guides</h2>
            <div className="aboutus-guides-grid">
              <div className="aboutus-guide-card">
                <img src="/images/about/Cherry.png" alt="Planning a Special Occasion?" />
                <h3>Planning for a Special Occasion?</h3>
              </div>
              <div className="aboutus-guide-card">
                <img src="/images/about/scones.png" alt="What cake is right for you?" />
                <h3>What cake is right for you?</h3>
              </div>
              <div className="aboutus-guide-card">
                <img src="/images/about/yorkshires.png" alt="How to care for your bakes" />
                <h3>How to care for your bakes</h3>
              </div>
            </div>
          </section>
        </main>
      </div>
      <div className="aboutus-footer-wrap">
        <Footer />
      </div>
    </div>
  );
};

export default AboutUs;
