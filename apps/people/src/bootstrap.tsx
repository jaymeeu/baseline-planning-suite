import { StrictMode } from 'react';
// Ensure react-dom binds to the same shared React before createRoot runs.
import 'react-dom';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('People standalone mount failed: #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
