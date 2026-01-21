import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [vue()],
  base: mode === 'production' ? '/IOT-Project/' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:5050',
        changeOrigin: true,
      },
    },
  },
}))
