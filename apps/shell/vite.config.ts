import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';

const peopleRemote =
  process.env.PEOPLE_REMOTE_URL ?? 'http://localhost:8081/remoteEntry.js';
const deliveryRemote =
  process.env.DELIVERY_REMOTE_URL ?? 'http://localhost:8082/remoteEntry.js';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    federation({
      name: 'shell',
      remotes: {
        people: {
          type: 'module',
          name: 'people',
          entry: peopleRemote,
        },
        delivery: {
          type: 'module',
          name: 'delivery',
          entry: deliveryRemote,
        },
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.3.1' },
        'react-dom': { singleton: true, requiredVersion: '^18.3.1' },
      },
    }),
  ],
  server: {
    port: 8080,
    strictPort: true,
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
