import { motion } from 'framer-motion'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
}

export default function Cronograma() {
  return (
    <div className="min-h-screen bg-[#F7F7FB] text-black px-4 sm:px-6 lg:px-8 py-10 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-[#9394CF]/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#4B4C9D]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <div className="bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] rounded-[3rem] p-8 sm:p-10 shadow-2xl mb-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-8 left-8 w-24 h-24 bg-white/10 rounded-full blur-xl" />
            <div className="absolute bottom-8 right-8 w-32 h-32 bg-black/10 rounded-full blur-2xl" />

            <div className="relative z-10 text-center">
              <p className="uppercase tracking-[0.35em] text-xs font-black text-white/80 mb-3">
                PlanejAI
              </p>

              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
                Cronograma de Estudos
              </h1>

              <p className="text-lg text-white/85 max-w-2xl mx-auto">
                Organize seus estudos de forma inteligente.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-10 sm:p-12 text-center shadow-2xl border border-[#9394CF]/20">
            <div className="w-24 h-24 rounded-full bg-[#9394CF] mx-auto flex items-center justify-center text-white shadow-xl mb-6">
              <svg className="w-11 h-11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>

            <h2 className="text-3xl font-black text-black mb-3">
              Em breve
            </h2>

            <p className="text-black/60 max-w-md mx-auto leading-relaxed">
              O cronograma inteligente está sendo desenvolvido. Em breve você poderá criar e gerenciar seu plano de estudos personalizado.
            </p>

            <div className="mt-8 flex justify-center">
              <div className="px-6 py-3 rounded-full bg-[#F7F7FB] border border-[#9394CF]/30 text-[#4B4C9D] font-bold shadow-md">
                Planejamento inteligente em desenvolvimento
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}