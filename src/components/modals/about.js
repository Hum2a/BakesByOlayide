import React from 'react';
import '../styles/Modal.css';

const About = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>Our Story</h2>
        </div>

        <div className="modal-body">
          <div className="modal-section">
            <img src="/images/bakery-interior.jpg" alt="Our Bakery" className="modal-image" />
            <h3>A Journey of Passion</h3>
            <p>BakesByOlayide is more than just a bakery - it's a celebration of creativity and craftsmanship. Every cake we create is a unique masterpiece, designed to make your special moments unforgettable.</p>
          </div>

          <div className="modal-section">
            <h3>Our Philosophy</h3>
            <p>At BakesByOlayide, we believe that every celebration deserves a cake that's as unique as the occasion itself. Our team combines artisanal techniques with contemporary designs to create cakes that not only look stunning but taste extraordinary.</p>
          </div>

          <div className="modal-section">
            <h3>Quality Ingredients</h3>
            <p>We carefully select premium ingredients for each creation. From locally sourced fresh fruits to the finest Belgian chocolate, every component is chosen to ensure exceptional taste and quality in every bite.</p>
          </div>

          <div className="modal-section">
            <h3>Custom Creations</h3>
            <p>Whether it's a wedding, birthday, or special celebration, we work closely with you to design the perfect cake that reflects your style and vision. Each cake is handcrafted with attention to detail and personal care.</p>
          </div>

          <div className="modal-section">
            <h3>Our Commitment</h3>
            <p>Our passionate team is dedicated to exceeding your expectations. With years of experience and a love for baking, we ensure that every cake becomes a cherished part of your celebration.</p>
          </div>
        </div>

        <div className="modal-footer">
          <div className="modal-contact">
            <h3>Visit Us</h3>
            <p>123 Bakery Street, Sweet City</p>
            <p>Monday - Saturday: 9:00 AM - 6:00 PM</p>
            <p>Sunday: 10:00 AM - 4:00 PM</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
