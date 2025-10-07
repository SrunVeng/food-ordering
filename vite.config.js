import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";
import Restart from 'vite-plugin-restart'


export default defineConfig({
  plugins: [tailwindcss(), react(),
      Restart({
          restart: ['.env', '.env.*', '.env.local']
      })],
})
