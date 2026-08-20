import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const postcss = require('postcss')
const tailwindcss = require('tailwindcss')
const autoprefixer = require('autoprefixer')

// Tailwind 3 gera algumas declarações sem copiar a origem do arquivo. O Vite
// usa essa informação para resolver url(); este plugin precisa rodar antes do
// reescritor de URLs do Vite, por isso usa `Once`, e não `OnceExit`.
const preservarOrigemTailwind = {
  postcssPlugin: 'planejai-preservar-origem-tailwind',
  Once(root) {
    root.walk((node) => {
      if (!node.source?.input?.file) node.source = root.source
    })
  },
}

export default {
  plugins: [tailwindcss(), preservarOrigemTailwind, autoprefixer()],
}
