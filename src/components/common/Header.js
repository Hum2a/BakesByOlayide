import React, { useState } from 'react';
import { FaBars, FaTimes, FaUser, FaSearch } from 'react-icons/fa';
import { useCart } from '../../context/CartContext';
import '../styles/Header.css';
import SearchModal from '../modals/SearchModal';
import AuthModal from '../modals/AuthModal';
import ProfileModal from '../modals/ProfileModal';
import CartModal from '../modals/CartModal';
import ProfileDropdown from '../widgets/ProfileDropdown';
import OrderHistoryModal from '../modals/OrderHistoryModal';
import SettingsModal from '../modals/SettingsModal';
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { totalItems } = useCart();

  // Handle dropdown/modal open logic
  const handleDropdownModalOpen = (modalType) => {
    switch (modalType) {
      case 'profile':
        setIsProfileModalOpen(true);
        setIsProfileDropdownOpen(false);
        break;
      case 'orders':
        setIsOrdersOpen(true);
        setIsProfileDropdownOpen(false);
        break;
      case 'cart':
        setIsCartOpen(true);
        setIsProfileDropdownOpen(false);
        break;
      case 'settings':
        setIsSettingsOpen(true);
        setIsProfileDropdownOpen(false);
        break;
      case 'auth':
        setIsAuthOpen(true);
        setIsProfileDropdownOpen(false);
        break;
      case 'search':
        setIsSearchOpen(true);
        setIsProfileDropdownOpen(false);
        break;
      default:
        setIsProfileDropdownOpen(false);
        break;
    }
  };

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
            <li><a href="/collections" className="nav-link">Our Range</a></li>
            <li><a href="/guides" className="nav-link">Guides</a></li>
            <li><a href="/about" className="nav-link">About Us</a></li>
            <li><a href="/contact" className="nav-link">Contact Us</a></li>
          </ul>
          <button
            className="mobile-menu-toggle"
            aria-label="Open menu"
            onClick={() => setIsMobileNavOpen(true)}
          >
            <FaBars />
          </button>
          <div className="homepage-nav-icons">
            <button className="nav-icon-link" aria-label="Search" onClick={() => setIsSearchOpen(true)}>
              <FaSearch />
            </button>
            {user ? (
              <button 
                className="auth-nav-button profile-button"
                onClick={() => setIsProfileDropdownOpen(true)}
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
              className="nav-icon-link cart-icon-wrapper" 
              aria-label="Cart"
              onClick={() => setIsCartOpen(true)}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-shopping-cart"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {totalItems > 0 && (
                <span className="cart-badge">{totalItems}</span>
              )}
            </button>
          </div>
          {isMobileNavOpen && (
            <div className="mobile-nav-overlay">
              <button
                className="mobile-menu-close"
                aria-label="Close menu"
                onClick={() => setIsMobileNavOpen(false)}
              >
                <FaTimes />
              </button>
              <ul className="mobile-nav-links">
                <li><a href="/collections" onClick={() => setIsMobileNavOpen(false)}>Our Range</a></li>
                <li><a href="/guides" onClick={() => setIsMobileNavOpen(false)}>Guides</a></li>
                <li><a href="/about" onClick={() => setIsMobileNavOpen(false)}>About Us</a></li>
                <li><a href="/contact" onClick={() => setIsMobileNavOpen(false)}>Contact Us</a></li>
              </ul>
            </div>
          )}
        </nav>
      </header>
      {isSearchOpen && <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />}
      {isAuthOpen && <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />}
      {isProfileDropdownOpen && (
        <ProfileDropdown
          isOpen={isProfileDropdownOpen}
          onClose={() => setIsProfileDropdownOpen(false)}
          onModalOpen={handleDropdownModalOpen}
        />
      )}
      {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />}
      {isOrdersOpen && <OrderHistoryModal isOpen={isOrdersOpen} onClose={() => setIsOrdersOpen(false)} />}
      {isSettingsOpen && <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />}
      {isCartOpen && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </>
  );
};

export default Header; 