import { defineConfig } from 'vite' 
import react from '@vitejs/plugin-react'

// O GitHub Pages usa /PlanejAi/, enquanto a Vercel publica o frontend na
// raiz do domínio. A variável é provida pela Vercel apenas no ambiente dela.
const isVercelBuild = process.env.VERCEL === '1'
// https://vitejs.dev/config/
export default defineConfig({
  base: isVercelBuild ? '/' : '/PlanejAi/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react'
          if (id.includes('framer-motion') || id.includes('motion-dom') || id.includes('motion-utils')) return 'motion'
          return undefined
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    headers: {
      'Cache-Control': 'no-store',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  }
})
