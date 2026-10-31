import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The app calls the TradeLab microservices directly (see src/config/services.js):
// Stock Service on :8081 and User Service on :8082. Each one allows this dev server through CORS.
export default defineConfig({
  plugins: [react()],
})
