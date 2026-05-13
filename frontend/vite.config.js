import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://codeverse-backend-05ko.onrender.com',
        changeOrigin: true,
      }
    }
  }
})
