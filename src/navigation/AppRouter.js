import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../components/pages/HomePage';
import AboutUsPage from '../components/pages/AboutUsPage';
import GuidesPage from '../components/pages/GuidesPage';
import DietaryRequirements from '../components/pages/DietaryRequirements';
import ContactUs from '../components/pages/ContactUs';
import CakePage from '../components/pages/CakePage';
import ShoppingBasket from '../components/pages/ShoppingBasket';
import Checkout from '../components/pages/Checkout';
import OrderConfirmation from '../components/pages/OrderConfirmation';
import CartModal from '../components/modals/CartModal';
import Admin from '../components/pages/Admin';

// Collections
import CupcakeCollectionPage from '../components/widgets/collections/CupcakeCollectionPage';
import LargeCakesCollection from '../components/widgets/collections/LargeCakesCollection';
import BentoCakewithCupcakesCollection from '../components/widgets/collections/BentoCakewithCupcakesCollection';
import BrowniesCollection from '../components/widgets/collections/BrowniesCollection';

const AppRouter = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <Router basename={process.env.PUBLIC_URL}>
        <Routes>
          <Route path="/" element={<HomePage onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/guides/dietary-requirements" element={<DietaryRequirements />} />
          {/* <Route path="/guides/special-occasions" element={<SpecialOccasions />} /> */}
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/cakes" element={<CakePage onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/basket" element={<ShoppingBasket />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/admin" element={<Admin />} />
          {/* Collections */}
          <Route path="/collections/cupcakes" element={<CupcakeCollectionPage />} />
          <Route path="/collections/largecakes" element={<LargeCakesCollection />} />
          <Route path="/collections/bentocakewithcupcakes" element={<BentoCakewithCupcakesCollection />} />
          <Route path="/collections/brownies" element={<BrowniesCollection />} />
        </Routes>

        {isCartOpen && (
          <CartModal onClose={() => setIsCartOpen(false)} />
        )}
    </Router>
  );
};

export default AppRouter; 