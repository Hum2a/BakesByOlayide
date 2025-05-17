import React, { useState } from 'react';
import { FaUser, FaSearch } from 'react-icons/fa';
import '../styles/Header.css';
import SearchModal from '../modals/SearchModal';
import AuthModal from '../modals/AuthModal';
import ProfileModal from '../modals/ProfileModal';
import CartModal from '../modals/CartModal';
import { useNavigate } from 'react-router-dom';

const Header = ({
  user,
  isScrolled,
  isMobileMenuOpen,
  handleMobileMenuClick,
  handleProfileClick,
  handleAuthClick,
  isProfileOpen,
  setIsProfileOpen,
  setIsMobileMenuOpen,
  handleModalOpen
}) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <header className={`homepage-header ${isScrolled ? 'scrolled' : ''}`}>
        <nav className="homepage-nav">
          <div className="homepage-logo">
            <img 
              src="/logos/LogoYellowTransparent.png" 
              alt="BakesByOlayide Logo" 
              className="homepage-logo-image" 
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/')} 
            />
          </div>
          <ul className="homepage-nav-links main-nav-links">
            <li><a href="/cakes" className="nav-link">Our Range</a></li>
            <li><a href="/guides" className="nav-link">Guides</a></li>
            <li><a href="/about" className="nav-link">About Us</a></li>
            <li><a href="/contact" className="nav-link">Contact Us</a></li>
          </ul>
          <div className="homepage-nav-icons">
            <button className="nav-icon-link" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <FaSearch />
            </button>
            {user ? (
              <button 
                className="auth-nav-button profile-button"
                onClick={() => setIsProfileOpen(true)}
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
                onClick={() => setIsAuthOpen(true)}
              >
                <FaUser />
              </button>
            )}
            <button 
              className="nav-icon-link" 
              aria-label="Cart"
              onClick={() => setIsCartOpen(true)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </button>
          </div>
        </nav>
      </header>
      {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      {isAuthOpen && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
      {isProfileOpen && <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />}
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Header; 