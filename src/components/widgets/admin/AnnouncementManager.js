import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import '../../styles/AnnouncementManager.css';

const AnnouncementManager = () => {
  const [announcement, setAnnouncement] = useState({
    message: '',
    type: 'info',
    isActive: false,
    link: '',
    linkText: '',
    scrollAnimation: false
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const initializeAnnouncement = async () => {
    const defaultAnnouncement = {
      message: '',
      type: 'info',
      isActive: false,
      link: '',
      linkText: '',
      scrollAnimation: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const docRef = doc(db, 'siteSettings', 'announcement');
      await setDoc(docRef, defaultAnnouncement);
      return defaultAnnouncement;
    } catch (error) {
      console.error('Error initializing announcement:', error);
      throw error;
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const docRef = doc(db, 'siteSettings', 'announcement');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setAnnouncement(docSnap.data());
      } else {
        // Initialize the announcement document if it doesn't exist
        const defaultAnnouncement = await initializeAnnouncement();
        setAnnouncement(defaultAnnouncement);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching announcement:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus('saving');

    try {
      const docRef = doc(db, 'siteSettings', 'announcement');
      const updatedAnnouncement = {
        ...announcement,
        updatedAt: new Date().toISOString()
      };
      await setDoc(docRef, updatedAnnouncement);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      console.error('Error saving announcement:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAnnouncement(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <div className="announcement-manager">Loading...</div>;
  }

  return (
    <div className="announcement-manager">
      <h2>Announcement Banner Manager</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            name="message"
            value={announcement.message}
            onChange={handleChange}
            placeholder="Enter your announcement message"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            name="type"
            value={announcement.type}
            onChange={handleChange}
          >
            <option value="info">Info (Blue)</option>
            <option value="success">Success (Green)</option>
            <option value="warning">Warning (Yellow)</option>
            <option value="error">Error (Red)</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="link">Link URL (Optional)</label>
          <input
            type="url"
            id="link"
            name="link"
            value={announcement.link}
            onChange={handleChange}
            placeholder="https://example.com"
          />
        </div>

        <div className="form-group">
          <label htmlFor="linkText">Link Text (Optional)</label>
          <input
            type="text"
            id="linkText"
            name="linkText"
            value={announcement.linkText}
            onChange={handleChange}
            placeholder="Learn More"
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="isActive"
              checked={announcement.isActive}
              onChange={handleChange}
            />
            Active
          </label>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="scrollAnimation"
              checked={announcement.scrollAnimation}
              onChange={handleChange}
            />
            Enable Scrolling Animation
          </label>
          <p className="form-help-text">
            When enabled, the announcement will scroll continuously across the screen.
            When disabled, it will appear as a static banner.
          </p>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className={`save-button ${saveStatus}`}
            disabled={saveStatus === 'saving'}
          >
            {saveStatus === 'saving' ? 'Saving...' : 
             saveStatus === 'success' ? 'Saved!' :
             saveStatus === 'error' ? 'Error Saving' :
             'Save Changes'}
          </button>
        </div>
      </form>

      <div className="preview-section">
        <h3>Preview</h3>
        {announcement.isActive ? (
          <div className={`announcement-banner ${announcement.type} ${announcement.scrollAnimation ? 'scrolling' : ''}`}>
            <div className="announcement-content">
              {announcement.scrollAnimation ? (
                <div className="scrolling-text">
                  <span>{announcement.message}</span>
                  {announcement.link && (
                    <a href={announcement.link} className="announcement-link">
                      {announcement.linkText || 'Learn More'}
                    </a>
                  )}
                </div>
              ) : (
                <>
                  {announcement.message}
                  {announcement.link && (
                    <a href={announcement.link} className="announcement-link">
                      {announcement.linkText || 'Learn More'}
                    </a>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <p className="preview-inactive">Announcement is currently inactive</p>
        )}
      </div>
    </div>
  );
};

export default AnnouncementManager; 