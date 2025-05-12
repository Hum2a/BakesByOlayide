import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const BrowniesCollection = () => {
  const [brownies, setBrownies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBrownies();
  }, []);

  const fetchBrownies = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Brownies'));
      const querySnapshot = await getDocs(q);
      
      const browniesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard brownies
      const featuredBrownies = browniesData.filter(brownie => brownie.featured);
      const standardBrownies = browniesData.filter(brownie => !brownie.featured);

      setBrownies({
        featured: featuredBrownies,
        standard: standardBrownies
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching brownies:', error);
      setError('Failed to load brownies. Please try again later.');
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
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/Brownies.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Brownies</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Brownies</span>
      </div>
      <div className="cupcake-description">
        Our brownies are rich, fudgy, and perfect for any chocolate lover. Try our classic and seasonal flavours!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          {brownies.featured?.map((brownie) => (
            <div className="cupcake-flavour-card" key={brownie.id}>
              <img src={brownie.image} alt={brownie.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{brownie.name}</h3>
                <p>{brownie.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...brownie.sizes.map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {brownies.standard?.map((brownie) => (
            <div className="cupcake-standard-card" key={brownie.id}>
              <img src={brownie.image} alt={brownie.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{brownie.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...brownie.sizes.map(size => size.price)).toFixed(2)}
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

export default BrowniesCollection; 