import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import inteligencia from "../services/inteligenciaService";
import perfil from "../services/perfilService";
import AdaptiveLearningHub from "../components/AdaptiveLearningHub";
import LearningPaths from "../components/LearningPaths";
import ExamArena from "../components/ExamArena";

export default function PlanejamentoInteligente() {
  const [materias, setMaterias] = useState([]);
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
    Promise.all([
      perfil.obterPerfilCompleto(),
      inteligencia.metas(),
      inteligencia.privacidade(),
      inteligencia.flashcards(),
      inteligencia.provas(),
    ])
      .then(([dados, lista, priv, cards, listaProvas]) => {
        const areas = String(dados.perfil?.areas_foco || "")
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);
        setMaterias(areas);
        setForm((v) => ({ ...v, disciplina: areas[0] || "" }));
        setFlash((v) => ({ ...v, disciplina: areas[0] || "" }));
        setMetas(lista);
        setPrivacidade(priv.visibilidade);
        setFlashcards(cards);
        setProvas(listaProvas);
      })
      .catch(() => toast.error("Não foi possível carregar seu planejamento."));
  }, []);
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
    await inteligencia.avaliarFlashcard(id, resultado);
    setFlashcards((items) => items.filter((item) => item.id_flashcard !== id));
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
  return (
    <main className="intelligence-page min-h-screen bg-[#F7F4FA] px-4 py-7 text-[#21162F] dark:bg-[#120E18] dark:text-white sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-[2rem] bg-[#241A34] p-7 text-white">
          <p className="text-xs font-black uppercase tracking-[.2em] text-[#CBB3FF]">
            Planejamento inteligente
          </p>
          <h1 className="mt-2 text-4xl font-black">Estude com evidências.</h1>
          <input
            value={busca}
            onChange={(e) => pesquisar(e.target.value)}
            placeholder="Buscar conteúdo, questão ou flashcard"
            className="mt-5 w-full rounded-xl p-3 text-black"
          />
          {resultadosBusca.map((item) => (
            <p key={`${item.tipo}-${item.id}`} className="mt-2 text-sm">
              {item.tipo} · {item.disciplina}: {item.titulo}
            </p>
          ))}
        </header>
        <AdaptiveLearningHub />
        <LearningPaths />
        <ExamArena />
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-6 dark:bg-[#211A2D]">
            <h2 className="text-xl font-black">Diagnóstico inicial</h2>
            {!questoes.length ? (
              <>
                <p className="mt-2 text-sm opacity-65">
                  Teste curto para ajustar a dificuldade recomendada das suas
                  matérias.
                </p>
                <button
                  onClick={iniciarDiagnostico}
                  className="mt-5 rounded-full bg-[#6D3EC5] px-5 py-3 font-black text-white"
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
                          className={`rounded-xl border p-2 text-left text-sm ${respostas[q.id_questao] === j ? "border-[#6D3EC5] bg-[#F0E8FA]" : ""}`}
                        >
                          {String.fromCharCode(65 + j)}. {a}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={concluirDiagnostico}
                  className="rounded-full bg-[#6D3EC5] px-5 py-3 font-black text-white"
                >
                  Salvar diagnóstico
                </button>
              </div>
            )}
          </article>
          <article className="rounded-[2rem] bg-white p-6 dark:bg-[#211A2D]">
            <h2 className="text-xl font-black">Meta por matéria</h2>
            <form onSubmit={salvarMeta} className="mt-4 grid gap-3">
              <select
                value={form.disciplina}
                onChange={(e) =>
                  setForm({ ...form, disciplina: e.target.value })
                }
              >
                {materias.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
              >
                <option value="QUESTOES">Questões</option>
                <option value="REDACOES">Redações</option>
                <option value="MINUTOS">Minutos</option>
              </select>
              <input
                type="number"
                min="1"
                value={form.alvo}
                onChange={(e) => setForm({ ...form, alvo: e.target.value })}
              />
              <button className="rounded-full bg-[#6D3EC5] px-5 py-3 font-black text-white">
                Salvar meta
              </button>
            </form>
            <ul className="mt-5 space-y-2 text-sm">
              {metas.map((m) => (
                <li key={`${m.disciplina}-${m.tipo}`}>
                  <b>{m.disciplina}</b>: {m.progresso || 0}/{m.alvo} {m.tipo.toLowerCase()} · sugestão {m.sugestaoDiaria || 0}/dia
                </li>
              ))}
            </ul>
          </article>
        </section>
        <section className="mt-5 rounded-[2rem] bg-white p-6 dark:bg-[#211A2D]">
          <h2 className="text-xl font-black">Provas e vestibulares</h2>
          <form onSubmit={salvarProva} className="mt-3 grid gap-2 sm:grid-cols-4">
            <input value={prova.titulo} onChange={(e) => setProva({ ...prova, titulo: e.target.value })} placeholder="Nome da prova" />
            <input type="date" value={prova.dataProva} onChange={(e) => setProva({ ...prova, dataProva: e.target.value })} />
            <select multiple value={prova.materias.map((m) => m.disciplina)} onChange={(e) => setProva({ ...prova, materias: [...e.target.selectedOptions].map((o) => ({ disciplina: o.value, peso: prova.materias.find((m) => m.disciplina === o.value)?.peso || 1 })) })}>{materias.map((m) => <option key={m}>{m}</option>)}</select>
            <button className="rounded-full bg-[#6D3EC5] px-4 py-2 font-bold text-white">Adicionar prova</button>
          </form>
          {provas.map((item) => <p key={item.id_prova} className="mt-3 text-sm"><b>{item.titulo}</b> · {String(item.data_prova).slice(0, 10)} · {item.materias.map((m) => m.disciplina || m).join(', ')}</p>)}
          {prova.materias.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{prova.materias.map((materia, indice) => <label key={materia.disciplina} className="text-sm">{materia.disciplina} peso <input type="number" min="1" max="10" value={materia.peso} onChange={(e) => setProva({ ...prova, materias: prova.materias.map((m, i) => i === indice ? { ...m, peso: Number(e.target.value) || 1 } : m) })} className="ml-1 w-14" /></label>)}</div>}
        </section>
        <section className="mt-5 grid gap-5 lg:grid-cols-2">
          <article className="rounded-[2rem] bg-white p-6 dark:bg-[#211A2D]">
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
              <button className="rounded-full bg-[#6D3EC5] px-4 py-2 font-bold text-white">
                Criar flashcard
              </button>
            </form>
            {flashcards.slice(0, 5).map((card) => (
              <div
                key={card.id_flashcard}
                className="mt-3 rounded-xl border p-3"
              >
                <b>{card.frente}</b>
                <p className="mt-1 text-sm">{card.verso}</p>
                <div className="mt-2 flex gap-2">
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
                </div>
              </div>
            ))}
          </article>
          <section className="rounded-[2rem] bg-white p-6 dark:bg-[#211A2D]">
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
                  className={`rounded-full border px-4 py-2 font-bold ${privacidade === id ? "bg-[#6D3EC5] text-white" : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
