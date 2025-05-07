import React from 'react';
import '../styles/GuidesPage.css';

const Guides = () => {
  return (
    <section className="homepage-guides">
      <h2 className="guides-title">Guides</h2>
      <div className="guides-grid">
        <div className="guide-card">
          <img src="/images/dandelion.png" alt="Dietary Requirements" />
          <h3>Have Any Dietary Requirements?</h3>
          <p>Over 20% of us in the UK have an allergy of some kind. See what we can do for you.</p>
          <a href="/guides/dietary-requirements" className="guide-read-btn">Read More</a>
        </div>
        <div className="guide-card">
          <img src="/images/picnic.png" alt="Special Occasion" />
          <h3>Planning a Special Occasion?</h3>
          <p>There's no better way to finish a large event than to end it with something sweet.</p>
          <a href="/guides/special-occasions" className="guide-read-btn">Read More</a>
        </div>
      </div>
      <div className="guide-banner">
        <img src="/images/fruit-cake.png" alt="Cake Banner" className="guide-banner-bg" />
        <div className="guide-banner-content">
          <h3>Cake is an all-year thing.</h3>
          <p>Don't make it a one-time affair. Sign up to receive exclusive offers and occasion reminders.</p>
          <form className="guide-signup-form">
            <input type="email" placeholder="Email" required />
            <button type="submit">Sign Up</button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Guides; 