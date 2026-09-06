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
      name: 'people',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.tsx',
      },
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
      '@bps/domain': path.join(rootDir, 'packages/domain/src/index.ts'),
      '@bps/data': path.join(rootDir, 'packages/data/src/index.ts'),
      '@bps/contracts': path.join(rootDir, 'packages/contracts/src/index.ts'),
      '@bps/ui': path.join(rootDir, 'packages/ui'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client'],
  },
  server: {
    port: 8081,
    strictPort: true,
    origin: 'http://localhost:8081',
    fs: { allow: [rootDir] },
  },
  preview: {
    port: 8081,
    strictPort: true,
  },
  build: {
    target: 'esnext',
    modulePreload: false,
    minify: false,
    cssCodeSplit: false,
  },
});
