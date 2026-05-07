import { Link } from 'react-router-dom'
import logo from '../assets/images/logo.png'

const Landing = () => {
  return (
    <div className="min-h-screen bg-white text-black">

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#9394CF] via-[#7778BD] to-[#4B4C9D] pt-32 pb-20">
        <div className="absolute inset-0 bg-black/20" />

        <div className="absolute top-20 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
        <div className="absolute bottom-20 right-16 w-48 h-48 bg-black/10 rounded-full blur-2xl" />
        <div className="absolute top-40 right-1/4 w-20 h-20 border border-white/30 rounded-full" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white/85 backdrop-blur-md rounded-[3rem] p-10 md:p-14 shadow-2xl border border-white/60">
            
            {/*logo da Planejai*/}
            <div className="mb-8 flex justify-center">
              <img 
                src={logo}
                alt="PlanejAI"
                className="h-100 md:h-80 w-auto drop-shadow-xl hover:scale-105 transition-all duration-300"
              />
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black text-black mb-6 leading-tight tracking-tight">
              Estude com{' '}
              <span className="text-[#4B4C9D]">
                inteligência
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-black/75 max-w-3xl mx-auto mb-12 leading-relaxed">
              Organize sua rotina com cronogramas personalizados, metas claras e acompanhamento inteligente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <Link 
                to="/login"
                className="bg-black text-white text-lg font-bold py-4 px-12 w-full sm:w-auto rounded-full shadow-xl hover:bg-[#4B4C9D] transform hover:-translate-y-1 transition-all duration-300"
              >
                Acessar sistema
              </Link>

              <Link 
                to="/register" 
                className="bg-[#4B4C9D] text-white text-lg font-bold py-4 px-12 w-full sm:w-auto rounded-full shadow-xl hover:bg-black transform hover:-translate-y-1 transition-all duration-300"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-32 bg-[#F7F7FB]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="text-center mb-24">
            <p className="uppercase tracking-[0.35em] text-sm font-black text-[#4B4C9D] mb-4">
              planejamento inteligente
            </p>

            <h2 className="text-4xl md:text-5xl font-black text-black mb-6 tracking-tight">
              Tudo para estudar com{' '}
              <span className="text-[#4B4C9D]">mais organização</span>
            </h2>

            <p className="text-xl text-black/65 max-w-2xl mx-auto">
              O PlanejAI entende seu perfil e transforma sua rotina em um plano de estudos mais claro.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white text-center group hover:scale-[1.02] transition-all duration-300 p-8 rounded-[2rem] shadow-xl border border-[#9394CF]/30">
              <div className="w-20 h-20 bg-[#9394CF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📓</span>
              </div>

              <h3 className="text-2xl font-extrabold text-black mb-4">
                Cronogramas Inteligentes
              </h3>

              <p className="text-black/65 leading-relaxed">
                Organização automática com base no seu tempo disponível e nos seus objetivos.
              </p>
            </div>

            <div className="bg-white text-center group hover:scale-[1.02] transition-all duration-300 p-8 rounded-[2rem] shadow-xl border border-[#9394CF]/30">
              <div className="w-20 h-20 bg-[#9394CF] rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🗓️</span>
              </div>

              <h3 className="text-2xl font-extrabold text-black mb-4">
                Personalização Total
              </h3>

              <p className="text-black/65 leading-relaxed">
                Você informa sua rotina, dificuldades, prioridades e metas de estudo.
              </p>
            </div>

            <div className="bg-white text-center group hover:scale-[1.02] transition-all duration-300 p-8 rounded-[2rem] shadow-xl border border-[#9394CF]/30">
              <div className="w-20 h-20 bg-[#9394CF]  rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">📈</span>
              </div>

              <h3 className="text-2xl font-extrabold text-black mb-4">
                Evolução Contínua
              </h3>

              <p className="text-black/65 leading-relaxed">
                Acompanhe seu progresso e ajuste seus estudos conforme seu desempenho.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}

export default Landing