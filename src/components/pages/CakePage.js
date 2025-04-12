import React, { useState, useRef, useEffect } from 'react';
import CakeCard from '../cards/CakeCard';
import CakeModal from '../modals/CakeModal';
import { FaShoppingCart, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import '../styles/CakePage.css';

const CakePage = ({ onOpenCart }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedCake, setSelectedCake] = useState(null);
  const [showFilterScroll, setShowFilterScroll] = useState({ left: false, right: true });
  const filterContainerRef = useRef(null);
  const { totalItems } = useCart();

  // Sample cake data - in a real app, this would come from an API or database
  const cakes = [
    {
      id: 1,
      name: "Classic Vanilla Cake",
      description: "A timeless vanilla sponge cake with buttercream frosting",
      price: 45.99,
      image: "/images/vanilla-cake.jpg",
      category: "Classic",
      features: ['3 layers of fluffy vanilla cake', 'Vanilla bean buttercream', 'Fresh fruit decoration', 'Serves 8-10 people']
    },
    {
      id: 2,
      name: "Chocolate Fudge Cake",
      description: "Rich chocolate cake with layers of fudge and chocolate ganache",
      price: 49.99,
      image: "/images/chocolate-cake.jpg",
      category: "Chocolate",
      features: ['3 layers of moist chocolate cake', 'Creamy fudge frosting', 'Chocolate ganache drizzle', 'Serves 8-10 people']
    },
    {
      id: 3,
      name: "Red Velvet Cake",
      description: "Classic red velvet with cream cheese frosting",
      price: 52.99,
      image: "/images/red-velvet.jpg",
      category: "Specialty"
    },
    {
      id: 4,
      name: "Carrot Cake",
      description: "Moist carrot cake with cream cheese frosting and walnuts",
      price: 48.99,
      image: "/images/carrot-cake.jpg",
      category: "Classic"
    },
    {
      id: 5,
      name: "Lemon Drizzle Cake",
      description: "Zesty lemon cake with lemon glaze",
      price: 44.99,
      image: "/images/lemon-cake.jpg",
      category: "Fruit"
    },
    {
      id: 6,
      name: "Strawberry Shortcake",
      description: "Light sponge cake with fresh strawberries and whipped cream",
      price: 54.99,
      image: "/images/strawberry-cake.jpg",
      category: "Fruit"
    }
  ];

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

  return (
    <div className="cakepage-container">
      <header className="cakepage-header">
        <div className="cakepage-header-content">
          <img 
            src="/images/cake-header.jpg" 
            alt="Cake Header" 
            onClick={() => window.location.href = '/'} 
            className="cakepage-header-image"
          />
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
