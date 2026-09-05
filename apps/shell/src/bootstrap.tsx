import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRemotesFromConfig } from './loadRemotes';
import { ShellApp } from './ShellApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Shell mount failed: #root not found');
}

try {
  registerRemotesFromConfig();
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  rootElement.innerHTML = `<div role="alert" style="font-family:system-ui;padding:1.5rem;color:#8a1f1f"><strong>Shell config error</strong><p>${message}</p></div>`;
  throw err;
}

createRoot(rootElement).render(
  <StrictMode>
    <ShellApp />
  </StrictMode>,
);
