import React from 'react';
import { FaFacebook, FaInstagram, FaYoutube, FaTwitter } from 'react-icons/fa';
import '../styles/Footer.css';

const Footer = () => (
  <footer className="custom-footer">
    <div className="footer-content">
      <div className="footer-brand-social">
        <div className="footer-brand">Bakes by Olayide</div>
        <div className="footer-social">
          <a href="#" aria-label="Facebook"><FaFacebook /></a>
          <a href="#" aria-label="YouTube"><FaYoutube /></a>
          <a href="#" aria-label="Instagram"><FaInstagram /></a>
          <a href="#" aria-label="Twitter"><FaTwitter /></a>
        </div>
      </div>
      <div className="footer-links-grid">
        <div className="footer-links-col">
          <div className="footer-topic">About</div>
          <a href="/about">About Us</a>
          <a href="/sustainability">Sustainability</a>
        </div>
        <div className="footer-links-col">
          <div className="footer-topic">Help</div>
          <a href="/contact">Contact Us</a>
          <a href="/faqs">FAQs</a>
          <a href="/corporate">Corporate</a>
        </div>
        <div className="footer-links-col">
          <div className="footer-topic">Information</div>
          <a href="/guides">Guides</a>
          <a href="/allergens">Allergen Information</a>
          <a href="/terms">Terms and Conditions</a>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer; 