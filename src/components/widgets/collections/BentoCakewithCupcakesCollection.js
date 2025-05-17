import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import '../../styles/CupcakeCollectionPage.css';
import Footer from '../../common/Footer';
import PageTitle from '../../common/PageTitle';
import { useNavigate } from 'react-router-dom';

const BentoCakewithCupcakesCollection = () => {
  const [bentoCakes, setBentoCakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBentoCakes();
  }, []);

  const fetchBentoCakes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Bento Cake with Cupcakes'));
      const querySnapshot = await getDocs(q);
      
      const bentoCakesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate seasonal and standard bento cakes
      const seasonalBentoCakes = bentoCakesData.filter(bentoCake => bentoCake.isSeasonal);
      const standardBentoCakes = bentoCakesData.filter(bentoCake => !bentoCake.isSeasonal);

      setBentoCakes({
        seasonal: seasonalBentoCakes,
        standard: standardBentoCakes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bento cakes:', error);
      setError('Failed to load bento cakes. Please try again later.');
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
      <PageTitle title="Bento Cake with Cupcakes" />
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/BentoCake.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Bento Cake with Cupcakes</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <a href="/cakes" className="cupcake-breadcrumb-link">Collections</a> / <span className="cupcake-breadcrumb">Bento Cake with Cupcakes</span>
      </div>
      <div className="cupcake-description">
        Our Bento Cakes with Cupcakes are a delightful combination for sharing and gifting. Choose your favourite flavours!
      </div>
      <section className="cupcake-section">
        <h2>Flavours of the Season</h2>
        <div className="cupcake-flavours-grid">
          {bentoCakes.seasonal?.map((bentoCake) => (
            <div className="cupcake-flavour-card" key={bentoCake.id} onClick={() => navigate(`/cakes/${bentoCake.id}`)} style={{ cursor: 'pointer' }}>
              <img src={bentoCake.image} alt={bentoCake.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{bentoCake.name}</h3>
                <p>{bentoCake.description}</p>
                <span className="cupcake-flavour-price">
                  From £{Math.min(...bentoCake.sizes.map(size => size.price)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Year Round Flavours</h2>
        <div className="cupcake-standard-grid">
          {bentoCakes.standard?.map((bentoCake) => (
            <div className="cupcake-standard-card" key={bentoCake.id} onClick={() => navigate(`/cake/${bentoCake.id}`)} style={{ cursor: 'pointer' }}>
              <img src={bentoCake.image} alt={bentoCake.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{bentoCake.name}</h3>
                <span className="cupcake-standard-price">
                  From £{Math.min(...bentoCake.sizes.map(size => size.price)).toFixed(2)}
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

export default BentoCakewithCupcakesCollection; 