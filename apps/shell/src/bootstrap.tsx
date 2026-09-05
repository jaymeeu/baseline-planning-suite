import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRemotesFromConfig } from './loadRemotes';
import { ShellApp } from './ShellApp';
import './index.css';

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
  const safe = message
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
  // CSS already loaded via this module graph; paint Alert primitive and stop.
  rootElement.innerHTML = `<div class="p-6"><div role="alert" class="bps-alert bps-alert--error"><strong>Shell config error</strong><p class="m-0">${safe}</p><p class="bps-meta m-0 mt-2" style="color:inherit;opacity:0.9">Fix <code>/config.js</code> or remote URL environment variables, then reload.</p></div></div>`;
}

if (configOk) {
  createRoot(rootElement).render(
    <StrictMode>
      <ShellApp />
    </StrictMode>,
  );
}
