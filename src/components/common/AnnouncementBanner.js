import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { db } from '../../firebase/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import '../styles/AnnouncementBanner.css';

const AnnouncementBanner = () => {
  const [announcement, setAnnouncement] = useState({
    messages: [{ text: '', color: '#3498db' }],
    isActive: false,
    link: '',
    linkText: '',
    scrollAnimation: false,
    messageInterval: 5,
    useCustomColors: false,
    backgroundColor: '#3498db'
  });
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolling, setIsScrolling] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Listen for changes to the announcement document
    const unsubscribe = onSnapshot(doc(db, 'siteSettings', 'announcement'), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Ensure messages array exists
        const messages = data.messages || [{ text: data.message || '', color: '#3498db' }];
        setAnnouncement({
          ...data,
          messages,
          messageInterval: data.messageInterval || 5,
          useCustomColors: data.useCustomColors || false,
          backgroundColor: data.backgroundColor || '#3498db'
        });
        setIsScrolling(data.scrollAnimation || false);
        setCurrentMessageIndex(0);
        // Reset visibility when a new announcement is set
        setIsVisible(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!announcement?.isActive || isScrolling || !announcement.messages || announcement.messages.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMessageIndex((prevIndex) => 
          (prevIndex + 1) % announcement.messages.length
        );
        setIsTransitioning(false);
      }, 500); // Half a second for the transition
    }, announcement.messageInterval * 1000);

    return () => clearInterval(interval);
  }, [announcement, isScrolling]);

  if (!announcement?.isActive || !isVisible || !announcement.messages?.length) {
    return null;
  }

  const currentMessage = announcement.messages[currentMessageIndex] || announcement.messages[0];
  const nextMessageIndex = (currentMessageIndex + 1) % announcement.messages.length;
  const nextMessage = announcement.messages[nextMessageIndex];

  return (
    <div 
      className={`announcement-banner ${isScrolling ? 'scrolling' : ''}`}
      style={{ backgroundColor: announcement.backgroundColor }}
    >
      <div className="announcement-content">
        {isScrolling ? (
          <div className="scrolling-text">
            {announcement.messages.map((message, index) => (
              <span 
                key={index} 
                style={{ color: announcement.useCustomColors ? message.color : undefined }}
              >
                {message.text}
                {index < announcement.messages.length - 1 && ' • '}
              </span>
            ))}
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
          <div className="rotating-messages">
            <div 
              className={`message current ${isTransitioning ? 'slide-out' : ''}`}
              style={{
                backgroundColor: announcement.useCustomColors ? currentMessage.color : undefined
              }}
            >
              {currentMessage.text}
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
            {announcement.messages.length > 1 && (
              <div 
                className={`message next ${isTransitioning ? 'slide-in' : ''}`}
                style={{
                  backgroundColor: announcement.useCustomColors ? nextMessage.color : undefined
                }}
              >
                {nextMessage.text}
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
            )}
          </div>
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