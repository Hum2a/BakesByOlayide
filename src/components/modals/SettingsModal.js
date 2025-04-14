import React, { useState, useEffect } from 'react';
import { FaTimes, FaBell, FaLock, FaPalette, FaLanguage } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import '../styles/SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    notifications: true,
    theme: 'light',
    language: 'en',
    emailNotifications: true,
    marketingEmails: false
  });
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSettings(prev => ({
            ...prev,
            ...userData.settings
          }));
        }
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleSettingChange = async (setting, value) => {
    try {
      const newSettings = { ...settings, [setting]: value };
      setSettings(newSettings);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), {
        settings: newSettings
      });
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        setDeleteError('No user logged in');
        return;
      }

      if (!showPasswordInput) {
        setShowPasswordInput(true);
        return;
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email,
        password
      );
      await reauthenticateWithCredential(user, credential);

      // Delete user's Firestore data
      await deleteDoc(doc(db, 'users', user.uid));

      // Delete user's authentication account
      await deleteUser(user);

      // Navigate to home page after successful deletion
      navigate('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.code === 'auth/wrong-password') {
        setDeleteError('Incorrect password. Please try again.');
      } else {
        setDeleteError('Failed to delete account. Please try again.');
      }
    }
  };

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content settings-modal">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <h2>Settings</h2>
        
        <div className="settings-section">
          <h3><FaBell /> Notifications</h3>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
              Enable Notifications
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
              />
              Email Notifications
            </label>
          </div>
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.marketingEmails}
                onChange={(e) => handleSettingChange('marketingEmails', e.target.checked)}
              />
              Marketing Emails
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3><FaPalette /> Appearance</h3>
          <div className="setting-item">
            <label>Theme</label>
            <select
              value={settings.theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3><FaLanguage /> Language</h3>
          <div className="setting-item">
            <label>Language</label>
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
            </select>
          </div>
        </div>

        <div className="settings-section">
          <h3><FaLock /> Privacy</h3>
          <div className="setting-item">
            <button className="change-password">Change Password</button>
          </div>
          <div className="setting-item">
            {!deleteConfirm ? (
              <button 
                className="delete-account"
                onClick={() => setDeleteConfirm(true)}
              >
                Delete Account
              </button>
            ) : (
              <div className="delete-confirmation">
                <p>Are you sure you want to delete your account? This action cannot be undone.</p>
                {deleteError && <p className="error-message">{deleteError}</p>}
                <div className="confirmation-buttons">
                  <button 
                    className="confirm-delete"
                    onClick={handleDeleteAccount}
                  >
                    Yes, Delete Account
                  </button>
                  <button 
                    className="cancel-delete"
                    onClick={() => {
                      setDeleteConfirm(false);
                      setDeleteError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal; 