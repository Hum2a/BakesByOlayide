import React, { useState, useRef, useEffect } from 'react';
import CakeCard from '../cards/CakeCard';
import CakeModal from '../modals/CakeModal';
import { FaShoppingCart, FaSearch, FaUser } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/CakePage.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../common/Footer';
import AuthModal from '../modals/AuthModal';
import ProfileDropdown from '../widgets/ProfileDropdown';
import ProfileModal from '../modals/ProfileModal';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import SettingsModal from '../modals/SettingsModal';
import CartModal from '../modals/CartModal';
import SearchModal from '../modals/SearchModal';
import { auth } from '../../firebase/firebase';
import PageTitle from '../common/PageTitle';

// Fixed categories
const FIXED_CATEGORIES = [
  {
    name: 'Cupcakes',
    description: 'Handmade and elegantly decorated cupcakes; perfect for any occasion.',
    image: '/images/range/Cupcakes.png'
  },
  {
    name: 'Large Cakes',
    description: 'Personalised and fully customisable celebration cakes made fresh in house.',
    image: '/images/range/LargeCakes.png'
  },
  {
    name: 'Bento Cake with Cupcakes',
    description: 'The perfect fusion between cupcakes and celebration cakes: For those who want a little bit of the best of both worlds.',
    image: '/images/range/BentoCakewithCupcakes.png'
  },
  {
    name: 'Brownies',
    description: "Fantastically fudgey and irresistible with our whipped cream, these brownies are a chocoholic's dream.",
    image: '/images/range/Brownies.png'
  },
  {
    name: 'Cookies',
    description: 'Chewy, chocolatey and moorish with Cornish ice-cream, our cookies are the perfect sweet treat.',
    image: '/images/range/Cookies.png'
  },
  {
    name: 'Vegan Range',
    description: 'Delightfully sweet plant powered bakes made for you..',
    image: '/images/range/VeganRange.png'
  },
  {
    name: 'Gluten Free',
    description: 'Delicious bakes made without gluten so you can eat cakes without worry.',
    image: '/images/range/GlutenFree.png'
  },
  {
    name: 'Subscription Boxes',
    description: 'Have cravings often? Subscribe for monthly boxes of cakes, brownies and cookies right to your door.',
    image: '/images/range/SubscriptionBoxes.png'
  }
];

const CakePage = ({ onOpenCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCake, setSelectedCake] = useState(null);
  const [showFilterScroll, setShowFilterScroll] = useState({ left: false, right: true });
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterContainerRef = useRef(null);
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const cakeGridRef = useRef(null);
  const [imageError, setImageError] = useState({});
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchCakes = async () => {
      try {
        setLoading(true);
        const cakesCollection = collection(db, 'cakes');
        const snapshot = await getDocs(cakesCollection);
        const cakesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCakes(cakesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching cakes:', err);
        setError('Failed to load cakes. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCakes();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Use fixed categories
  const categories = ['All', ...FIXED_CATEGORIES.map(category => category.name)];

  const filteredCakes = activeCategory === 'All'
    ? cakes
    : cakes.filter(cake => (cake.categories || []).includes(activeCategory));

  const handleCategoryClick = (category) => {
    setActiveCategory(category);
  };

  const handleAddToCart = (cake) => {
    // Add to cart logic here
    console.log('Added to cart:', cake);
  };

  const scrollFilters = (direction) => {
    if (filterContainerRef.current) {
      const scrollAmount = 200;
      const container = filterContainerRef.current;
      if (direction === 'left') {
        container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      } else {
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  };

  const checkScrollButtons = () => {
    if (filterContainerRef.current) {
      const container = filterContainerRef.current;
      const { scrollLeft, scrollWidth, clientWidth } = container;
      
      setShowFilterScroll({
        left: scrollLeft > 0,
        right: scrollLeft < scrollWidth - clientWidth - 1
      });
    }
  };

  useEffect(() => {
    checkScrollButtons();
    window.addEventListener('resize', checkScrollButtons);
    return () => window.removeEventListener('resize', checkScrollButtons);
  }, []);

  const handleViewCakes = (category) => {
    const categoryPath = category.toLowerCase().replace(/\s+/g, '');
    navigate(`/collections/${categoryPath}`);
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
    return (
      <div className="cakepage-container">
        <div className="cakepage-loading">
          Loading cakes...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="cakepage-container">
        <div className="cakepage-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="cakepage-container">
      <PageTitle title="Our Range" />
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
            <button className="cakepage-cart-button" onClick={onOpenCart} aria-label="View Cart">
              <FaShoppingCart />
              {totalItems > 0 && <span className={`cart-count${totalItems ? ' cart-count-animate' : ''}`}>{totalItems}</span>}
            </button>
          </div>
        </nav>
        <div className="cakepage-hero-bgimg-wrap">
          <img src="/images/FondantCake.png" alt="Our Range" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Our Range</h1>
        </div>
      </header>

      <div className="cakepage-collections-list">
        <h1>Collections</h1>
        {FIXED_CATEGORIES.map((category, idx) => (
          <div className={`cakepage-collection-row${idx % 2 === 1 ? ' reverse' : ''}`} key={category.name}>
            <div className="cakepage-collection-info">
              <h2>{category.name}</h2>
              <p>{category.description}</p>
              <button className="cakepage-viewcakes-btn" onClick={() => handleViewCakes(category.name)}>
                Explore
              </button>
            </div>
            <div className="cakepage-collection-image-wrap">
              {imageError[category.name] ? (
                <div className="cakepage-collection-no-image">
                  <span>NO IMAGE UPLOADED</span>
                </div>
              ) : (
                <img
                  src={category.image}
                  alt={category.name}
                  className="cakepage-collection-image"
                  onError={() => setImageError(prev => ({ ...prev, [category.name]: true }))}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {activeCategory !== 'All' && (
        <div ref={cakeGridRef} className="cakepage-grid">
          {filteredCakes.map((cake) => (
            <div 
              key={cake.id} 
              className="cakepage-card-wrapper"
              onClick={() => { setSelectedCake(cake); }}
            >
              <CakeCard cake={cake} />
            </div>
          ))}
        </div>
      )}

      {selectedCake && (
        <CakeModal
          cake={selectedCake}
          onClose={() => setSelectedCake(null)}
          onAddToCart={handleAddToCart}
        />
      )}

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

      <Footer />
    </div>
  );
};

export default CakePage;
