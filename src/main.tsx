// Entry point — routes between the main app and the share page based on URL.
//
// Why this approach?
// - Single bundle, no extra router needed.
// - The share page is a small client-side route that sets Open Graph meta
//   tags dynamically based on the ?img= query string.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import SharePage from './share';

const isShare = window.location.pathname.startsWith('/s/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isShare ? <SharePage /> : <App />}
  </StrictMode>,
);
