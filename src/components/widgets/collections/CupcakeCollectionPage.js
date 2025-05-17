import React, { useState, useEffect } from 'react';
import { db, auth } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaSearch, FaUser } from 'react-icons/fa';
import AuthModal from '../../modals/AuthModal';
import ProfileDropdown from '../../widgets/ProfileDropdown';
import ProfileModal from '../../modals/ProfileModal';
import OrderHistoryModal from '../../modals/OrderHistoryModal';
import SettingsModal from '../../modals/SettingsModal';
import CartModal from '../../modals/CartModal';
import SearchModal from '../../modals/SearchModal';
import PageTitle from '../../common/PageTitle';

const CupcakeCollectionPage = () => {
  const [cupcakes, setCupcakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCupcakes();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    // Optionally, update totalItems from your cart context/localStorage here
    return () => unsubscribe();
  }, []);

  const fetchCupcakes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Cupcakes'));
      const querySnapshot = await getDocs(q);
      
      const cupcakesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate seasonal and standard cupcakes
      const seasonalCupcakes = cupcakesData.filter(cake => cake.isSeasonal || cake.featured);
      const standardCupcakes = cupcakesData.filter(cake => !cake.isSeasonal && !cake.featured);

      setCupcakes({
        seasonal: seasonalCupcakes,
        standard: standardCupcakes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cupcakes:', error);
      setError('Failed to load cupcakes. Please try again later.');
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

  // Grid padding for standard cupcakes
  const columns = 4;
  const standardCakes = cupcakes.standard || [];
  const remainder = standardCakes.length % columns;
  const paddedCakes = remainder === 0
    ? standardCakes
    : [...standardCakes, ...Array(columns - remainder).fill({ empty: true, id: `empty-${remainder}` })];

  return (
    <div className="cupcake-collection-container">
      <PageTitle title="Cupcakes" />
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
          <div className="cakepage-nav-links">
            <a href="/cakes">Our Range</a>
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
        <div className="cakepage-hero-bgimg-wrap">
          <img src="/images/range/Cupcakes.png" alt="Cupcakes" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Cupcakes</h1>
        </div>
      </header>
      {/* End CakePage-style Hero Header */}
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Cupcakes</span>
      </div>
      <div className="cupcake-description">
        Cupcakes are sold in three different batch sizes: boxes of 6, 6 and 12. 1 dozen cupcakes is the smallest batch size for a stand-alone order.
      </div>
      <section className="cupcake-section">
        <h2>Flavours of the Season</h2>
        <div className="cupcake-flavours-grid">
          {cupcakes.seasonal?.map((cake) => (
            <div className="cupcake-flavour-card" key={cake.id}>
              <img src={cake.image} alt={cake.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{cake.name}</h3>
                <p>{cake.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...cake.sizes.map(size => size.price)).toFixed(2)} / 6 box
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {paddedCakes.map((cake, idx) =>
            cake.empty ? (
              <div className="cupcake-standard-card empty" key={cake.id || idx}></div>
            ) : (
              <div className="cupcake-standard-card" key={cake.id}>
                <img src={cake.image} alt={cake.name} className="cupcake-standard-img" />
                <div className="cupcake-standard-info">
                  <h3>{cake.name}</h3>
                  <span className="cupcake-standard-price">
                    From £{Math.min(...cake.sizes.map(size => size.price)).toFixed(2)} / 6 box
                  </span>
                </div>
              </div>
            )
          )}
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

export default CupcakeCollectionPage; 