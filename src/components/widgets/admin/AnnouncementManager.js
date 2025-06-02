import React, { useState, useEffect } from 'react';
import { db } from '../../../firebase/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ChromePicker } from 'react-color';
import '../../styles/AnnouncementManager.css';

const AnnouncementManager = () => {
  const [announcement, setAnnouncement] = useState({
    messages: [{ text: '', color: '#3498db' }],
    isActive: false,
    link: '',
    linkText: '',
    scrollAnimation: false,
    messageInterval: 5, // seconds between message changes
    useCustomColors: false,
    backgroundColor: '#3498db' // Default background color
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(null);
  const [showBackgroundColorPicker, setShowBackgroundColorPicker] = useState(false);

  useEffect(() => {
    fetchAnnouncement();
  }, []);

  const initializeAnnouncement = async () => {
    const defaultAnnouncement = {
      messages: [{ text: '', color: '#3498db' }],
      isActive: false,
      link: '',
      linkText: '',
      scrollAnimation: false,
      messageInterval: 5,
      useCustomColors: false,
      backgroundColor: '#3498db',
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
        const data = docSnap.data();
        // Handle legacy data format
        const messages = data.messages || [{ text: data.message || '', color: '#3498db' }];
        setAnnouncement({
          ...data,
          messages,
          messageInterval: data.messageInterval || 5,
          useCustomColors: data.useCustomColors || false,
          backgroundColor: data.backgroundColor || '#3498db'
        });
      } else {
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

  const handleMessageChange = (index, field, value) => {
    setAnnouncement(prev => ({
      ...prev,
      messages: prev.messages.map((msg, i) => 
        i === index ? { ...msg, [field]: value } : msg
      )
    }));
  };

  const handleBackgroundColorChange = (color) => {
    setAnnouncement(prev => ({
      ...prev,
      backgroundColor: color.hex
    }));
  };

  const addMessage = () => {
    setAnnouncement(prev => ({
      ...prev,
      messages: [...(prev.messages || []), { text: '', color: '#3498db' }]
    }));
  };

  const removeMessage = (index) => {
    setAnnouncement(prev => ({
      ...prev,
      messages: prev.messages.filter((_, i) => i !== index)
    }));
  };

  const handleColorChange = (index, color) => {
    handleMessageChange(index, 'color', color.hex);
  };

  if (loading) {
    return <div className="announcement-manager">Loading...</div>;
  }

  const messages = announcement.messages || [];

  return (
    <div className="announcement-manager">
      <h2>Announcement Banner Manager</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Messages</label>
          {messages.map((message, index) => (
            <div key={index} className="message-group">
              <div className="message-inputs">
                <textarea
                  value={message.text}
                  onChange={(e) => handleMessageChange(index, 'text', e.target.value)}
                  placeholder="Enter your announcement message"
                  required
                />
                {announcement.useCustomColors && (
                  <div className="color-picker-container">
                    <button
                      type="button"
                      className="color-picker-button"
                      style={{ backgroundColor: message.color }}
                      onClick={() => setShowColorPicker(index)}
                    />
                    {showColorPicker === index && (
                      <div className="color-picker-popover">
                        <div className="color-picker-cover" onClick={() => setShowColorPicker(null)} />
                        <ChromePicker
                          color={message.color}
                          onChange={(color) => handleColorChange(index, color)}
                        />
                      </div>
                    )}
                  </div>
                )}
                {messages.length > 1 && (
                  <button
                    type="button"
                    className="remove-message"
                    onClick={() => removeMessage(index)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
          <button
            type="button"
            className="add-message"
            onClick={addMessage}
          >
            Add Another Message
          </button>
        </div>

        <div className="form-group">
          <label>Background Color</label>
          <div className="color-picker-container">
            <button
              type="button"
              className="color-picker-button"
              style={{ backgroundColor: announcement.backgroundColor }}
              onClick={() => setShowBackgroundColorPicker(!showBackgroundColorPicker)}
            />
            {showBackgroundColorPicker && (
              <div className="color-picker-popover">
                <div className="color-picker-cover" onClick={() => setShowBackgroundColorPicker(false)} />
                <ChromePicker
                  color={announcement.backgroundColor}
                  onChange={handleBackgroundColorChange}
                />
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="messageInterval">Message Interval (seconds)</label>
          <input
            type="number"
            id="messageInterval"
            name="messageInterval"
            value={announcement.messageInterval}
            onChange={handleChange}
            min="1"
            max="60"
          />
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="useCustomColors"
              checked={announcement.useCustomColors}
              onChange={handleChange}
            />
            Use Custom Colors for Messages
          </label>
          <p className="form-help-text">
            When enabled, you can pick custom colors for each message. When disabled, messages will use predefined colors.
          </p>
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
          <div 
            className={`announcement-banner ${announcement.scrollAnimation ? 'scrolling' : ''}`}
            style={{ backgroundColor: announcement.backgroundColor }}
          >
            <div className="announcement-content">
              {announcement.scrollAnimation ? (
                <div className="scrolling-text">
                  {messages.map((message, index) => (
                    <span 
                      key={index} 
                      style={{ color: announcement.useCustomColors ? message.color : undefined }}
                    >
                      {message.text}
                      {index < messages.length - 1 && ' • '}
                    </span>
                  ))}
                  {announcement.link && (
                    <a href={announcement.link} className="announcement-link">
                      {announcement.linkText || 'Learn More'}
                    </a>
                  )}
                </div>
              ) : (
                <div className="rotating-messages">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className="message"
                      style={{
                        backgroundColor: announcement.useCustomColors ? message.color : undefined,
                        display: index === 0 ? 'block' : 'none'
                      }}
                    >
                      {message.text}
                      {announcement.link && (
                        <a href={announcement.link} className="announcement-link">
                          {announcement.linkText || 'Learn More'}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
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