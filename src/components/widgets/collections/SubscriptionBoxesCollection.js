import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './CupcakeCollectionPage.css';
import Footer from '../../common/Footer';

const SubscriptionBoxesCollection = () => {
  const [subscriptionBoxes, setSubscriptionBoxes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubscriptionBoxes();
  }, []);

  const fetchSubscriptionBoxes = async () => {
    try {
      setLoading(true);
      const cakesRef = collection(db, 'cakes');
      const q = query(cakesRef, where('categories', 'array-contains', 'Subscription Boxes'));
      const querySnapshot = await getDocs(q);
      
      const subscriptionBoxesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Separate featured and standard subscription boxes
      const featuredSubscriptionBoxes = subscriptionBoxesData.filter(box => box.featured);
      const standardSubscriptionBoxes = subscriptionBoxesData.filter(box => !box.featured);

      setSubscriptionBoxes({
        featured: featuredSubscriptionBoxes,
        standard: standardSubscriptionBoxes
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching subscription boxes:', error);
      setError('Failed to load subscription boxes. Please try again later.');
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
      <div className="cupcake-hero" style={{ backgroundImage: `url('/images/range/SubscriptionBoxes.png')` }}>
        <div className="cupcake-hero-overlay">
          <h1 className="cupcake-hero-title">Subscription Boxes</h1>
        </div>
      </div>
      <div className="cupcake-breadcrumbs">
        <span>Collections</span> / <span>Subscription Boxes</span>
      </div>
      <div className="cupcake-description">
        Treat yourself or someone special to a regular delivery of our delicious treats! Our subscription boxes are carefully curated with a selection of our finest products, perfect for gifting or personal indulgence. Choose from monthly, bi-weekly, or weekly deliveries.
      </div>
      <section className="cupcake-section">
        <h2>Featured Boxes</h2>
        <div className="cupcake-flavours-grid">
          {subscriptionBoxes.featured?.map((box) => (
            <div className="cupcake-flavour-card" key={box.id}>
              <img src={box.image} alt={box.name} className="cupcake-flavour-img" />
              <div className="cupcake-flavour-info">
                <h3>{box.name}</h3>
                <p>{box.description}</p>
                <div className="subscription-details">
                  <span className="cupcake-flavour-price">
                    From £{Math.min(...box.sizes.map(size => size.price)).toFixed(2)}
                  </span>
                  {box.deliveryFrequency && (
                    <span className="delivery-frequency">
                      {box.deliveryFrequency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="cupcake-section">
        <h2>Standard Boxes</h2>
        <div className="cupcake-standard-grid">
          {subscriptionBoxes.standard?.map((box) => (
            <div className="cupcake-standard-card" key={box.id}>
              <img src={box.image} alt={box.name} className="cupcake-standard-img" />
              <div className="cupcake-standard-info">
                <h3>{box.name}</h3>
                <div className="subscription-details">
                  <span className="cupcake-standard-price">
                    From £{Math.min(...box.sizes.map(size => size.price)).toFixed(2)}
                  </span>
                  {box.deliveryFrequency && (
                    <span className="delivery-frequency">
                      {box.deliveryFrequency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section className="subscription-benefits">
        <h2>Why Choose Our Subscription Boxes?</h2>
        <div className="benefits-grid">
          <div className="benefit-item">
            <h3>Regular Treats</h3>
            <p>Never run out of your favorite treats with regular deliveries.</p>
          </div>
          <div className="benefit-item">
            <h3>Flexible Plans</h3>
            <p>Choose from weekly, bi-weekly, or monthly delivery options.</p>
          </div>
          <div className="benefit-item">
            <h3>Easy Management</h3>
            <p>Pause, skip, or cancel your subscription anytime.</p>
          </div>
          <div className="benefit-item">
            <h3>Special Offers</h3>
            <p>Exclusive discounts and early access to new products.</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default SubscriptionBoxesCollection; 