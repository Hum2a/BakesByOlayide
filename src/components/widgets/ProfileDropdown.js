import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaSignOutAlt, FaCog, FaShoppingCart, FaHistory } from 'react-icons/fa';
import { auth } from '../../firebase/firebase';
import '../styles/ProfileDropdown.css';

const ProfileDropdown = ({ isOpen, onClose }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!isOpen || loading) return null;

  return (
    <div className="profile-dropdown" ref={dropdownRef}>
      <div className="profile-dropdown-header">
        <div className="profile-image">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" />
          ) : (
            <div className="profile-placeholder">
              <FaUser />
            </div>
          )}
        </div>
        <div className="profile-info">
          <h3>{user?.displayName || 'User'}</h3>
          <p>{user?.email}</p>
        </div>
      </div>

      <div className="profile-dropdown-menu">
        <a href="/profile" className="dropdown-item">
          <FaUser /> My Profile
        </a>
        <a href="/orders" className="dropdown-item">
          <FaHistory /> Order History
        </a>
        <a href="/cart" className="dropdown-item">
          <FaShoppingCart /> My Cart
        </a>
        <a href="/settings" className="dropdown-item">
          <FaCog /> Settings
        </a>
        <button className="dropdown-item sign-out" onClick={handleSignOut}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown; 