import React, { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import PageTitle from '../../common/PageTitle';
import '../../styles/DietaryRequirements.css';

const DietaryRequirements = () => {
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
    <div className="DietaryRequirements-outer-container">
      <PageTitle title="Dietary Requirements" />
      <div className="DietaryRequirements-header-wrap">
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
      <div className="DietaryRequirements-main-wrap">
        <main className="DietaryRequirements-main">
          <h1 className="DietaryRequirements-title">Have any dietary Requirements?</h1>
          <p className="DietaryRequirements-subtitle">
            Having allergies can be deeply frustrating for many. Here at Bakes by Olayide, we want everyone to be able to enjoy cakes and bakes together.
          </p>
          <div className="DietaryRequirements-main-image-wrap">
            <img src="/images/about/big.png" alt="Dietary Requirements" className="DietaryRequirements-main-image" />
          </div>
          <section className="DietaryRequirements-content">
            <p>To facilitate this, we have vegan (animal derived product free- no eggs or dairy) and gluten free alternatives of many mainline products available. For large cakes and custom orders, we are able to make more accommodations if you need.</p>
            <p>We'd like you to know that in our bakery we handle:</p>
            <ul>
              <li>Almonds</li>
              <li>Cereals containing gluten</li>
              <li>Eggs</li>
              <li>Milk</li>
              <li>Soya</li>
            </ul>
            <p>
              Almond and soya are used within our vegan range (as milk substitutes). These can be substituted with oat or hemp milk in custom orders. Coconut flour is our flour substitute for our gluten free range as the flavour is subtle and gives gluten free cakes a more similar texture (and taste) to wheat flour cakes. This can also be substituted in custom orders.
            </p>
            <p>
              Most of our ingredients are stored separately from our allergen sensitive ingredients. However, the wheat flour used in our standard range is stored with all sugars (aside from powdered), cocoa powder and pigments. Whilst we try to avoid contamination as much as possible, please keep in mind that it can and may occur.
            </p>
            <p>
            The same equipment is used for standard, gluten free and vegan cakes. They are machine and hand washed but mixers, bowls, spoons and other apparatus used in the baking process are not specific to dietary requirements. This means if at one point a spatula were used for a set of standard vanilla cupcakes, in the future (after washes) it may be used for gluten free cakes.
            </p>
            <p>
              When contacting us for your custom order, please be sure to clearly explain what allergens you need us to cater for. While we try our best to cater for every allergy, we are not able to cater for those who have airborne allergies to milk, gluten/wheat or eggs. This is because these ingredients are frequently used in our bakery and could potentially trigger a reaction.
            </p>
            <p>
              If you have any questions regarding how allergens are handled, please send an inquiry <a href="/contact">here</a>. Check out our table of specific allergens by recipe <a href="/allergens">here</a>.
            </p>
          </section>
          <section className="DietaryRequirements-related-guides">
            <h2>Related Guides</h2>
            <div className="DietaryRequirements-guides-grid">
              <div className="DietaryRequirements-guide-card">
                <img src="/images/about/Cherry.png" alt="Planning a Special Occasion?" />
                <h3>Planning for a Special Occasion?</h3>
              </div>
              <div className="DietaryRequirements-guide-card">
                <img src="/images/about/scones.png" alt="What cake is right for you?" />
                <h3>What cake is right for you?</h3>
              </div>
              <div className="DietaryRequirements-guide-card">
                <img src="/images/about/yorkshires.png" alt="How to care for your bakes" />
                <h3>How to care for your bakes</h3>
              </div>
            </div>
          </section>
        </main>
      </div>
      <div className="DietaryRequirements-footer-wrap">
        <Footer />
      </div>
    </div>
  );
};

export default DietaryRequirements;
