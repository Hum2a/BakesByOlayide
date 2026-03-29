import React, { useState, useEffect } from 'react';
import Footer from '../common/Footer';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaUser } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { auth } from '../../firebase/firebase';
import AuthModal from '../modals/AuthModal';
import ProfileDropdown from '../widgets/ProfileDropdown';
import ProfileModal from '../modals/ProfileModal';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import CartModal from '../modals/CartModal';
import SearchModal from '../modals/SearchModal';
import PageTitle from '../common/PageTitle';
import '../styles/CakePage.css';
import '../styles/FAQ.css';

const FAQ = () => {
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
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
    <div className="faq-container">
      <PageTitle title="FAQs" />
      <div className="faq-root">
        <header className="cakepage-hero">
          <nav className="cakepage-hero-nav">
            <img
              src="/logos/LogoYellowTransparent.png"
              alt="Bakes by Olayide Logo"
              className="cakepage-hero-logo"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')}
            />
            <div className="cakepage-nav-links">
              <a href="/collections">Our Range</a>
              <a href="/guides">Guides</a>
              <a href="/about">Our Story</a>
              <a href="/contact">Contact Us</a>
            </div>
            <div className="cakepage-nav-icons">
              <button type="button" className="cakepage-nav-button" onClick={() => handleModalOpen('search')} aria-label="Search">
                <FaSearch />
              </button>
              {user ? (
                <button type="button" className="cakepage-nav-button" onClick={handleProfileClick} aria-label="Account">
                  <FaUser />
                </button>
              ) : (
                <button type="button" className="cakepage-nav-button" onClick={handleAuthClick} aria-label="Login">
                  <FaUser />
                </button>
              )}
              <button type="button" className="cakepage-cart-button" onClick={() => handleModalOpen('cart')} aria-label="View Cart">
                <FaShoppingCart />
                <span className="mobile-store-cart-label">Bag</span>
                {totalItems > 0 && <span className={`cart-count${totalItems ? ' cart-count-animate' : ''}`}>{totalItems}</span>}
              </button>
            </div>
          </nav>
          <div className="cakepage-hero-bgimg-wrap">
            <img src="/images/faq/faq-hero.png" alt="" className="cakepage-hero-bgimg" />
            <h1 className="cakepage-hero-title">FAQs</h1>
          </div>
        </header>
        <main className="faq-main">
          <div className="faq-content">
            <div className="faq-text">
              <section className="faq-block" aria-labelledby="faq-q1">
                <h2 id="faq-q1" className="faq-question">
                  How far in advance should I make my order?
                </h2>
                <p>The shortest notice we accept for all items on this website is 4 days.</p>
                <p>
                  Enquiry only orders (larger than order maximums, multi-tiers or number/letter cakes)
                  require a minimum notice of 2 weeks. Exceptions to this rule can be made on a case
                  by case basis.
                </p>
                <p>
                  Orders related to weddings with consultations require a minimum of 6 weeks&apos;
                  notice. This includes sampling and consultation, alongside finalising designs and
                  delivery of said cake.
                </p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q2">
                <h2 id="faq-q2" className="faq-question">
                  Do orders require deposits?
                </h2>
                <p>
                  For orders made directly through the website, no deposit is required. The full
                  amount is paid in full upon order.
                </p>
                <p>
                  For orders made via enquiry (larger than order maximums, unconventional cake orders
                  or multi-tiers), a 50% non-refundable deposit is due within 2 days of the order.
                  This is required to confirm your order.
                </p>
                <p>
                  Once your deposit is paid via invoice, we&apos;ll process your order. We&apos;ll
                  send you pictures before your pick-up day to allow for any cosmetic changes. When
                  you&apos;re happy with everything, you&apos;ll pay the second half of your payment
                  via invoice or via card terminal before receiving your order.
                </p>
                <p>
                  Orders will not be accessible to you until the entire payment has been processed
                  and received.
                </p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q3">
                <h2 id="faq-q3" className="faq-question">
                  What payment methods do you accept?
                </h2>
                <p>We currently accept card, contactless and PayPal.</p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q4">
                <h2 id="faq-q4" className="faq-question">
                  Do you deliver?
                </h2>
                <p>
                  Currently we do not offer delivery outside of postal products or weddings.
                  We&apos;re working on expanding to deliver to all.
                </p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q5">
                <h2 id="faq-q5" className="faq-question">
                  When can I collect my order?
                </h2>
                <p>
                  When you commission your bakes, you will be given the option to schedule a pick-up
                  time within our regular open hours. Within 24 hours before your planned pick-up
                  time, you&apos;ll be sent our address. If you opt out of choosing a schedule time,
                  you will be contacted when your order is ready. You will also be sent our address.
                </p>
                <p>
                  Our bakery is currently located in a house with step only access. If you need
                  assistance in loading your car with your order, we&apos;re happy to help.
                </p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q6">
                <h2 id="faq-q6" className="faq-question">
                  How should I collect and store large cakes?
                </h2>
                <p>
                  When you pick up your cakes and bakes, it&apos;s highly recommended that you avoid
                  stacking boxes on top of each other. Hold your large cake from the base and avoid
                  picking it up with the edges. This is to minimize potential damage to your order.
                  You should avoid using the heating in the car during colder months. Ensure you
                  air-condition your car when the weather is warmer.
                </p>
                <p>
                  When you arrive home or at your venue, store the cake in a fridge or a cool, dry
                  place. If the cake has whipped cream, you must store it in the fridge. When
                  you&apos;re ready to eat, leave the cake in a cool, dry environment for at least
                  30 minutes before serving.
                </p>
                <p>
                  To preserve the texture of the cake for longer, when you put the cake away, use
                  clingfilm to cover the exposed edge of the cake and reuse the provided packaging if
                  possible. If the box is too tall for your fridge, wrap the cake in entirety before
                  placing in the fridge.
                </p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q7">
                <h2 id="faq-q7" className="faq-question">
                  Do you make fondant or 3D cakes?
                </h2>
                <p>
                  Bakes by Olayide is a fondant free zone- our founder isn&apos;t a fan of it.
                  We don&apos;t make realistic cakes either. There are many great bakers and cake
                  artists who do though!
                </p>
              </section>

              <section className="faq-block" aria-labelledby="faq-q8">
                <h2 id="faq-q8" className="faq-question">
                  Where can I find information on allergens?
                </h2>
                <p>
                  You can find information on our handling of allergens{' '}
                  <a href="/guides/dietary-requirements" className="faq-link">
                    here
                  </a>
                  . We also have a table of all allergens in our recipes{' '}
                  <a href="/allergens" className="faq-link">
                    here
                  </a>
                  .
                </p>
              </section>
            </div>
          </div>
        </main>
        <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
        <ProfileDropdown
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          onModalOpen={handleModalOpen}
        />
        {activeModal === 'profile' && (
          <ProfileModal isOpen onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'orders' && (
          <OrderHistoryModal isOpen onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'cart' && (
          <CartModal isOpen onClose={() => setActiveModal(null)} />
        )}
        {activeModal === 'search' && (
          <SearchModal isOpen onClose={() => setActiveModal(null)} />
        )}
        <Footer />
      </div>
    </div>
  );
};

export default FAQ;
