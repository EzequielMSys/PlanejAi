import { defineConfig } from 'vite' 
import react from '@vitejs/plugin-react'
import { execFileSync } from 'node:child_process'

// O GitHub Pages usa /PlanejAi/, enquanto a Vercel publica o frontend na
// raiz do domínio. A variável é provida pela Vercel apenas no ambiente dela.
const isVercelBuild = process.env.VERCEL === '1'
let gitRevision = ''
try { gitRevision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() } catch { /* O provedor pode entregar o código sem .git. */ }
const buildRevision = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || gitRevision
// https://vitejs.dev/config/
export default defineConfig({
  base: isVercelBuild ? '/' : '/PlanejAi/',
  plugins: [react(), {
    name: 'planejai-build-revision',
    transformIndexHtml(html) {
      return buildRevision ? html.replace('</head>', `    <meta name="planejai-revision" content="${buildRevision}">\n  </head>`) : html
    },
  }],
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
