
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
        'process.env.FMP_API_KEY': JSON.stringify(env.FMP_API_KEY || process.env.FMP_API_KEY),
        'process.env.NEWS_CUSTOM_SEARCH_CX': JSON.stringify(env.NEWS_CUSTOM_SEARCH_CX || process.env.NEWS_CUSTOM_SEARCH_CX),
        'process.env.IMAGE_CUSTOM_SEARCH_CX': JSON.stringify(env.IMAGE_CUSTOM_SEARCH_CX || process.env.IMAGE_CUSTOM_SEARCH_CX),
        'process.env.GOOGLEDOTCOM_CUSTOM_SEARCH_CX': JSON.stringify(env.GOOGLEDOTCOM_CUSTOM_SEARCH_CX || process.env.GOOGLEDOTCOM_CUSTOM_SEARCH_CX),
        'process.env.GOOGLE_CUSTOM_SEARCH_API_KEY': JSON.stringify(env.GOOGLE_CUSTOM_SEARCH_API_KEY || process.env.GOOGLE_CUSTOM_SEARCH_API_KEY),
        'process.env.GOOGLE_TTS_API_KEY': JSON.stringify(env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_TTS_API_KEY),
        'process.env.GMAIL_API_KEY': JSON.stringify(env.GMAIL_API_KEY || process.env.GMAIL_API_KEY)
      },
      
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        host: '0.0.0.0',
        port: 5173,
        allowedHosts: ['632adf7a-44e5-40a0-a51a-c17993bb9a8a-00-1x1mnek33hdee.worf.replit.dev', 'signatex.co', 'trading-assistant-stefdgisi.replit.app'],
        hmr: {
          clientPort: 443,
          host: '632adf7a-44e5-40a0-a51a-c17993bb9a8a-00-1x1mnek33hdee.worf.replit.dev'
        },
        proxy: {
          '/api': 'http://localhost:5000'
        }
      },
      preview: {
        host: '0.0.0.0',
        port: 5173,
        open: false,
        cors: true
      }
    };
});
