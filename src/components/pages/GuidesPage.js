import React, { useState, useEffect } from 'react';
import '../styles/GuidesPage.css';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Guides from '../widgets/Guides';
import { auth } from '../../firebase/firebase';

const GuidesPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleMobileMenuClick = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    setIsProfileOpen(!isProfileOpen);
    setIsMobileMenuOpen(false);
  };

  const handleAuthClick = (e) => {
    e.preventDefault();
    // Handle auth click - you might want to add state for auth modal here
  };

  const handleModalOpen = (modal) => {
    // Handle modal opening - you might want to add state for different modals here
    setIsProfileOpen(false);
  };

  return (
    <div className="guides-page-container">
      <Header 
        user={user}
        isScrolled={isScrolled}
        isMobileMenuOpen={isMobileMenuOpen}
        handleMobileMenuClick={handleMobileMenuClick}
        handleProfileClick={handleProfileClick}
        handleAuthClick={handleAuthClick}
        isProfileOpen={isProfileOpen}
        setIsProfileOpen={setIsProfileOpen}
        setIsAuthOpen={() => {}}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        handleModalOpen={handleModalOpen}
      />

      <main className="guides-page-content">
        <Guides />
      </main>

      <Footer />
    </div>
  );
};

export default GuidesPage;
