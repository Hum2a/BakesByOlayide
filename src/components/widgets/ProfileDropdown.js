import React, { useState, useEffect, useRef } from 'react';
import { FaUser, FaSignOutAlt, FaCog, FaShoppingCart, FaHistory, FaUserShield, FaEdit } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/ProfileDropdown.css';

const ProfileDropdown = ({ isOpen, onClose, onModalOpen }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [nameError, setNameError] = useState('');
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

  const handleNameEdit = () => {
    setNewDisplayName(user?.displayName || '');
    setIsEditingName(true);
    setNameError('');
  };

  const handleNameSave = async () => {
    if (!newDisplayName.trim()) {
      setNameError('Name cannot be empty');
      return;
    }

    if (newDisplayName.length > 50) {
      setNameError('Name must be less than 50 characters');
      return;
    }

    try {
      // Update in Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: newDisplayName.trim()
      });

      // Update in Firestore
      const userDoc = doc(db, 'users', user.uid);
      await updateDoc(userDoc, {
        displayName: newDisplayName.trim()
      });

      // Update local state
      setUser({
        ...user,
        displayName: newDisplayName.trim()
      });
      
      setIsEditingName(false);
      setNameError('');
    } catch (error) {
      console.error('Error updating display name:', error);
      setNameError('Failed to update name. Please try again.');
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setNameError('');
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
          {isEditingName ? (
            <div className="name-edit-container">
              <input
                type="text"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
                className="name-edit-input"
                placeholder="Enter your name"
                maxLength={50}
              />
              {nameError && <p className="name-error">{nameError}</p>}
              <div className="name-edit-buttons">
                <button onClick={handleNameSave} className="name-save-btn">Save</button>
                <button onClick={handleNameCancel} className="name-cancel-btn">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="name-display">
              <h3>{user?.displayName || 'Set your name'}</h3>
              <button onClick={handleNameEdit} className="name-edit-btn">
                <FaEdit />
              </button>
            </div>
          )}
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