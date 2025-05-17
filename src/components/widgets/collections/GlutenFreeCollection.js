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

const GlutenFreeCollection = () => {
  const [glutenFreeProducts, setGlutenFreeProducts] = useState([]);
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
    fetchGlutenFreeProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const fetchGlutenFreeProducts = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Gluten Free'));
      const querySnapshot = await getDocs(q);
      
      const glutenFreeProductsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard gluten-free products
      const featuredGlutenFreeProducts = glutenFreeProductsData.filter(product => product.featured);
      const standardGlutenFreeProducts = glutenFreeProductsData.filter(product => !product.featured);

      setGlutenFreeProducts({
        featured: featuredGlutenFreeProducts,
        standard: standardGlutenFreeProducts
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gluten-free products:', error);
      setError('Failed to load gluten-free products. Please try again later.');
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

  // Grid padding for standard gluten-free products
  const columns = 4;
  const standardProducts = glutenFreeProducts.standard || [];
  const remainder = standardProducts.length % columns;
  const paddedProducts = remainder === 0
    ? standardProducts
    : [...standardProducts, ...Array(columns - remainder).fill({ empty: true, id: `empty-${remainder}` })];

  return (
    <div className="cupcake-collection-container">
      <PageTitle title="Gluten Free Range" />
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
          <img src="/images/range/GlutenFree.png" alt="Gluten Free Range" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Gluten Free Range</h1>
        </div>
      </header>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Gluten Free</span>
      </div>
      <div className="cupcake-description">
        Our Gluten Free Range offers delicious alternatives that are perfect for those with gluten sensitivities or celiac disease. Made with carefully selected ingredients, these treats are certified gluten-free and equally delightful!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          {glutenFreeProducts.featured?.map((product) => (
            <div className="cupcake-flavour-card" key={product.id}>
              <img src={product.image} alt={product.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...product.sizes.map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {paddedProducts.map((product, idx) =>
            product.empty ? (
              <div className="cupcake-standard-card empty" key={product.id || idx}></div>
            ) : (
              <div className="cupcake-standard-card" key={product.id}>
                <img src={product.image} alt={product.name} className="cupcake-standard-img" />
                <div className="cupcake-standard-info">
                  <h3>{product.name}</h3>
                  <span className="cupcake-standard-price">
                    From £{Math.min(...product.sizes.map(size => size.price)).toFixed(2)}
                  </span>
                </div>
              </div>
            )
          )}
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

export default GlutenFreeCollection; 