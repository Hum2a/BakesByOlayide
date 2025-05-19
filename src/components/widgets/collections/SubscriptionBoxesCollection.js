import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/CupcakeCollectionPage.css';
import Footer from '../../common/Footer';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaUser, FaBars, FaTimes } from 'react-icons/fa';
import AuthModal from '../../modals/AuthModal';
import ProfileDropdown from '../../widgets/ProfileDropdown';
import ProfileModal from '../../modals/ProfileModal';
import OrderHistoryModal from '../../modals/OrderHistoryModal';
import SettingsModal from '../../modals/SettingsModal';
import CartModal from '../../modals/CartModal';
import SearchModal from '../../modals/SearchModal';
import PageTitle from '../../common/PageTitle';

const SubscriptionBoxesCollection = () => {
  const [subscriptionBoxes, setSubscriptionBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptionBoxes();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchSubscriptionBoxes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Subscription Boxes'));
      const querySnapshot = await getDocs(q);
      
      const subscriptionBoxesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate seasonal and standard subscription boxes
      const seasonalSubscriptionBoxes = subscriptionBoxesData.filter(box => box.isSeasonal);
      const standardSubscriptionBoxes = subscriptionBoxesData.filter(box => !box.isSeasonal);

      setSubscriptionBoxes({
        seasonal: seasonalSubscriptionBoxes,
        standard: standardSubscriptionBoxes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription boxes:', error);
      setError('Failed to load subscription boxes. Please try again later.');
      setLoading(false);
    }
  };

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

  if (loading) {
    return <div className="cupcake-collection-container">Loading...</div>;
  }

  if (error) {
    return <div className="cupcake-collection-container">{error}</div>;
  }

  // Grid padding for standard subscription boxes
  const columns = 4;
  const standardBoxes = subscriptionBoxes.standard || [];
  const remainder = standardBoxes.length % columns;
  const paddedBoxes = remainder === 0
    ? standardBoxes
    : [...standardBoxes, ...Array(columns - remainder).fill({ empty: true, id: `empty-${remainder}` })];

  return (
    <div className="cupcake-collection-container">
      <PageTitle title="Subscription Boxes" />
      <header className="cakepage-hero">
        <nav className="cakepage-hero-nav">
          <img 
            src="/logos/LogoYellowTransparent.png" 
            alt="Bakes by Olayide Logo" 
            className="cakepage-hero-logo" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/')} 
          />
          <button
            className="cakepage-mobile-menu-toggle"
            aria-label="Open menu"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <FaBars />
          </button>
          <div className="cakepage-nav-links">
            <a href="/collections">Our Range</a>
            <a href="/guides">Guides</a>
            <a href="/about">Our Story</a>
            <a href="/contact">Contact Us</a>
          </div>
          <div className="cakepage-nav-icons">
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
            <button className="cakepage-cart-button" onClick={() => setIsCartOpen(true)} aria-label="View Cart">
              <FaShoppingCart />
              {totalItems > 0 && <span className={`cart-count${totalItems ? ' cart-count-animate' : ''}`}>{totalItems}</span>}
            </button>
          </div>
        </nav>
        {isMobileNavOpen && (
          <div className="cakepage-mobile-nav-overlay">
            <button
              className="cakepage-mobile-menu-close"
              aria-label="Close menu"
              onClick={() => setIsMobileNavOpen(false)}
            >
              <FaTimes />
            </button>
            <ul className="cakepage-mobile-nav-links">
              <li><a href="/collections" onClick={() => setIsMobileNavOpen(false)}>Our Range</a></li>
              <li><a href="/guides" onClick={() => setIsMobileNavOpen(false)}>Guides</a></li>
              <li><a href="/about" onClick={() => setIsMobileNavOpen(false)}>Our Story</a></li>
              <li><a href="/contact" onClick={() => setIsMobileNavOpen(false)}>Contact Us</a></li>
              <li>
                <button className="cakepage-cart-button" onClick={() => { setIsMobileNavOpen(false); setIsCartOpen(true); }} aria-label="View Cart">
                  <FaShoppingCart />
                </button>
              </li>
            </ul>
          </div>
        )}
        <div className="cakepage-hero-bgimg-wrap">
          <img src="/images/range/SubscriptionBoxes.png" alt="Subscription Boxes" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Subscription Boxes</h1>
        </div>
      </header>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Subscription Boxes</span>
      </div>
      <div className="cupcake-description">
        Treat yourself or someone special to a regular delivery of our delicious treats! Our subscription boxes are carefully curated with a selection of our finest products, perfect for gifting or personal indulgence. Choose from monthly, bi-weekly, or weekly deliveries.
      </div>
      <section className="cupcake-section">
        <h2>Seasonal Boxes</h2>
        <div className="cupcake-flavours-grid">
          {subscriptionBoxes.seasonal?.map((box) => (
            <div className="cupcake-flavour-card" key={box.id} onClick={() => navigate(`/collections/${box.id}`)} style={{ cursor: 'pointer' }}>
              <img src={box.image} alt={box.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{box.name}</h3>
                <p>{box.description}</p>
                <div className="subscription-details">
                  <span className="cupcake-flavour-price">
                    From £{Math.min(...box.sizes.map(size => size.price)).toFixed(2)}
                  </span>
                  {box.deliveryFrequency && (
                    <span className="delivery-frequency">
                      {box.deliveryFrequency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Year Round Boxes</h2>
        <div className="cupcake-standard-grid">
          {paddedBoxes.map((box, idx) =>
            box.empty ? (
              <div className="cupcake-standard-card empty" key={box.id || idx}></div>
            ) : (
              <div className="cupcake-standard-card" key={box.id} onClick={() => navigate(`/collections/${box.id}`)} style={{ cursor: 'pointer' }}>
                <img src={box.image} alt={box.name} className="cupcake-standard-img" />
                <div className="cupcake-standard-info">
                  <h3>{box.name}</h3>
                  <div className="subscription-details">
                    <span className="cupcake-standard-price">
                      From £{Math.min(...box.sizes.map(size => size.price)).toFixed(2)}
                    </span>
                    {box.deliveryFrequency && (
                      <span className="delivery-frequency">
                        {box.deliveryFrequency}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          )}
        </div>
      </section>
      <section className="subscription-benefits">
        <h2>Why Choose Our Subscription Boxes?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h3>Regular Treats</h3>
            <p>Never run out of your favorite treats with regular deliveries.</p>
          </div>
          <div className="benefit-item">
            <h3>Flexible Plans</h3>
            <p>Choose from weekly, bi-weekly, or monthly delivery options.</p>
          </div>
          <div className="benefit-item">
            <h3>Easy Management</h3>
            <p>Pause, skip, or cancel your subscription anytime.</p>
          </div>
          <div className="benefit-item">
            <h3>Special Offers</h3>
            <p>Exclusive discounts and early access to new products.</p>
          </div>
        </div>
      </section>
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
      {isCartOpen && (
        <CartModal isOpen={true} onClose={() => setIsCartOpen(false)} />
      )}
      <Footer />
    </div>
  );
};

export default SubscriptionBoxesCollection; 