import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRemotesFromConfig } from './loadRemotes';
import { ShellApp } from './ShellApp';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Shell mount failed: #root not found');
}

let configOk = false;
try {
  registerRemotesFromConfig();
  configOk = true;
} catch (err) {
  const message = err instanceof Error ? err.message : String(err);
  // Paint a stable alert and stop — do not rethrow (avoids blank Vite error overlay).
  rootElement.innerHTML = `<div role="alert" style="font-family:system-ui;padding:1.5rem;color:#8a1f1f"><strong>Shell config error</strong><p>${message}</p></div>`;
}

if (configOk) {
  createRoot(rootElement).render(
    <StrictMode>
      <ShellApp />
    </StrictMode>,
  );
}
