import React from 'react';
import '../styles/SignatureCreations.css';

const SignatureCreations = () => {
  return (
    <section className="homepage-featured-cakes">
      <h2>Our Range</h2>
      <div className="signature-cake-row">
        <div className="homepage-cake-card">
          <img src="/range/Cupcakes.png" alt="Cupcakes" />
          <h3>Cupcakes</h3>
          <a href="/cakes?category=Cupcakes" className="signature-browse-btn">Browse</a>
        </div>
        <div className="homepage-cake-card">
          <img src="/range/LargeCakes.png" alt="Large Cakes" />
          <h3>Large Cakes</h3>
          <a href="/cakes?category=Large%20Cakes" className="signature-browse-btn">Browse</a>
        </div>
        <div className="homepage-cake-card">
          <img src="/range/BentoCake.png" alt="Bento with Cupcakes" />
          <h3>Bento with Cupcakes</h3>
          <a href="/cakes?category=Bento%20with%20Cupcakes" className="signature-browse-btn">Browse</a>
        </div>
      </div>
      <div className="signature-cake-row">
        <div className="homepage-cake-card">
          <img src="/range/Brownies.png" alt="Brownies" />
          <h3>Brownies</h3>
          <a href="/cakes?category=Brownies" className="signature-browse-btn">Browse</a>
        </div>
        <div className="homepage-cake-card">
          <img src="/range/cookies.png" alt="Cookies" />
          <h3>Cookies</h3>
          <a href="/cakes?category=Cookies" className="signature-browse-btn">Browse</a>
        </div>
      </div>
    </section>
  );
};

export default SignatureCreations; 