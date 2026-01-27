import React, { useEffect } from 'react';
import AppRouter from './navigation/AppRouter';
import { CartProvider } from './context/CartContext';
import AnnouncementBanner from './components/common/AnnouncementBanner';
import ConstructionBanner from './components/common/ConstructionBanner';
import './App.css';

function App() {
  useEffect(() => {
    // Add class to body to prevent scrolling and interactions
    document.body.classList.add('construction-mode');
    // Prevent scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      // Cleanup: remove class when component unmounts
      document.body.classList.remove('construction-mode');
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <CartProvider>
      <div className="App">
        <div className="app-content-blocked">
          <AnnouncementBanner />
          <AppRouter />
        </div>
        <ConstructionBanner />
      </div>
    </CartProvider>
  );
}

export default App;
