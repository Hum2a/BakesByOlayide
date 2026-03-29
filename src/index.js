import './bootstrap/installConsoleSilence';
import './bootstrap/layoutViewportClass';
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
/* Load before App so mobile breakpoints + /collections layout CSS apply on first paint */
import './components/styles/mobile-app-store.css';
import './components/styles/CakePage.css';
import App from './App';
/* Last: overrides that use html.layout-narrow (set by layoutViewportClass before paint) */
import './components/styles/viewport-narrow.css';
import reportWebVitals from './reportWebVitals';
import { HelmetProvider } from 'react-helmet-async';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
