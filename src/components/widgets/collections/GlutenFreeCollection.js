import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const GlutenFreeCollection = () => {
  const [glutenFreeProducts, setGlutenFreeProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGlutenFreeProducts();
  }, []);

  const fetchGlutenFreeProducts = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Gluten Free'));
      const querySnapshot = await getDocs(q);
      
      const glutenFreeProductsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard gluten-free products
      const featuredGlutenFreeProducts = glutenFreeProductsData.filter(product => product.featured);
      const standardGlutenFreeProducts = glutenFreeProductsData.filter(product => !product.featured);

      setGlutenFreeProducts({
        featured: featuredGlutenFreeProducts,
        standard: standardGlutenFreeProducts
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching gluten-free products:', error);
      setError('Failed to load gluten-free products. Please try again later.');
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
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/GlutenFree.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Gluten Free Range</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Gluten Free</span>
      </div>
      <div className="cupcake-description">
        Our Gluten Free Range offers delicious alternatives that are perfect for those with gluten sensitivities or celiac disease. Made with carefully selected ingredients, these treats are certified gluten-free and equally delightful!
      </div>
      <section className="cupcake-section">
        <h2>Featured Flavours</h2>
        <div className="cupcake-flavours-grid">
          {glutenFreeProducts.featured?.map((product) => (
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
          {glutenFreeProducts.standard?.map((product) => (
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

export default GlutenFreeCollection; 