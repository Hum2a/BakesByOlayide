import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const CookiesCollection = () => {
  const [cookies, setCookies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCookies();
  }, []);

  const fetchCookies = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Cookies'));
      const querySnapshot = await getDocs(q);
      
      const cookiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard cookies
      const featuredCookies = cookiesData.filter(cookie => cookie.featured);
      const standardCookies = cookiesData.filter(cookie => !cookie.featured);

      setCookies({
        featured: featuredCookies,
        standard: standardCookies
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cookies:', error);
      setError('Failed to load cookies. Please try again later.');
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
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/cookies.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Cookies</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Cookies</span>
      </div>
      <div className="cupcake-description">
        Our cookies are baked fresh daily and come in a variety of flavours. Perfect for snacking or sharing!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          {cookies.featured?.map((cookie) => (
            <div className="cupcake-flavour-card" key={cookie.id}>
              <img src={cookie.image} alt={cookie.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{cookie.name}</h3>
                <p>{cookie.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...cookie.sizes.map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {cookies.standard?.map((cookie) => (
            <div className="cupcake-standard-card" key={cookie.id}>
              <img src={cookie.image} alt={cookie.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{cookie.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...cookie.sizes.map(size => size.price)).toFixed(2)}
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

export default CookiesCollection; 