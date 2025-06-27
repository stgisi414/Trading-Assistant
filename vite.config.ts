
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
        'process.env.FMP_API_KEY': JSON.stringify(env.FMP_API_KEY || process.env.FMP_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: true,
        port: 5173,
        allowedHosts: ['632adf7a-44e5-40a0-a51a-c17993bb9a8a-00-1x1mnek33hdee.worf.replit.dev', 'signetex.co']
      },
      preview: {
        host: '0.0.0.0',
        port: 5173
      }
    };
});
