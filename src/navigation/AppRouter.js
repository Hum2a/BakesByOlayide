import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../components/pages/HomePage';
import CakePage from '../components/pages/CakePage';
import ShoppingBasket from '../components/pages/ShoppingBasket';
import Checkout from '../components/pages/Checkout';
import OrderConfirmation from '../components/pages/OrderConfirmation';
import CartModal from '../components/modals/CartModal';

const AppRouter = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<HomePage onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/cakes" element={<CakePage onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/basket" element={<ShoppingBasket />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          {/* Add more routes here as we create more pages */}
        </Routes>

        {isCartOpen && (
          <CartModal onClose={() => setIsCartOpen(false)} />
        )}
      </div>
    </Router>
  );
};

export default AppRouter; 