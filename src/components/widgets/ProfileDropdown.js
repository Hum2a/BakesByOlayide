import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaSignOutAlt, FaCog, FaShoppingCart, FaHistory, FaUserShield } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileDropdown.css';

const ProfileDropdown = ({ isOpen, onClose, onModalOpen }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setIsAdmin((userData.isAdmin || userData.isDeveloper) || false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
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

  const handleAdminClick = () => {
    navigate('/admin');
    onClose();
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
        <button className="dropdown-item" onClick={() => onModalOpen('profile')}>
          <FaUser /> My Profile
        </button>
        <button className="dropdown-item" onClick={() => onModalOpen('orders')}>
          <FaHistory /> Order History
        </button>
        <button className="dropdown-item" onClick={() => onModalOpen('cart')}>
          <FaShoppingCart /> My Cart
        </button>
        <button className="dropdown-item" onClick={() => onModalOpen('settings')}>
          <FaCog /> Settings
        </button>
        {isAdmin && (
          <button className="dropdown-item admin" onClick={handleAdminClick}>
            <FaUserShield /> Admin Dashboard
          </button>
        )}
        <button className="dropdown-item sign-out" onClick={handleSignOut}>
          <FaSignOutAlt /> Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileDropdown; 