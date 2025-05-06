import React, { useState, useRef, useEffect } from 'react';
import CakeCard from '../cards/CakeCard';
import CakeModal from '../modals/CakeModal';
import { FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/CakePage.css';
import { useNavigate } from 'react-router-dom';
import Footer from '../common/Footer';

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

  // Update category extraction and filtering:
  const allCategories = Array.from(new Set(cakes.flatMap(cake => cake.categories || [])));
  const categories = ['All', ...allCategories];

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
    setActiveCategory(category);
    setTimeout(() => {
      if (cakeGridRef.current) {
        cakeGridRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
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
      <header className="cakepage-hero">
        <img 
          src="/logos/LogoYellowLayeredTransparent.png" 
          alt="Bakes by Olayide Logo" 
          className="cakepage-hero-logo" 
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/')} 
        />
        <nav className="cakepage-hero-nav">
          <a href="/cakes">Our Range</a>
          <a href="/guides">Guides</a>
          <a href="/about">Our Story</a>
          <a href="/contact">Contact Us</a>
        </nav>
        <div className="cakepage-hero-bgimg-wrap">
          <img src="/images/FondantCake.png" alt="Our Range" className="cakepage-hero-bgimg" />
          <h1 className="cakepage-hero-title">Our Range</h1>
        </div>
      </header>

      <div className="cakepage-collections-list">
        <h1>Collections</h1>
        {allCategories.map((category, idx) => (
          <div className={`cakepage-collection-row${idx % 2 === 1 ? ' reverse' : ''}`} key={category}>
            <div className="cakepage-collection-info">
              <h2>{category}</h2>
              <button className="cakepage-viewcakes-btn" onClick={() => handleViewCakes(category)}>
                View Cakes
              </button>
            </div>
            <div className="cakepage-collection-image-wrap">
              {categories.find(cat => cat.name === category)?.image ? (
                <img 
                  src={categories.find(cat => cat.name === category).image} 
                  alt={category} 
                  className="cakepage-collection-image" 
                />
              ) : (
                <div className="cakepage-collection-no-image">
                  <span>NO IMAGE UPLOADED</span>
                </div>
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

      <Footer />
    </div>
  );
};

export default CakePage;
