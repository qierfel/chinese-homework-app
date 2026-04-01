import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: 'all',
    https: {
      key: fs.readFileSync('/Users/lirui/homework-guardian/192.168.100.107+2-key.pem'),
      cert: fs.readFileSync('/Users/lirui/homework-guardian/192.168.100.107+2.pem'),
    },
  },
})
