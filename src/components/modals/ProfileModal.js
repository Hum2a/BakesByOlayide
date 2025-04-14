import React, { useState, useEffect } from 'react';
import { FaTimes, FaUser, FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import { auth, db } from '../../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import '../styles/ProfileModal.css';

const ProfileModal = ({ isOpen, onClose }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setFormData({
              displayName: data.displayName || '',
              bio: data.bio || '',
              location: data.location || '',
              website: data.website || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Unable to load profile data. Please try again later.');
        }
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUserData();
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await updateDoc(doc(db, 'users', auth.currentUser.uid), formData);
      setUserData(prev => ({ ...prev, ...formData }));
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Unable to save changes. Please try again later.');
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
      <div className="modal-content profile-modal">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        {error && (
          <div className="error-message">
            <FaExclamationTriangle />
            <p>{error}</p>
          </div>
        )}
        
        <div className="profile-header">
          <div className="profile-image">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" />
            ) : (
              <div className="profile-placeholder">
                <FaUser />
              </div>
            )}
            <button className="change-photo">
              <FaCamera />
            </button>
          </div>
          <h2>{userData?.displayName || 'User'}</h2>
          <p>{userData?.email}</p>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label>Display Name</label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label>Website</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-actions">
              <button type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit">Save Changes</button>
            </div>
          </form>
        ) : (
          <div className="profile-info">
            <div className="info-section">
              <h3>Bio</h3>
              <p>{userData?.bio || 'No bio provided'}</p>
            </div>
            <div className="info-section">
              <h3>Location</h3>
              <p>{userData?.location || 'No location provided'}</p>
            </div>
            <div className="info-section">
              <h3>Website</h3>
              <p>{userData?.website || 'No website provided'}</p>
            </div>
            <button className="edit-button" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileModal; 