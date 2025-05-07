import React from 'react';
import { FaUser } from 'react-icons/fa';

const Header = ({
  user,
  isScrolled,
  isMobileMenuOpen,
  handleMobileMenuClick,
  handleProfileClick,
  handleAuthClick,
  isProfileOpen,
  setIsProfileOpen,
  setIsAuthOpen,
  setIsMobileMenuOpen,
  handleModalOpen
}) => (
  <header className={`homepage-header ${isScrolled ? 'scrolled' : ''}`} style={{ background: '#000' }}>
    <nav className="homepage-nav">
      <div className="homepage-logo">
        <img src="/logos/LogoYellowTransparent.png" alt="BakesByOlayide Logo" className="homepage-logo-image" />
      </div>
      <ul className="homepage-nav-links main-nav-links">
        <li><a href="/cakes" className="nav-link">Our Range</a></li>
        <li><a href="/guides" className="nav-link">Guides</a></li>
        <li><a href="/about" className="nav-link">About Us</a></li>
        <li><a href="/contact" className="nav-link">Contact Us</a></li>
      </ul>
      <div className="homepage-nav-icons">
        {user ? (
          <button 
            className="auth-nav-button profile-button"
            onClick={handleProfileClick}
          >
            {user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="profile-image" />
            ) : (
              <FaUser />
            )}
          </button>
        ) : (
          <button 
            className="auth-nav-button"
            onClick={handleAuthClick}
          >
            <FaUser /> Account
          </button>
        )}
        <a href="/cart" className="nav-icon-link" aria-label="Cart">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </a>
      </div>
    </nav>
  </header>
);

export default Header; 