import React from 'react';
import '../styles/SignatureCreations.css';

const SignatureCreations = () => {
  return (
    <section className="homepage-featured-cakes">
      <h2>Our Signature Creations</h2>
      <div className="homepage-cake-grid">
        <div className="homepage-cake-card">
          <img src="/images/WeddingCake.jpg" alt="Wedding Cake" />
          <h3>Wedding Cakes</h3>
          <p>Elegant designs for your special day</p>
        </div>
        <div className="homepage-cake-card">
          <img src="/images/BirthdayCake.jpg" alt="Birthday Cake" />
          <h3>Birthday Cakes</h3>
          <p>Celebrate in style with our custom designs</p>
        </div>
        <div className="homepage-cake-card">
          <img src="/images/Cupcake.jpg" alt="Cupcakes" />
          <h3>Cupcakes</h3>
          <p>Perfect for any occasion</p>
        </div>
      </div>
    </section>
  );
};

export default SignatureCreations; 