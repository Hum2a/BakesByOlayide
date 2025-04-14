import React, { useState, useRef, useEffect } from 'react';
import CakeCard from '../cards/CakeCard';
import CakeModal from '../modals/CakeModal';
import { FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import { db } from '../../firebase/firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/CakePage.css';

const CakePage = ({ onOpenCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCake, setSelectedCake] = useState(null);
  const [showFilterScroll, setShowFilterScroll] = useState({ left: false, right: true });
  const [cakes, setCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filterContainerRef = useRef(null);
  const { totalItems } = useCart();

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

  // Filter cakes based on active category
  const filteredCakes = activeCategory === 'All' 
    ? cakes 
    : cakes.filter(cake => cake.category === activeCategory);

  // Get unique categories for filter buttons
  const categories = ['All', ...new Set(cakes.map(cake => cake.category))];

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
      <header className="cakepage-header">
        <div className="cakepage-header-content">
          <div className="cakepage-logo">
            <img src="/images/Transparent BYB Logo.png" alt="BakesByOlayide Logo" className="cakepage-logo-image" />
          </div>
          <div className="cakepage-header-text">
            <h1>Our Cakes</h1>
            <p>Browse our selection of handcrafted cakes</p>
          </div>
          <button 
            className="cakepage-cart-button" 
            onClick={onOpenCart}
            aria-label="Open shopping cart"
          >
            <FaShoppingCart />
            {totalItems > 0 && (
              <span className="cart-count">{totalItems}</span>
            )}
          </button>
        </div>
      </header>

      <div className="cakepage-filters-wrapper">
        {showFilterScroll.left && (
          <button 
            className="filter-scroll-button left"
            onClick={() => scrollFilters('left')}
            aria-label="Scroll filters left"
          >
            <FaChevronLeft />
          </button>
        )}
        <div 
          className="cakepage-filters" 
          ref={filterContainerRef}
          onScroll={checkScrollButtons}
        >
          {categories.map((category) => (
            <button
              key={category}
              className={`cakepage-filter-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => handleCategoryClick(category)}
            >
              {category}
            </button>
          ))}
        </div>
        {showFilterScroll.right && (
          <button 
            className="filter-scroll-button right"
            onClick={() => scrollFilters('right')}
            aria-label="Scroll filters right"
          >
            <FaChevronRight />
          </button>
        )}
      </div>

      <div className="cakepage-grid">
        {filteredCakes.map((cake) => (
          <div 
            key={cake.id} 
            className="cakepage-card-wrapper"
            onClick={() => setSelectedCake(cake)}
          >
            <CakeCard cake={cake} />
          </div>
        ))}
      </div>

      {filteredCakes.length === 0 && (
        <div className="cakepage-no-results">
          <p>No cakes found in this category.</p>
        </div>
      )}

      {selectedCake && (
        <CakeModal
          cake={selectedCake}
          onClose={() => setSelectedCake(null)}
          onAddToCart={handleAddToCart}
        />
      )}
    </div>
  );
};

export default CakePage;
