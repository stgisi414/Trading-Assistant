import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  define: {
    'process.env.GOOGLE_TTS_API_KEY': JSON.stringify(process.env.GOOGLE_TTS_API_KEY),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
    'process.env.FMP_API_KEY': JSON.stringify(process.env.FMP_API_KEY),
    'process.env.NEWS_CUSTOM_SEARCH_CX': JSON.stringify(process.env.NEWS_CUSTOM_SEARCH_CX),
    'process.env.GOOGLE_CUSTOM_SEARCH_API_KEY': JSON.stringify(process.env.GOOGLE_CUSTOM_SEARCH_API_KEY),
    'process.env.IMAGE_CUSTOM_SEARCH_CX': JSON.stringify(process.env.IMAGE_CUSTOM_SEARCH_CX),
    'process.env.GOOGLEDOTCOM_CUSTOM_SEARCH_CX': JSON.stringify(process.env.GOOGLEDOTCOM_CUSTOM_SEARCH_CX)
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000'
    },
    allowedHosts: [
      'd68f20ac-76f0-436f-a3dd-99c21f05ab26-00-1d3z3kk8shxff.janeway.replit.dev'
    ] 
  },
})