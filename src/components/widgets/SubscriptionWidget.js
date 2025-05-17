import React, { useState } from 'react';
import '../styles/SubscriptionWidget.css';

const SubscriptionWidget = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // You can add your subscription logic here
    setSubmitted(true);
    setEmail('');
  };

  return (
    <section className="subscription-widget-section">
      <div className="subscription-widget-bg">
        <img
          src="/images/SubscriptionImage.jpg"
          alt="Cake Subscription"
          className="subscription-widget-img-bg"
        />
        <div className="subscription-widget-overlay">
          <h2 className="subscription-widget-title">Cake is an all-year thing.</h2>
          <p className="subscription-widget-desc">
            Don't make it a one-time affair. Sign up to receive exclusive offers and occasion reminders.
          </p>
          {submitted ? (
            <div className="subscription-widget-success">Thank you for subscribing!</div>
          ) : (
            <form className="subscription-widget-form" onSubmit={handleSubmit}>
              <input
                type="email"
                className="subscription-widget-input"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="subscription-widget-btn">Sign Up</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionWidget; 