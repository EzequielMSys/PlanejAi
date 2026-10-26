import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import inteligencia from "../services/inteligenciaService";
import perfil from "../services/perfilService";
import memory from '../services/studyMemoryService';
import {currentUser} from '../utils/offlineStore';
const AdaptiveLearningHub = lazy(() => import('../components/AdaptiveLearningHub'));
const LearningPaths = lazy(() => import('../components/LearningPaths'));
import "./PlanejamentoInteligente.css";

export default function PlanejamentoInteligente() {
  const [materias, setMaterias] = useState([]);
  const [params] = useSearchParams();
  const [aba, setAba] = useState(params.get('aba') === 'ferramentas' ? 'ferramentas' : 'metas');
  const [toolsLoaded, setToolsLoaded] = useState(false);
  const [cardVirado, setCardVirado] = useState(null);
  const [questoes, setQuestoes] = useState([]);
  const [respostas, setRespostas] = useState({});
  const [metas, setMetas] = useState([]);
  const [privacidade, setPrivacidade] = useState("RESUMO");
  const [form, setForm] = useState({
    disciplina: "",
    tipo: "QUESTOES",
    alvo: 20,
  });
  const [flashcards, setFlashcards] = useState([]);
  const [focusedCard,setFocusedCard]=useState(null),[focusedError,setFocusedError]=useState(false),[focusedAttempt,setFocusedAttempt]=useState(0);
  const requestedCard=params.get('cartao');
  useEffect(()=>{if(!requestedCard)return;const controller=new window.AbortController(),owner=currentUser();setFocusedCard(null);setFocusedError(false);memory.review(requestedCard,controller.signal).then(value=>{if(!controller.signal.aborted&&owner===currentUser()){if(!value?.id_flashcard)throw Error('invalid');setFocusedCard(value)}}).catch(()=>{if(!controller.signal.aborted&&owner===currentUser())setFocusedError(true)});return()=>controller.abort()},[requestedCard,focusedAttempt]);
  const [flash, setFlash] = useState({ frente: "", verso: "", disciplina: "" });
  const [busca, setBusca] = useState("");
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [provas, setProvas] = useState([]);
  const [prova, setProva] = useState({
    titulo: "",
    dataProva: "",
    materias: [],
  });
  useEffect(() => {
    Promise.allSettled([
      perfil.obterPerfilCompleto(),
      inteligencia.metas(),
      inteligencia.privacidade(),
    ])
      .then(([dados, lista, priv]) => {
        const perfilCarregado = dados.status === "fulfilled" ? dados.value : null;
        const areas = String(perfilCarregado?.perfil?.areas_foco || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        setMaterias(areas);
        setForm((v) => ({ ...v, disciplina: areas[0] || "" }));
        setFlash((v) => ({ ...v, disciplina: areas[0] || "" }));
        setMetas(lista.status === "fulfilled" && Array.isArray(lista.value) ? lista.value : []);
        if (priv.status === "fulfilled") setPrivacidade(priv.value?.visibilidade || "RESUMO");
        if ([dados, lista, priv].some(item => item.status === "rejected")) toast.error("Parte das suas ferramentas não pôde ser carregada.");
      })
      .catch(() => toast.error("Não foi possível carregar seu planejamento."));
  }, []);
  useEffect(() => {
    if (aba !== 'ferramentas' || toolsLoaded) return;
    let active = true;
    Promise.allSettled([inteligencia.flashcards(), inteligencia.provas()]).then(([cards, exams]) => {
      if (!active) return;
      if (cards.status === 'fulfilled' && Array.isArray(cards.value)) setFlashcards(cards.value);
      if (exams.status === 'fulfilled' && Array.isArray(exams.value)) setProvas(exams.value);
      if (cards.status === 'fulfilled' && exams.status === 'fulfilled') setToolsLoaded(true);
      else toast.error('Não foi possível carregar todos os cartões e provas. Reabra esta aba para tentar novamente.');
    });
    return () => { active = false; };
  }, [aba, toolsLoaded]);
  async function iniciarDiagnostico() {
    try {
      const lista = await inteligencia.diagnostico(materias);
      if (!lista.length)
        return toast.error(
          "Não há questões suficientes para as matérias do seu perfil.",
        );
      setQuestoes(lista);
      setRespostas({});
    } catch {
      toast.error("Não foi possível iniciar o diagnóstico.");
    }
  }
  async function concluirDiagnostico() {
    if (Object.keys(respostas).length !== questoes.length)
      return toast.error("Responda todas as questões.");
    try {
      const resultado = await inteligencia.salvarDiagnostico(
        questoes.map((q) => ({
          idQuestao: q.id_questao,
          resposta: respostas[q.id_questao],
        })),
      );
      setQuestoes([]);
      toast.success(`Diagnóstico concluído em ${resultado.length} matéria(s).`);
    } catch {
      toast.error("Não foi possível salvar o diagnóstico.");
    }
  }
  async function salvarMeta(e) {
    e.preventDefault();
    try {
      setMetas(await inteligencia.salvarMeta(form));
      toast.success("Meta por matéria salva.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Meta inválida.");
    }
  }
  async function mudarPrivacidade(valor) {
    try {
      setPrivacidade(
        (await inteligencia.salvarPrivacidade(valor)).visibilidade,
      );
      toast.success("Preferência de privacidade salva.");
    } catch {
      toast.error("Não foi possível salvar a privacidade.");
    }
  }
  async function criarFlash(e) {
    e.preventDefault();
    try {
      setFlashcards(await inteligencia.criarFlashcard(flash));
      setFlash({ frente: "", verso: "", disciplina: materias[0] || "" });
      toast.success("Flashcard criado.");
    } catch {
      toast.error("Preencha frente e verso.");
    }
  }
  async function avaliarFlash(id, resultado) {
    try {
      await inteligencia.avaliarFlashcard(id, resultado);
      setFlashcards((items) => items.filter((item) => item.id_flashcard !== id));
      setFocusedCard(item=>item?.id_flashcard===id?null:item);
      toast.success('Revisão registrada.');
    } catch { toast.error('Não foi possível registrar a revisão. Seu cartão continua aqui.'); }
  }
  async function pesquisar(valor) {
    setBusca(valor);
    if (valor.trim().length < 2) return setResultadosBusca([]);
    try {
      setResultadosBusca(await inteligencia.buscar(valor));
    } catch {
      setResultadosBusca([]);
    }
  }
  async function salvarProva(e) {
    e.preventDefault();
    try {
      setProvas(await inteligencia.criarProva(prova));
      setProva({ titulo: "", dataProva: "", materias: [] });
      toast.success("Prova cadastrada.");
    } catch {
      toast.error("Preencha os dados da prova.");
    }
  }
  const metasConcluidas = metas.filter(meta => Number(meta.progresso || 0) >= Number(meta.alvo || 1)).length;
  const metaEmFoco = metas.find(meta => Number(meta.progresso || 0) < Number(meta.alvo || 1));
  return (
    <main className="intelligence-page progress-page">
      <div className="progress-shell">
        <header className="progress-hero">
          <div><Link to="/aprendizagem">← Voltar para praticar e revisar</Link><span className="progress-eyebrow">APRENDER / FERRAMENTAS DE ESTUDO</span><h1>Prepare o jeito de aprender.</h1><p>Ajuste metas por matéria, organize cartões e explore trilhas. Seu progresso e sua fila de revisões ficam em Praticar e revisar.</p><div className="progress-hero-actions"><button type="button" onClick={() => setAba("metas")}>Ajustar metas por matéria <span aria-hidden="true">→</span></button><Link to="/aprendizagem">Ver meu progresso</Link></div></div>
          <div className="progress-hero-visual" aria-hidden="true"><div><span>CONTINUAR É PROGREDIR</span><strong>{metasConcluidas}<small> / {metas.length}</small></strong><p>metas alcançadas</p><i style={{ width: `${metas.length ? metasConcluidas / metas.length * 100 : 0}%` }} /></div></div>
        </header>
        <section className="progress-snapshot" aria-label="Resumo das ferramentas"><article><span>MATÉRIAS EM FOCO</span><strong>{materias.length}</strong><p>{materias.length ? materias.slice(0, 2).join(' · ') : 'Escolha suas matérias no perfil'}</p></article><article><span>METAS ATIVAS</span><strong>{metas.length}</strong><p>{metaEmFoco ? `${metaEmFoco.disciplina}: ${metaEmFoco.progresso || 0} de ${metaEmFoco.alvo}` : 'Defina um objetivo para começar'}</p></article><article><span>CARTÕES DE MEMÓRIA</span><strong>{toolsLoaded ? flashcards.length : '—'}</strong><p>Consulte seus cartões em Cartões e pesquisa</p></article></section>
        <nav className="progress-tabs" aria-label="Ferramentas de estudo">{[["metas", "Metas e diagnóstico"], ["ferramentas", "Cartões e pesquisa"], ["visao", "Trilhas e recomendações"]].map(([id, label]) => <button key={id} type="button" aria-current={aba === id ? "page" : undefined} onClick={() => setAba(id)}>{label}</button>)}</nav>
        {aba === "visao" && <div className="progress-view"><div className="progress-section-heading"><div><span className="progress-eyebrow">SEU PRÓXIMO PASSO</span><h2>Progresso que vira ação.</h2><p>As recomendações se ajustam conforme você pratica e registra seus estudos.</p></div></div>
        <Suspense fallback={<p role="status">Preparando suas trilhas…</p>}><AdaptiveLearningHub /><LearningPaths /></Suspense>
        <section className="mt-5 flex flex-col items-start justify-between gap-4 rounded-[2rem] border border-[rgb(var(--pn-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 dark:border-[rgb(var(--pn-primaria-borda-rgb)/1)] dark:bg-[rgb(var(--pn-superficie-rgb)/1)] sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.18em] text-[rgb(var(--pn-primaria-rgb)/1)]">Modo Prova Real</p>
            <h2 className="mt-1 text-2xl font-black">Simulados agora têm um espaço próprio.</h2>
            <p className="mt-1 text-sm opacity-65">Monte, retome e corrija provas sem misturar o treino com a configuração do seu plano.</p>
          </div>
          <Link to="/provas" className="shrink-0 rounded-xl bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-5 py-3 text-sm font-black text-white">Abrir provas →</Link>
        </section>
        </div>}
        {aba === "metas" && <div className="progress-view"><div className="progress-section-heading"><div><span className="progress-eyebrow">SEU RITMO</span><h2>Metas que cabem na sua rotina.</h2><p>Faça um diagnóstico curto e acompanhe cada matéria sem perder de vista o que já avançou.</p></div></div>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
            <h2 className="text-xl font-black">Diagnóstico inicial</h2>
            {!questoes.length ? (
              <>
                <p className="mt-2 text-sm opacity-65">
                  Teste curto para ajustar a dificuldade recomendada das suas
                  matérias.
                </p>
                <button
                  onClick={iniciarDiagnostico}
                  className="mt-5 rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-5 py-3 font-black text-white"
                >
                  Iniciar diagnóstico
                </button>
              </>
            ) : (
              <div className="mt-4 space-y-5">
                {questoes.map((q, i) => (
                  <div key={q.id_questao}>
                    <b>
                      {i + 1}. {q.enunciado}
                    </b>
                    <div className="mt-2 grid gap-2">
                      {q.alternativas.map((a, j) => (
                        <button
                          key={a}
                          onClick={() =>
                            setRespostas({ ...respostas, [q.id_questao]: j })
                          }
                          className={`rounded-xl border p-2 text-left text-sm ${respostas[q.id_questao] === j ? "border-[rgb(var(--pn-primaria-borda-rgb)/1)] bg-[rgb(var(--pn-superficie-alt-rgb)/1)]" : ""}`}
                        >
                          {String.fromCharCode(65 + j)}. {a}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={concluirDiagnostico}
                  className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-5 py-3 font-black text-white"
                >
                  Salvar diagnóstico
                </button>
              </div>
            )}
          </article>
          <article className="rounded-[2rem] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
            <h2 className="text-xl font-black">Meta por matéria</h2>
            <form onSubmit={salvarMeta} className="mt-4 grid gap-3">
              <label htmlFor="goal-subject">Matéria</label>
              <select
                id="goal-subject"
                aria-label="Matéria da meta"
                value={form.disciplina}
                onChange={(e) =>
                  setForm({ ...form, disciplina: e.target.value })
                }
              >
                {materias.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <label htmlFor="goal-type">O que você quer praticar?</label>
              <select
                id="goal-type"
                aria-label="Tipo de meta"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="QUESTOES">Questões</option>
                <option value="REDACOES">Redações</option>
                <option value="MINUTOS">Minutos</option>
              </select>
              <label htmlFor="goal-target">Quantidade desejada</label>
              <input
                id="goal-target"
                aria-label="Quantidade desejada para a meta"
                type="number"
                min="1"
                value={form.alvo}
                onChange={(e) => setForm({ ...form, alvo: e.target.value })}
              />
              <button className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-5 py-3 font-black text-white">
                Salvar meta
              </button>
            </form>
            <ul className="progress-goals mt-5 space-y-2 text-sm">
              {metas.map((m) => (
                <li key={`${m.disciplina}-${m.tipo}`}>
                  <div><b>{m.disciplina}</b><span>{m.progresso || 0}/{m.alvo} {String(m.tipo || '').toLowerCase()}</span></div><div className="progress-goal-track" role="progressbar" aria-label={`Meta de ${m.disciplina}`} aria-valuemin="0" aria-valuemax={Number(m.alvo) || 1} aria-valuenow={Math.min(Number(m.progresso) || 0, Number(m.alvo) || 1)}><i style={{ width: `${Math.min(100, Math.max(0, (Number(m.progresso) || 0) / (Number(m.alvo) || 1) * 100))}%` }} /></div><small>{Number(m.progresso || 0) >= Number(m.alvo || 1) ? 'Meta alcançada' : `Sugestão: ${m.sugestaoDiaria || 0} por dia`}</small>
                </li>
              ))}
            </ul>
          </article>
        </section>
        </div>}
        {aba === "ferramentas" && <div className="progress-view"><div className="progress-section-heading"><div><span className="progress-eyebrow">APOIO AO ESTUDO</span><h2>Organize, encontre e revise.</h2><p>Guarde datas importantes e transforme o que estudou em perguntas para recordar depois.</p></div></div><div className="progress-search"><label htmlFor="progress-search-input">Buscar no seu estudo</label><input id="progress-search-input" value={busca} onChange={(e) => pesquisar(e.target.value)} placeholder="Conteúdo, questão ou flashcard" />{resultadosBusca.length > 0 && <ul>{resultadosBusca.map(item => <li key={`${item.tipo}-${item.id}`}>{item.tipo} · {item.disciplina}: {item.titulo}</li>)}</ul>}</div>
        <section className="mt-5 rounded-[2rem] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
          <h2 className="text-xl font-black">Provas e vestibulares</h2>
          <form onSubmit={salvarProva} className="mt-3 grid gap-2 sm:grid-cols-4">
            <input value={prova.titulo} onChange={(e) => setProva({ ...prova, titulo: e.target.value })} placeholder="Nome da prova" />
            <input type="date" aria-label="Data da prova" value={prova.dataProva} onChange={(e) => setProva({ ...prova, dataProva: e.target.value })} />
            <select multiple aria-label="Matérias da prova" value={prova.materias.map((m) => m.disciplina)} onChange={(e) => setProva({ ...prova, materias: [...e.target.selectedOptions].map((o) => ({ disciplina: o.value, peso: prova.materias.find((m) => m.disciplina === o.value)?.peso || 1 })) })}>{materias.map((m) => <option key={m}>{m}</option>)}</select>
            <button className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-4 py-2 font-bold text-white">Adicionar prova</button>
          </form>
          {provas.map((item) => <p key={item.id_prova} className="mt-3 text-sm"><b>{item.titulo}</b> · {String(item.data_prova).slice(0, 10)} · {(item.materias || []).map((m) => m.disciplina || m).join(', ')}</p>)}
          {prova.materias.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{prova.materias.map((materia, indice) => <label key={materia.disciplina} className="text-sm">{materia.disciplina} peso <input type="number" min="1" max="10" value={materia.peso} onChange={(e) => setProva({ ...prova, materias: prova.materias.map((m, i) => i === indice ? { ...m, peso: Number(e.target.value) || 1 } : m) })} className="ml-1 w-14" /></label>)}</div>}
        </section>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
            <h2 className="text-xl font-black">Flashcards</h2>
            <form onSubmit={criarFlash} className="mt-3 grid gap-2">
              <input
                value={flash.frente}
                onChange={(e) => setFlash({ ...flash, frente: e.target.value })}
                placeholder="Pergunta"
              />
              <textarea
                value={flash.verso}
                onChange={(e) => setFlash({ ...flash, verso: e.target.value })}
                placeholder="Resposta"
              />
              <button className="rounded-full bg-[rgb(var(--pn-primaria-forte-rgb)/1)] px-4 py-2 font-bold text-white">
                Criar flashcard
              </button>
            </form>
            {focusedError&&<p role="alert">Não foi possível abrir o cartão escolhido. <button type="button" onClick={()=>setFocusedAttempt(value=>value+1)}>Consultar cartão novamente</button></p>}
            {(focusedCard?[focusedCard,...flashcards.filter(item=>item.id_flashcard!==focusedCard.id_flashcard)].slice(0,5):flashcards.slice(0,5)).map((card) => (
              <div
                key={card.id_flashcard}
                className="mt-3 rounded-xl border p-3"
              >
                <b>{card.frente}</b>
                {card.fonte_titulo&&<details><summary>Trecho que originou esta pergunta</summary><p>{card.fonte_titulo} · {card.fonte_secao}</p><blockquote>{card.fonte_trecho}</blockquote></details>}
                <button type="button" className="progress-flash-reveal" aria-expanded={cardVirado === card.id_flashcard} onClick={() => setCardVirado(cardVirado === card.id_flashcard ? null : card.id_flashcard)}>{cardVirado === card.id_flashcard ? "Ocultar resposta" : "Revelar resposta"}</button>
                {cardVirado === card.id_flashcard && <p className="mt-1 text-sm">{card.verso}</p>}
                {cardVirado === card.id_flashcard && <div className="mt-2 flex gap-2">
                  {[
                    ["ERREI", "Errei"],
                    ["LEMBREI", "Lembrei"],
                    ["DOMINEI", "Dominei"],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => avaliarFlash(card.id_flashcard, id)}
                      className="text-xs underline"
                    >
                      {label}
                    </button>
                  ))}
                </div>}
              </div>
            ))}
          </article>
          <section className="rounded-[2rem] bg-[rgb(var(--pn-superficie-rgb)/1)] p-6 dark:bg-[rgb(var(--pn-superficie-rgb)/1)]">
            <h2 className="text-xl font-black">Privacidade pedagógica</h2>
            <p className="mt-1 text-sm opacity-65">
              Você escolhe o nível de informação disponível para gestores.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["RESUMO", "Somente resumo"],
                ["DETALHADO", "Detalhado"],
                ["PRIVADO", "Privado"],
              ].map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => mudarPrivacidade(id)}
                  className={`rounded-full border px-4 py-2 font-bold ${privacidade === id ? "bg-[rgb(var(--pn-primaria-forte-rgb)/1)] text-white" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </section>
        </div>}
      </div>
    </main>
  );
}
