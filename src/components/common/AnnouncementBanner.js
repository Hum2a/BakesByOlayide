import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { db } from '../../firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import '../styles/AnnouncementBanner.css';

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    // Listen for changes to the announcement document
    const unsubscribe = onSnapshot(doc(db, 'siteSettings', 'announcement'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setAnnouncement(data);
        setIsScrolling(data.scrollAnimation || false);
        // Reset visibility when a new announcement is set
        setIsVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!announcement?.isActive || !isVisible) {
    return null;
  }

  return (
    <div className={`announcement-banner ${announcement.type || 'info'} ${isScrolling ? 'scrolling' : ''}`}>
      <div className="announcement-content">
        {isScrolling ? (
          <div className="scrolling-text">
            <span>{announcement.message}</span>
            {announcement.link && (
              <a 
                href={announcement.link} 
                className="announcement-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {announcement.linkText || 'Learn More'}
              </a>
            )}
          </div>
        ) : (
          <>
            {announcement.message}
            {announcement.link && (
              <a 
                href={announcement.link} 
                className="announcement-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                {announcement.linkText || 'Learn More'}
              </a>
            )}
          </>
        )}
      </div>
      <button 
        className="announcement-close"
        onClick={() => setIsVisible(false)}
        aria-label="Close announcement"
      >
        <FaTimes />
      </button>
    </div>
  );
};

export default AnnouncementBanner; 