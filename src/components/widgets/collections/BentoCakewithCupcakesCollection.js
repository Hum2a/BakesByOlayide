import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/CupcakeCollectionPage.css';
import Footer from '../../common/Footer';
import PageTitle from '../../common/PageTitle';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaUser, FaBars, FaTimes } from 'react-icons/fa';

const BentoCakewithCupcakesCollection = () => {
  const [bentoCakes, setBentoCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [totalItems, setTotalItems] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    fetchBentoCakes();
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
          <img src="/images/range/BentoCake.png" alt="Bento Cake with Cupcakes" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Bento Cake with Cupcakes</h1>
        </div>
      </header>
      <div className="cupcake-breadcrumbs">
        <a href="/collections" className="cupcake-breadcrumb-link">Collections</a> / <span className="cupcake-breadcrumb">Bento Cake with Cupcakes</span>
      </div>
      <div className="cupcake-description">
        Our Bento Cakes with Cupcakes are a delightful combination for sharing and gifting. Choose your favourite flavours!
      </div>
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
    </div>
  );
};

export default BentoCakewithCupcakesCollection; 