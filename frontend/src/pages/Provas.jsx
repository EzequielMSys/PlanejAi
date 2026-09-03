import { useNavigate } from 'react-router-dom'
import ExamArena from '../components/ExamArena'
import { Button, PageHeader, StatCard } from '../components/ui/PlanejUI'
import './Provas.css'

export default function Provas() {
  const navigate = useNavigate()

  return (
    <main className="pj-page exams-page">
      <div className="pj-wrap">
        <PageHeader
          eyebrow="Modo Prova Real"
          title="Treine como se fosse o dia da prova."
          description="Escolha uma coleção, calibre a dificuldade e continue a tentativa em qualquer computador. Cada resposta vira evidência para o seu planejamento."
          icon="A+"
          actions={<Button variant="secondary" onClick={() => navigate('/planejamento-inteligente')}>Ver estratégia</Button>}
        />

        <section className="exam-value-grid" aria-label="Recursos do modo prova">
          <StatCard label="Tentativa" value="Salva" detail="Progresso sincronizado com sua conta" />
          <StatCard label="Correção" value="Imediata" detail="Explicação questão por questão" tone="strong" />
          <StatCard label="Catálogo" value="Autoral" detail="Origem e referência sempre identificadas" />
        </section>

        <ExamArena />
      </div>
    </main>
  )
}
