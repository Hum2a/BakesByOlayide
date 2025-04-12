import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from '../components/pages/HomePage';
import CakePage from '../components/pages/CakePage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cakes" element={<CakePage />} />
        {/* Add more routes here as we create more pages */}
      </Routes>
    </Router>
  );
};

export default AppRouter; 