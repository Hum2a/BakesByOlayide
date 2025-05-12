import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const CupcakeCollectionPage = () => {
  const [page, setPage] = useState(1);
  const [cupcakes, setCupcakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cakesPerPage = 6;

  useEffect(() => {
    fetchCupcakes();
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
      const seasonalCupcakes = cupcakesData.filter(cake => cake.isSeasonal);
      const standardCupcakes = cupcakesData.filter(cake => !cake.isSeasonal);

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

  const totalPages = Math.ceil((cupcakes.standard?.length || 0) / cakesPerPage);
  const paginatedCakes = cupcakes.standard?.slice((page - 1) * cakesPerPage, page * cakesPerPage) || [];

  if (loading) {
    return <div className="cupcake-collection-container">Loading...</div>;
  }

  if (error) {
    return <div className="cupcake-collection-container">{error}</div>;
  }

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

      {/* Standard Range */}
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {paginatedCakes.map((cake) => (
            <div className="cupcake-standard-card" key={cake.id}>
              <img src={cake.image} alt={cake.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{cake.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...cake.sizes.map(size => size.price)).toFixed(2)} / 6 box
                </span>
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