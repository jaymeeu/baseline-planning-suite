import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(fileURLToPath(new URL('.', import.meta.url)), '../..');

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    federation({
      name: 'shell',
      // Remotes registered at runtime from /config.js → window.__BPS_CONFIG__
      remotes: {},
      shared: {
        react: {
          singleton: true,
          requiredVersion: '^18.3.1',
          eager: true,
        },
        'react-dom': {
          singleton: true,
          requiredVersion: '^18.3.1',
          eager: true,
        },
      },
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@bps/contracts': path.join(rootDir, 'packages/contracts/src/index.ts'),
      '@bps/ui': path.join(rootDir, 'packages/ui'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  server: {
    port: 8080,
    strictPort: true,
    fs: { allow: [rootDir] },
  },
  preview: {
    port: 8080,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: false,
  },
});
