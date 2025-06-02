import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/CupcakeCollectionPage.css';
import Footer from '../../common/Footer';
import PageTitle from '../../common/PageTitle';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaUser, FaBars, FaTimes, FaHeart, FaBirthdayCake, FaGift, FaGraduationCap, FaEgg, FaCrown, FaMoon, FaUserTie } from 'react-icons/fa';
import { useCart } from '../../../context/CartContext';
import AuthModal from '../../modals/AuthModal';
import ProfileDropdown from '../../widgets/ProfileDropdown';
import ProfileModal from '../../modals/ProfileModal';
import OrderHistoryModal from '../../modals/OrderHistoryModal';
import SettingsModal from '../../modals/SettingsModal';
import CartModal from '../../modals/CartModal';
import SearchModal from '../../modals/SearchModal';
import HolidayModal from '../../modals/HolidayModal';

const holidayCards = [
  {
    id: 'valentines',
    title: 'Valentine\'s Day',
    description: 'Share the love with a romantic bento cake and matching cupcakes',
    icon: FaHeart,
    isVisible: true,
    isComingSoon: true
  },
  {
    id: 'mothers-day',
    title: 'Mother\'s Day',
    description: 'Show your appreciation with a beautiful floral-themed set',
    icon: FaCrown,
    isVisible: true,
    isComingSoon: false
  },
  {
    id: 'fathers-day',
    title: 'Father\'s Day',
    description: 'Celebrate with elegant blue and white themed treats',
    icon: FaUserTie,
    isVisible: true,
    isComingSoon: false
  },
  {
    id: 'easter',
    title: 'Easter',
    description: 'Celebrate spring with pastel-colored treats',
    icon: FaEgg,
    isVisible: true,
    isComingSoon: true
  },
  {
    id: 'birthdays',
    title: 'Birthdays',
    description: 'Make their special day even sweeter',
    icon: FaBirthdayCake,
    isVisible: true,
    isComingSoon: false
  },
  {
    id: 'christmas',
    title: 'Christmas',
    description: 'Festive designs perfect for holiday gatherings',
    icon: FaGift,
    isVisible: true,
    isComingSoon: true
  },
  {
    id: 'graduation',
    title: 'Graduation',
    description: 'Celebrate academic achievements in style',
    icon: FaGraduationCap,
    isVisible: true,
    isComingSoon: false
  },
  {
    id: 'eid',
    title: 'Eid',
    description: 'Celebrate Eid with elegant green and neutral themed treats',
    icon: FaMoon,
    isVisible: true,
    isComingSoon: true
  }
];

const BentoCakewithCupcakesCollection = () => {
  const [bentoCakes, setBentoCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { totalItems } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState(null);

  useEffect(() => {
    fetchBentoCakes();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchBentoCakes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Bento Cake with Cupcakes'));
      const querySnapshot = await getDocs(q);
      const bentoCakesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Separate seasonal and standard bento cakes
      const seasonalBentoCakes = bentoCakesData.filter(bentoCake => bentoCake.isSeasonal);
      const standardBentoCakes = bentoCakesData.filter(bentoCake => !bentoCake.isSeasonal);
      setBentoCakes({
        seasonal: seasonalBentoCakes,
        standard: standardBentoCakes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bento cakes:', error);
      setError('Failed to load bento cakes. Please try again later.');
      setLoading(false);
    }
  };

  const handleModalOpen = (modal) => {
    setActiveModal(modal);
    setIsProfileOpen(false);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    setIsProfileOpen(!isProfileOpen);
  };

  const handleAuthClick = (e) => {
    e.preventDefault();
    setIsAuthOpen(true);
  };

  if (loading) {
    return <div className="cupcake-collection-container">Loading...</div>;
  }

  if (error) {
    return <div className="cupcake-collection-container">{error}</div>;
  }

  return (
    <div className="cupcake-collection-container">
      <PageTitle title="Bento Cake with Cupcakes" />
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
          <img src="/images/range/BentoCakewithCupcakes.webp" alt="Bento Cake with Cupcakes" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Bento Cake with Cupcakes</h1>
        </div>
      </header>
      <ProfileDropdown
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onModalOpen={handleModalOpen}
      />
      {activeModal === 'search' && <SearchModal onClose={() => setActiveModal(null)} />}
      {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
      {activeModal === 'profile' && <ProfileModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'orders' && <OrderHistoryModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'settings' && <SettingsModal onClose={() => setActiveModal(null)} />}
      {isCartOpen && <CartModal onClose={() => setIsCartOpen(false)} />}
      <div className="cupcake-breadcrumbs">
        <a href="/collections" className="cupcake-breadcrumb-link">Collections</a> / <span className="cupcake-breadcrumb">Bento Cake with Cupcakes</span>
      </div>
      <div className="cupcake-description">
        Our Bento Cakes with Cupcakes are a delightful combination for sharing and gifting. Choose your favourite flavours!
      </div>

      {/* Holiday Highlights Section */}
      <section className="holiday-highlights">
        <h2>Perfect for Every Occasion</h2>
        <div className="holiday-grid">
          {holidayCards
            .filter(card => card.isVisible)
            .map(card => {
              const Icon = card.icon;
              return (
                <div 
                  key={card.id}
                  className={`holiday-card ${card.isComingSoon ? 'coming-soon' : ''}`}
                  onClick={() => !card.isComingSoon && setSelectedHoliday(card.title)}
                >
                  <div className="holiday-icon">
                    <Icon />
                  </div>
                  <div className="holiday-content">
                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                    {card.isComingSoon && (
                      <div className="coming-soon-banner">Coming Soon</div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </section>

      <section className="cupcake-section">
        <div className="cupcake-flavours-grid">
          {bentoCakes.seasonal?.map((bentoCake) => (
            <div className="cupcake-flavour-card" key={bentoCake.id} onClick={() => navigate(`/collections/bento-cakes/${bentoCake.id}`)} style={{ cursor: 'pointer' }}>
              <img src={bentoCake.image} alt={bentoCake.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{bentoCake.name}</h3>
                <p>{bentoCake.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...(Array.isArray(bentoCake.sizes) ? bentoCake.sizes : []).map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Year Round Flavours</h2>
        <div className="cupcake-standard-grid">
          {bentoCakes.standard?.map((bentoCake) => (
            <div className="cupcake-standard-card" key={bentoCake.id} onClick={() => navigate(`/collections/bento-cakes/${bentoCake.id}`)} style={{ cursor: 'pointer' }}>
              <img src={bentoCake.image} alt={bentoCake.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{bentoCake.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...(Array.isArray(bentoCake.sizes) ? bentoCake.sizes : []).map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <Footer />

      <HolidayModal
        isOpen={selectedHoliday !== null}
        onClose={() => setSelectedHoliday(null)}
        holiday={selectedHoliday}
      />
    </div>
  );
};

export default BentoCakewithCupcakesCollection; 