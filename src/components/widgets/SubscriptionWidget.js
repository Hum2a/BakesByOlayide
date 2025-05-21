import React, { useState } from 'react';
import '../styles/SubscriptionWidget.css';
import { db } from '../../firebase/firebase';
import { doc, setDoc } from 'firebase/firestore';

const SubscriptionWidget = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      // Save to Firestore: 'newsletter' collection, email as doc ID
      await setDoc(doc(db, 'newsletter', email), {
        email,
        subscribedAt: new Date(),
        optedIn: true
      });
      // TODO: Call backend to add to Zoho
      setSubmitted(true);
      setEmail('');
    } catch (err) {
      setError('Failed to subscribe. Please try again.');
      console.error(err);
    }
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
              {error && <div style={{ color: 'red', marginTop: '0.5rem' }}>{error}</div>}
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default SubscriptionWidget; 