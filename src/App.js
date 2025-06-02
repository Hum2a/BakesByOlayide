import React from 'react';
import AppRouter from './navigation/AppRouter';
import { CartProvider } from './context/CartContext';
import AnnouncementBanner from './components/common/AnnouncementBanner';
import './App.css';

function App() {
  return (
    <CartProvider>
      <div className="App">
        <AnnouncementBanner />
        <AppRouter />
      </div>
    </CartProvider>
  );
}

export default App;
