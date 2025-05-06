import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import '../styles/ContactUs.css';
import Header from '../common/Header';
import Footer from '../common/Footer';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    occasion: 'birthday'
  });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await addDoc(collection(db, 'enquiries'), {
        ...formData,
        timestamp: new Date(),
        status: 'new'
      });
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        occasion: 'birthday'
      });
    } catch (error) {
      setError('There was an error submitting your enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contactus-page">
      <Header />
      <div className="contactus-header">
        <h1>Contact Us</h1>
        <p className="contactus-subheading">Let's create something special together</p>
      </div>
      <div className="contactus-content">
        <div className="contactus-form-section">
          {submitted ? (
            <div className="contactus-success">Thank you for your enquiry! We'll be in touch soon.</div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Your Name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                />
              </div>
              <div className="form-group">
                <label htmlFor="occasion">Occasion</label>
                <select
                  id="occasion"
                  name="occasion"
                  value={formData.occasion}
                  onChange={handleChange}
                >
                  <option value="birthday">Birthday</option>
                  <option value="wedding">Wedding</option>
                  <option value="anniversary">Anniversary</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  placeholder="Tell us about your dream cake..."
                  rows="4"
                ></textarea>
              </div>
              {error && <div className="contactus-error">{error}</div>}
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
        <div className="contactus-info-section">
          <div className="modal-contact">
            <h2>Contact Information</h2>
            <p>Or reach us directly:</p>
            <p>📞 (123) 456-7890</p>
            <p>📧 info@sweetdelights.com</p>
            <p>📍 123 Bakery Street, Sweet City</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
