import { useMemo } from 'react'
import './WritingRadar.css'

const CONNECTIVES = ['além disso', 'portanto', 'desse modo', 'nesse sentido', 'porém', 'contudo', 'entretanto', 'assim', 'logo', 'dessa forma', 'em primeiro lugar', 'por conseguinte']
const STOP = new Set(['para','como','uma','que','dos','das','com','por','não','seu','sua','mais','esse','essa','isso','são','aos','nas','nos','mas','tem','ser'])

function analyze(text = '') {
  const words = text.toLocaleLowerCase('pt-BR').match(/[a-zà-ÿ]{3,}/gi) || []
  const useful = words.filter((word) => !STOP.has(word))
  const frequencies = useful.reduce((map, word) => map.set(word, (map.get(word) || 0) + 1), new Map())
  const repeated = [...frequencies.entries()].filter(([, count]) => count >= 4).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const lower = text.toLocaleLowerCase('pt-BR')
  const connectives = CONNECTIVES.filter((item) => lower.includes(item))
  const sentences = text.split(/[.!?]+/).map((item) => item.trim()).filter(Boolean)
  const averageSentence = sentences.length ? Math.round(words.length / sentences.length) : 0
  const diversity = useful.length ? Math.round((new Set(useful).size / useful.length) * 100) : 0
  return { repeated, connectives, averageSentence, diversity }
}

export default function WritingRadar({ text }) {
  const result = useMemo(() => analyze(text), [text])
  return <section className="writing-radar">
    <header><b>Radar do rascunho</b><span>ao vivo</span></header>
    <div><article><strong>{result.connectives.length}</strong><small>conectivos diferentes</small></article><article><strong>{result.diversity}%</strong><small>diversidade lexical</small></article><article><strong>{result.averageSentence}</strong><small>palavras por frase</small></article></div>
    {result.repeated.length > 0 && <details><summary>Repetições para revisar</summary><p>{result.repeated.map(([word,count]) => `${word} (${count}×)`).join(' · ')}</p></details>}
    {result.connectives.length < 3 && text.length > 300 && <p className="writing-radar-tip">Experimente conectar as ideias com causa, oposição e conclusão — sem inserir conectivos apenas para preencher.</p>}
  </section>
}
