import { motion } from 'framer-motion'

/**
 * Marca do PlanejAI — "Atlas".
 *
 * A metáfora é o conhecimento como território: uma bússola apoiada sobre um
 * mapa, com a rota pontilhada ligando o ponto de partida ao destino. A
 * agulha aponta o norte (o próximo passo) e o mapa representa tudo o que ainda
 * falta explorar.
 *
 * Usa apenas os tokens --pn-*, então acompanha a cor escolhida pelo usuário sem
 * precisar de variantes. O `id` do gradiente é único por instância: dois SVGs
 * com o mesmo id fariam o segundo reaproveitar o gradiente do primeiro.
 */
export default function Logo({ className = 'w-9 h-9', title = 'PlanejAI', animado = true }) {
  const id = `pn-atlas-${title.replace(/\W+/g, '')}-${Math.random().toString(36).slice(2, 7)}`

  return (
    <motion.svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label={title}
      whileHover={animado ? { rotate: -6, scale: 1.06 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
    >
      <defs>
        <linearGradient id={id} x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--pn-primaria)" />
          <stop offset="1" stopColor="var(--pn-primaria-hover)" />
        </linearGradient>
      </defs>

      {/* Disco do mapa */}
      <circle cx="24" cy="24" r="20" fill={`url(#${id})`} />

      {/* Linha do horizonte e o meridiano: dá leitura de "mapa" */}
      <g stroke="var(--pn-superficie)" strokeWidth="1.3" opacity=".38" strokeLinecap="round" fill="none">
        <path d="M6 24h36" />
        <path d="M24 5.5c6 6 6 31 0 37" />
        <path d="M24 5.5c-6 6-6 31 0 37" />
      </g>

      {/* Rota: a linha pontilhada do início ao destino */}
      <path
        d="M14 32c4-9 10-9 14-14s6-2 7-2"
        fill="none"
        stroke="var(--pn-superficie)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="3 3.5"
        opacity=".75"
        className={animado ? 'pn-tracar' : undefined}
      />

      {/* Agulha da bússola, apontando o norte */}
      <path d="M24 10.5 28.4 25 24 22.2 19.6 25Z" fill="var(--pn-superficie)" />

      {/* Centro da bússola */}
      <circle cx="24" cy="24" r="2.6" fill="var(--pn-primaria)" />
      <circle cx="24" cy="24" r="1" fill="var(--pn-superficie)" />

      {/* Origem: onde o estudo começa */}
      <circle cx="13" cy="33" r="2.4" fill="var(--pn-superficie)" fillOpacity=".9" />
    </motion.svg>
  )
}
