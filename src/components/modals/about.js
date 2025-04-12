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
            <h3>Sweet Beginnings</h3>
            <p>Founded in 2010, Sweet Delights began as a small family bakery with a big dream. What started as a passion for creating delicious treats has grown into a beloved destination for cake lovers across the city.</p>
          </div>

          <div className="modal-section">
            <h3>Our Philosophy</h3>
            <p>At Sweet Delights, we believe that every celebration deserves the perfect cake. Our team of expert bakers combines traditional techniques with modern creativity to bring you unique and delicious creations that not only look stunning but taste amazing.</p>
          </div>

          <div className="modal-section">
            <h3>Quality Ingredients</h3>
            <p>We take pride in using only the finest ingredients in our cakes. From locally sourced fresh fruits to premium Belgian chocolate, every component is carefully selected to ensure the best taste and quality.</p>
          </div>

          <div className="modal-section">
            <h3>Custom Creations</h3>
            <p>Whether it's a wedding, birthday, or special celebration, our talented team can create the perfect cake to match your vision. We work closely with our customers to design unique cakes that reflect their style and preferences.</p>
          </div>

          <div className="modal-section">
            <h3>Our Team</h3>
            <p>Our passionate team of bakers, decorators, and customer service professionals work together to ensure every cake exceeds expectations. With years of experience and a love for baking, we're dedicated to making your special moments even sweeter.</p>
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
