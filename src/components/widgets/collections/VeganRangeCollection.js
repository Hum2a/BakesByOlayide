import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const VeganRangeCollection = () => {
  const [veganProducts, setVeganProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVeganProducts();
  }, []);

  const fetchVeganProducts = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Vegan Range'));
      const querySnapshot = await getDocs(q);
      
      const veganProductsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard vegan products
      const featuredVeganProducts = veganProductsData.filter(product => product.featured);
      const standardVeganProducts = veganProductsData.filter(product => !product.featured);

      setVeganProducts({
        featured: featuredVeganProducts,
        standard: standardVeganProducts
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching vegan products:', error);
      setError('Failed to load vegan products. Please try again later.');
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
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/VeganRange.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Vegan Range</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Vegan Range</span>
      </div>
      <div className="cupcake-description">
        Our Vegan Range offers delicious plant-based alternatives that are perfect for everyone. Made with the finest ingredients, these treats are 100% vegan and equally delightful!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          {veganProducts.featured?.map((product) => (
            <div className="cupcake-flavour-card" key={product.id}>
              <img src={product.image} alt={product.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...product.sizes.map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Range</h2>
        <div className="cupcake-standard-grid">
          {veganProducts.standard?.map((product) => (
            <div className="cupcake-standard-card" key={product.id}>
              <img src={product.image} alt={product.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{product.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...product.sizes.map(size => size.price)).toFixed(2)}
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

export default VeganRangeCollection; 