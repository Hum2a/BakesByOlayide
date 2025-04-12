import React from 'react';
import AppRouter from './navigation/AppRouter';
import { CartProvider } from './context/CartContext';
import './App.css';

function App() {
  return (
    <CartProvider>
      <div className="app">
        <AppRouter />
      </div>
    </CartProvider>
  );
}

export default App;
