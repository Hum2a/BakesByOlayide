import React, { useState } from 'react';
import '../styles/CakePage.css';

const CakePage = () => {
  const [activeCategory, setActiveCategory] = useState('All');

  // Sample cake data - in a real app, this would come from an API or database
  const cakes = [
    {
      id: 1,
      name: "Classic Vanilla Cake",
      description: "A timeless vanilla sponge cake with buttercream frosting",
      price: 45.99,
      image: "/images/vanilla-cake.jpg",
      category: "Classic"
    },
    {
      id: 2,
      name: "Chocolate Fudge Cake",
      description: "Rich chocolate cake with layers of fudge and chocolate ganache",
      price: 49.99,
      image: "/images/chocolate-cake.jpg",
      category: "Chocolate"
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

  return (
    <div className="cakepage-container">
      <header className="cakepage-header">
        <img src="/images/cake-header.jpg" alt="Cake Header" onClick={() => window.location.href = '/'} className="cakepage-header-image"/>
        <h1>Our Cakes</h1>
        <p>Browse our selection of handcrafted cakes</p>
      </header>

      <div className="cakepage-filters">
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

      <div className="cakepage-grid">
        {filteredCakes.map((cake) => (
          <div className="cakepage-card" key={cake.id}>
            <div className="cakepage-image">
              <img src={cake.image} alt={cake.name} />
            </div>
            <div className="cakepage-info">
              <h3>{cake.name}</h3>
              <p className="cakepage-description">{cake.description}</p>
              <div className="cakepage-footer">
                <span className="cakepage-price">${cake.price}</span>
                <button className="cakepage-order-btn">Order Now</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCakes.length === 0 && (
        <div className="cakepage-no-results">
          <p>No cakes found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default CakePage;
