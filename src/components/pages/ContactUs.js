import React, { useState } from 'react';
import { db } from '../../firebase/firebase';
import { collection, addDoc } from 'firebase/firestore';
import '../styles/ContactUs.css';
import Header from '../common/Header';
import Footer from '../common/Footer';
import PageTitle from '../common/PageTitle';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    inquiry: ''
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
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        message: formData.inquiry,
        timestamp: new Date(),
        status: 'new'
      });
      setSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        inquiry: ''
      });
    } catch (error) {
      setError('There was an error submitting your enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contactus-page">
      <PageTitle title="Contact Us" />
      <Header />
      <div className="contactus-header">
        <h1>Contact Us</h1>
      </div>
      <div className="contactus-content contactus-content-centered">
        <div className="contactus-form-section contactus-form-centered">
          {submitted ? (
            <div className="contactus-success">Thank you for your enquiry! We'll be in touch soon.</div>
          ) : (
            <form onSubmit={handleSubmit} className="contactus-form">
              <div className="contactus-form-row">
                <div className="contactus-form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="Jane"
                  />
                </div>
                <div className="contactus-form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    placeholder="Smith"
                  />
                </div>
              </div>
              <div className="contactus-form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="email@example.co.uk"
                />
              </div>
              <div className="contactus-form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  placeholder="07123 456789"
                />
              </div>
              <div className="contactus-form-group">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Multi-Tier Birthday Cake"
                />
              </div>
              <div className="contactus-form-group">
                <label htmlFor="inquiry">Inquiry</label>
                <textarea
                  id="inquiry"
                  name="inquiry"
                  value={formData.inquiry}
                  onChange={handleChange}
                  required
                  placeholder="Enter your message"
                  rows="6"
                ></textarea>
              </div>
              {error && <div className="contactus-error">{error}</div>}
              <button type="submit" className="contactus-submit-button" disabled={loading}>
                {loading ? 'Sending...' : 'Submit'}
              </button>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ContactUs;
