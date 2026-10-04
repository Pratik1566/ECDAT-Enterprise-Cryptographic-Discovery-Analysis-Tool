import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/cbomkit-ws': {
        target: 'ws://localhost:8081',
        ws: true,
        rewrite: (path) => path.replace(/^\/cbomkit-ws/, ''),
        configure: (proxy) => {
          proxy.on('proxyReqWs', (proxyReq) => {
            proxyReq.setHeader('Origin', 'http://localhost:8001');
          });
        },
      },
    }, },
});
