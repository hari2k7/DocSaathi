import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        // 127.0.0.1 (not localhost): the backend listens on IPv4 only. Port matches PORT in backend/.env (default 3001)
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
      },
    },
  },
})
