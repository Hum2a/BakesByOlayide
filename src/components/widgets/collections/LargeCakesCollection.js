import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
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
import { auth } from '../../../firebase/firebase';
import PageTitle from '../../common/PageTitle';
import CakeModal from '../../modals/CakeModal';

const LargeCakesCollection = () => {
  const [largeCakes, setLargeCakes] = useState([]);
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
    fetchLargeCakes();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    // Optionally, update totalItems from your cart context/localStorage here
    return () => unsubscribe();
  }, []);

  const fetchLargeCakes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Large Cakes'));
      const querySnapshot = await getDocs(q);
      
      const largeCakesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate seasonal and standard large cakes
      const seasonalLargeCakes = largeCakesData.filter(largeCake => largeCake.isSeasonal);
      const standardLargeCakes = largeCakesData.filter(largeCake => !largeCake.isSeasonal);

      setLargeCakes({
        seasonal: seasonalLargeCakes,
        standard: standardLargeCakes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching large cakes:', error);
      setError('Failed to load large cakes. Please try again later.');
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

  const columns = 4; // Match your grid-template-columns
  const standardCakes = largeCakes.standard || [];
  const remainder = standardCakes.length % columns;
  const paddedCakes = remainder === 0
    ? standardCakes
    : [...standardCakes, ...Array(columns - remainder).fill({ empty: true, id: `empty-${remainder}` })];

  return (
    <div className="cupcake-collection-container">
      <PageTitle title="Large Cakes" />
      {/* CakePage-style Hero Header */}
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
          <img src="/images/range/LargeCakes.webp" alt="Large Cakes" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Large Cakes</h1>
        </div>
      </header>
      {/* End CakePage-style Hero Header */}
      <div className="cupcake-breadcrumbs">
        <a href="/collections" className="cupcake-breadcrumb-link">Collections</a> / <span className="cupcake-breadcrumb">Large Cakes</span>
      </div>
      <div className="cupcake-description">
      Large celebration cakes are handled a little differently here at Bakes by Olayide. Rather than providing you with pre-set cake designs, we instead encourage you to design a cake or send us your inspirations so we can make it for you. Our cakes are listed by flavour. If you'd like any flavours that aren't listed below, contact us here.
      </div>
      <section className="cupcake-section cupcake-seasonal-section">
        <h2>Featured Flavours</h2>
        {largeCakes.seasonal && largeCakes.seasonal.length > 0 && (
          <div className="seasonal-flavours-scroll">
            <div className="seasonal-flavours-flex">
              <div className="seasonal-flavour-large">
                {(() => {
                  const largeCake = largeCakes.seasonal[0];
                  return (
                    <div className="cupcake-flavour-card" key={largeCake.id} onClick={() => navigate(`/collections/cakes/${largeCake.id}`)} style={{ cursor: 'pointer' }}>
                      <img src={largeCake.image} alt={largeCake.name} className="cupcake-flavour-img" />
                      <div className="cupcake-flavour-info">
                        <h3>{largeCake.name}</h3>
                        <p>{largeCake.description}</p>
                        <span className="cupcake-flavour-price">
                          From £{Math.min(...largeCake.sizes.map(size => size.price)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="seasonal-flavour-vertical">
                {largeCakes.seasonal.slice(1).map((largeCake) => (
                  <div className="cupcake-flavour-card seasonal-flavour-small" key={largeCake.id} onClick={() => navigate(`/collections/cakes/${largeCake.id}`)} style={{ cursor: 'pointer' }}>
                    <img src={largeCake.image} alt={largeCake.name} className="cupcake-flavour-img" />
                    <div className="cupcake-flavour-info">
                      <h3>{largeCake.name}</h3>
                      <p>{largeCake.description}</p>
                      <span className="cupcake-flavour-price">
                        From £{Math.min(...largeCake.sizes.map(size => size.price)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
      <section className="cupcake-section">
        <h2>Our Offerings</h2>
        <div className="cupcake-standard-grid-container">
          <div className="cupcake-standard-grid">
            {paddedCakes.map((largeCake, idx) =>
              largeCake.empty ? (
                <div className="cupcake-standard-card empty" key={largeCake.id || idx}></div>
              ) : (
                <div className="cupcake-standard-card" key={largeCake.id} onClick={() => navigate(`/collections/cakes/${largeCake.id}`)} style={{ cursor: 'pointer' }}>
                  <img src={largeCake.image} alt={largeCake.name} className="cupcake-standard-img" />
                  <div className="cupcake-standard-info">
                    <h3>{largeCake.name}</h3>
                    <p>{largeCake.description}</p>
                    <span className="cupcake-standard-price">
                      From £{Math.min(...largeCake.sizes.map(size => size.price)).toFixed(2)}
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>
      {/* Modals and overlays */}
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

export default LargeCakesCollection; 