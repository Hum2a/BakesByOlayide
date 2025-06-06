// --- React & Router ---
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// --- General Pages ---
import HomePage from '../components/pages/HomePage';
import AboutUsPage from '../components/pages/AboutUsPage';
import ContactUs from '../components/pages/ContactUs';
import FAQ from '../components/pages/FAQ';
import TermsAndConditions from '../components/pages/TermsAndConditions';

// --- Guides ---
import GuidesPage from '../components/pages/GuidesPage';
import DietaryRequirements from '../components/pages/guides/DietaryRequirements';
import PricingGuide from '../components/pages/guides/PricingGuide';
import SpecialOccasion from '../components/pages/guides/SpecialOccasion';
import SizingGuide from '../components/pages/guides/SizingGuide';

// --- Cakes ---
import CakePage from '../components/pages/CakePage';
import SpecificCakePage from '../components/widgets/productpages/SpecificCakePage';
import SpecificCupcakePage from '../components/widgets/productpages/SpecificCupcakePage';
import SpecificBentoCakePage from '../components/widgets/productpages/SpecificBentoCakePage';
import SpecificBrowniesPage from '../components/widgets/productpages/SpecificBrowniesPage';
import SpecificCookiesPage from '../components/widgets/productpages/SpecificCookiesPage';

// --- Cake Collections ---
import CupcakeCollectionPage from '../components/widgets/collections/CupcakeCollectionPage';
import LargeCakesCollection from '../components/widgets/collections/LargeCakesCollection';
import BentoCakewithCupcakesCollection from '../components/widgets/collections/BentoCakewithCupcakesCollection';
import BrowniesCollection from '../components/widgets/collections/BrowniesCollection';
import CookiesCollection from '../components/widgets/collections/CookiesCollection';
import GlutenFreeCollection from '../components/widgets/collections/GlutenFreeCollection';
import SubscriptionBoxesCollection from '../components/widgets/collections/SubscriptionBoxesCollection';
import VeganRangeCollection from '../components/widgets/collections/VeganRangeCollection';

// --- Shopping & Orders ---
import ShoppingBasket from '../components/pages/ShoppingBasket';
import Checkout from '../components/pages/Checkout';
import OrderConfirmation from '../components/pages/OrderConfirmation';

// --- Modals ---
import CartModal from '../components/modals/CartModal';

// --- Admin ---
import Admin from '../components/pages/Admin';

const AppRouter = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <Router basename={process.env.PUBLIC_URL}>
        <Routes>
          {/* --- General Pages --- */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<HomePage onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/faqs" element={<FAQ />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

          {/* --- Guides --- */}
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/dietary-requirements" element={<DietaryRequirements />} />
          <Route path="/guides/pricing" element={<PricingGuide />} />
          <Route path="/guides/special-occasions" element={<SpecialOccasion />} />
          <Route path="/guides/sizing-guide" element={<SizingGuide />} />
          
          {/* --- Cakes & Collections --- */}
          <Route path="/collections" element={<CakePage onOpenCart={() => setIsCartOpen(true)} />} />
          <Route path="/collections/cakes/:id" element={<SpecificCakePage />} />
          <Route path="/collections/cupcakes/:id" element={<SpecificCupcakePage />} />
          <Route path="/collections/bento-cakes/:id" element={<SpecificBentoCakePage />} />
          <Route path="/collections/brownies/:id" element={<SpecificBrowniesPage />} />
          <Route path="/collections/cookies/:id" element={<SpecificCookiesPage />} />

          {/* --- Cake Collections --- */}
          <Route path="/collections/cupcakes" element={<CupcakeCollectionPage />} />
          <Route path="/collections/large-cakes" element={<LargeCakesCollection />} />
          <Route path="/collections/bento-cake-with-cupcakes" element={<BentoCakewithCupcakesCollection />} />
          <Route path="/collections/brownies" element={<BrowniesCollection />} />
          <Route path="/collections/cookies" element={<CookiesCollection />} />
          <Route path="/collections/gluten-free" element={<GlutenFreeCollection />} />
          <Route path="/collections/subscription-boxes" element={<SubscriptionBoxesCollection />} />
          <Route path="/collections/vegan-range" element={<VeganRangeCollection />} />

          {/* --- Shopping & Orders --- */}
          <Route path="/basket" element={<ShoppingBasket />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />

          {/* --- Admin --- */}
          <Route path="/admin" element={<Admin />} />
        </Routes>

        {isCartOpen && (
          <CartModal onClose={() => setIsCartOpen(false)} />
        )}
    </Router>
  );
};

export default AppRouter; 