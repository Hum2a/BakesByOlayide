import React, { useState } from 'react';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

// Placeholder cake data
const flavoursOfTheSeason = [
  {
    name: 'Cinnamon Apple',
    image: '/images/range/cinnamon-apple.jpg',
    description: 'Moist apple cupcakes with spiced swirl blend buttercream.',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'White Chocolate and Coconut',
    image: '/images/range/white-choc-coconut.jpg',
    description: 'White chocolate cupcakes, coconut topping.',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Berries and Cream',
    image: '/images/range/berries-cream.jpg',
    description: 'Berry cupcakes, vanilla cream swirl.',
    price: 'From £12.50 / 6 box',
  },
];

const standardRange = [
  {
    name: 'Vanilla Sponge',
    image: '/images/range/vanilla-sponge.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Chocolate Sponge',
    image: '/images/range/chocolate-sponge.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Red Velvet',
    image: '/images/range/red-velvet.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Oreo',
    image: '/images/range/oreo.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Cookie dough',
    image: '/images/range/cookie-dough.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Salted Caramel',
    image: '/images/range/salted-caramel.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Tiramisu',
    image: '/images/range/tiramisu.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Vegan Vanilla Sponge',
    image: '/images/range/vegan-vanilla.jpg',
    price: 'From £12.50 / 6 box',
  },
  {
    name: 'Vegan Chocolate Sponge',
    image: '/images/range/vegan-chocolate.jpg',
    price: 'From £12.50 / 6 box',
  },
];

const CupcakeCollectionPage = () => {
  const [page, setPage] = useState(1);
  const cakesPerPage = 6;
  const totalPages = Math.ceil(standardRange.length / cakesPerPage);
  const paginatedCakes = standardRange.slice((page - 1) * cakesPerPage, page * cakesPerPage);

  return (
    <div className="cupcake-collection-container">
      {/* Hero Section */}
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/Cupcakes.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Cupcakes</h1>
        </div>
      </div>

      {/* Breadcrumbs and Description */}
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Cupcakes</span>
      </div>
      <div className="cupcake-description">
        Cupcakes are sold in three different batch sizes: boxes of 6, 6 and 12. 1 dozen cupcakes is the smallest batch size for a stand-alone order.
      </div>

      {/* Flavours of the Season */}
      <section className="cupcake-section">
        <h2>Flavours of the Season</h2>
        <div className="cupcake-flavours-grid">
          {flavoursOfTheSeason.map((cake, idx) => (
            <div className="cupcake-flavour-card" key={cake.name}>
              <img src={cake.image} alt={cake.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{cake.name}</h3>
                <p>{cake.description}</p>
                <span className="cupcake-flavour-price">{cake.price}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Standard Range */}
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {paginatedCakes.map((cake) => (
            <div className="cupcake-standard-card" key={cake.name}>
              <img src={cake.image} alt={cake.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{cake.name}</h3>
                <span className="cupcake-standard-price">{cake.price}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination */}
        <div className="cupcake-pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              className={`cupcake-page-btn${page === i + 1 ? ' active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CupcakeCollectionPage; 