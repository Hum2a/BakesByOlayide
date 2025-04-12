import React, { useState } from 'react';
import '../styles/Modal.css';

const Contact = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    occasion: 'birthday'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically handle the form submission
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      occasion: 'birthday'
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content contact-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>Contact Us</h2>
          <p>Let's create something special together</p>
        </div>

        <div className="modal-body">
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

            <button type="submit" className="submit-button">Send Message</button>
          </form>
        </div>

        <div className="modal-footer">
          <div className="modal-contact">
            <p>Or reach us directly:</p>
            <p>📞 (123) 456-7890</p>
            <p>📧 info@sweetdelights.com</p>
            <p>📍 123 Bakery Street, Sweet City</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
