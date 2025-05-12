import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const LargeCakesCollection = () => {
  const [largeCakes, setLargeCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLargeCakes();
  }, []);

  const fetchLargeCakes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Large Cakes'));
      const querySnapshot = await getDocs(q);
      
      const largeCakesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard large cakes
      const featuredLargeCakes = largeCakesData.filter(largeCake => largeCake.featured);
      const standardLargeCakes = largeCakesData.filter(largeCake => !largeCake.featured);

      setLargeCakes({
        featured: featuredLargeCakes,
        standard: standardLargeCakes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching large cakes:', error);
      setError('Failed to load large cakes. Please try again later.');
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="cupcake-collection-container">Loading...</div>;
  }

  if (error) {
    return <div className="cupcake-collection-container">{error}</div>;
  }

  return (
    <div className="cupcake-collection-container">
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/LargeCakes.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Large Cakes</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Large Cakes</span>
      </div>
      <div className="cupcake-description">
        Our Large Cakes are perfect for celebrations and special occasions. Choose from a variety of flavours and designs.
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          {largeCakes.featured?.map((largeCake) => (
            <div className="cupcake-flavour-card" key={largeCake.id}>
              <img src={largeCake.image} alt={largeCake.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{largeCake.name}</h3>
                <p>{largeCake.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...largeCake.sizes.map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {largeCakes.standard?.map((largeCake) => (
            <div className="cupcake-standard-card" key={largeCake.id}>
              <img src={largeCake.image} alt={largeCake.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{largeCake.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...largeCake.sizes.map(size => size.price)).toFixed(2)}
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

export default LargeCakesCollection; 