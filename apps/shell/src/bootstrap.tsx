import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ShellApp } from './ShellApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Shell mount failed: #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <ShellApp />
  </StrictMode>,
);
