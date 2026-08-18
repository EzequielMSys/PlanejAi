import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')

// Tailwind 3 gera algumas declarações sem copiar a origem do arquivo. Vite 8
// usa essa informação para resolver url() e alerta quando ela está ausente.
const preservarOrigemTailwind = {
  postcssPlugin: 'planejai-preservar-origem-tailwind',
  OnceExit(root) {
    root.walk((node) => {
      if (!node.source?.input?.file) node.source = root.source
    })
  },
}

export default {
  plugins: [tailwindcss(), preservarOrigemTailwind, autoprefixer()],
}
