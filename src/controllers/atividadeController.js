const atividadeModel = require('../models/atividadeModel');
const respostaModel = require('../models/respostaModel');
const usuarioModel = require('../models/usuarioModel');
const { uploadAtividade } = require('../middlewares/uploadMiddleware');

const tiposGestao = new Set(['dono', 'admin', 'adm', 'docente']);
const usuarioId = (req) => req.usuario.id_usuario || req.usuario.id;
const eGestor = (req) => tiposGestao.has(req.usuario.tipo);

function destinadaAoUsuario(atividade, id) {
  if (!atividade.atribuicao || atividade.atribuicao === 'TODOS') return true;
  return Array.isArray(atividade.destinatarios)
    && atividade.destinatarios.map(String).includes(String(id));
}

function validarAtividade(body) {
  const { titulo, questoes = [], status = 'RASCUNHO' } = body;
  if (!titulo || !titulo.trim()) throw new Error('Título da atividade é obrigatório.');
  if (!Array.isArray(questoes) || questoes.length === 0) throw new Error('Adicione ao menos uma questão.');
  if (!['RASCUNHO', 'PUBLICADA', 'ARQUIVADA'].includes(status)) throw new Error('Status da atividade inválido.');
  const atribuicao = body.atribuicao === 'SELECIONADOS' ? 'SELECIONADOS' : 'TODOS';
  const destinatarios = atribuicao === 'SELECIONADOS'
    ? (Array.isArray(body.destinatarios) ? body.destinatarios.map(String).filter(Boolean) : [])
    : [];
  if (atribuicao === 'SELECIONADOS' && destinatarios.length === 0) throw new Error('Selecione ao menos um destinatário.');
  return {
    titulo: titulo.trim(),
    descricao: body.descricao?.trim() || null,
    prazo: body.prazo || null,
    status,
    anexos: Array.isArray(body.anexos) ? body.anexos.filter(Boolean) : [],
    questoes: questoes.map((questao, index) => {
      if (!questao?.enunciado?.trim()) throw new Error(`A questão ${index + 1} precisa de enunciado.`);
      const tipo = questao.tipo || 'DISSERTATIVA';
      if (!['MULTIPLA_ESCOLHA', 'CHECKBOX', 'DISSERTATIVA'].includes(tipo)) throw new Error('Tipo de questão inválido.');
      const opcoes = Array.isArray(questao.opcoes) ? questao.opcoes.map(String).filter(Boolean) : [];
      if (['MULTIPLA_ESCOLHA', 'CHECKBOX'].includes(tipo) && opcoes.length < 2) throw new Error(`A questão ${index + 1} precisa de pelo menos duas opções.`);
      return {
        id: questao.id || `q${index + 1}`,
        enunciado: questao.enunciado.trim(),
        tipo,
        opcoes,
        resposta_correta: questao.resposta_correta ?? null,
        pontos: Number(questao.pontos) || 1
      };
    }),
    atribuicao,
    destinatarios
  };
}

function semGabarito(atividade) {
  return { ...atividade, questoes: atividade.questoes.map(({ resposta_correta, ...questao }) => questao) };
}

function corrigirAutomaticamente(questoes, respostas) {
  let total = 0;
  let obtidos = 0;
  let requerManual = false;
  for (const questao of questoes) {
    const pontos = Number(questao.pontos) || 1;
    total += pontos;
    if (questao.tipo === 'DISSERTATIVA') { requerManual = true; continue; }
    const normalizar = (valor) => Array.isArray(valor) ? [...valor].map(String).sort().join('|') : String(valor ?? '').trim();
    if (normalizar(respostas?.[questao.id]) === normalizar(questao.resposta_correta)) obtidos += pontos;
  }
  return { requerManual, nota: total ? Number(((obtidos / total) * 100).toFixed(2)) : 0, correta: !requerManual && obtidos === total };
}

async function listar(req, res) {
  try {
    if (eGestor(req)) return res.json(await atividadeModel.listarGestao());
    const atividades = await atividadeModel.listarPublicadas();
    const filtradas = atividades.filter((a) => {
      if (!a.atribuicao || a.atribuicao === 'TODOS') return true;
      if (Array.isArray(a.destinatarios) && a.destinatarios.includes(String(req.usuario.id_usuario || req.usuario.id))) return true;
      return false;
    });
    return res.json(filtradas);
  } catch (error) {
    console.error('[ATIVIDADES]', error);
    return res.status(500).json({ message: 'Erro ao listar atividades.' });
  }
}

async function criar(req, res) {
  try {
    const dados = validarAtividade(req.body);
    return res.status(201).json({ atividade: await atividadeModel.criar({ ...dados, criadoPor: usuarioId(req) }) });
  } catch (error) { return res.status(400).json({ message: error.message }); }
}

async function atualizar(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade);
    if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
    if (req.usuario.tipo === 'docente' && Number(atividade.criado_por) !== Number(usuarioId(req))) return res.status(403).json({ message: 'Você só pode editar atividades criadas por você.' });
    return res.json({ atividade: await atividadeModel.atualizar(req.params.idAtividade, validarAtividade(req.body)) });
  } catch (error) { return res.status(400).json({ message: error.message }); }
}

async function uploadImagem(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    const url = `/uploads/atividades/${req.file.filename}`;
    return res.status(201).json({ url, filename: req.file.filename });
  } catch (error) { console.error('[UPLOAD ATIVIDADE]', error); return res.status(500).json({ message: 'Erro ao enviar imagem.' }); }
}

async function responderAtividade(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade || req.body.atividade_id);
    if (!atividade || atividade.status !== 'PUBLICADA') return res.status(404).json({ message: 'Atividade não encontrada ou indisponível.' });
    if (!eGestor(req) && !destinadaAoUsuario(atividade, usuarioId(req))) return res.status(404).json({ message: 'Atividade não encontrada ou indisponível.' });
    const respostas = req.body.respostas || req.body.resposta;
    if (!respostas || typeof respostas !== 'object') return res.status(400).json({ message: 'Preencha as respostas antes de enviar.' });
    const resultado = corrigirAutomaticamente(atividade.questoes, respostas);
    const registro = await respostaModel.registrarResposta(usuarioId(req), atividade.id_atividade, respostas, { correta: resultado.requerManual ? null : resultado.correta, status: resultado.requerManual ? 'ENTREGUE' : 'CORRIGIDA', nota: resultado.requerManual ? null : resultado.nota });
    return res.status(201).json({ message: resultado.requerManual ? 'Atividade enviada para correção.' : 'Atividade corrigida automaticamente.', resultado: { ...registro, nota: resultado.nota } });
  } catch (error) { console.error('[RESPOSTA ATIVIDADE]', error); return res.status(500).json({ message: 'Erro ao enviar atividade.' }); }
}

async function entregas(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade);
    if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
    if (req.usuario.tipo === 'docente' && Number(atividade.criado_por) !== Number(usuarioId(req))) return res.status(403).json({ message: 'Você não pode acessar estas entregas.' });
    return res.json(await respostaModel.listarPorAtividade(atividade.id_atividade));
  } catch (error) { return res.status(500).json({ message: 'Erro ao listar entregas.' }); }
}

async function corrigirEntrega(req, res) {
  try {
    const nota = Number(req.body.nota); if (!Number.isFinite(nota) || nota < 0 || nota > 100) return res.status(400).json({ message: 'A nota deve estar entre 0 e 100.' });
    const resposta = await respostaModel.obterPorId(req.params.idResposta); if (!resposta) return res.status(404).json({ message: 'Entrega não encontrada.' });
    const atividade = await atividadeModel.buscarPorId(resposta.id_atividade);
    if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
    if (req.usuario.tipo === 'docente' && Number(atividade.criado_por) !== Number(usuarioId(req))) return res.status(403).json({ message: 'Você não pode corrigir esta entrega.' });
    return res.json({ resposta: await respostaModel.corrigir(resposta.id_resposta, { nota, feedback: req.body.feedback, corrigidoPor: usuarioId(req) }) });
  } catch (error) {
    console.error('[CORRECAO ATIVIDADE]', error);
    return res.status(500).json({ message: 'Erro ao corrigir entrega.' });
  }
}

async function obter(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade);
    if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
    if (!eGestor(req) && (atividade.status !== 'PUBLICADA' || !destinadaAoUsuario(atividade, usuarioId(req)))) return res.status(404).json({ message: 'Atividade não encontrada.' });
    const resposta = await respostaModel.obterPorAtividadeEUsuario(atividade.id_atividade, usuarioId(req));
    return res.json({ atividade: eGestor(req) ? atividade : semGabarito(atividade), minhaResposta: resposta });
  } catch (error) { return res.status(500).json({ message: 'Erro ao obter atividade.' }); }
}

async function listarAlunos(req, res) {
  try {
    const usuarios = await usuarioModel.listarUsuarios();
    const alunos = usuarios.filter((u) => u.tipo === 'aluno' && u.ativo === 1);
    return res.json(alunos.map((u) => ({ id_usuario: u.id_usuario || u.id, nome: u.nome, email: u.email })));
  } catch (error) {
    console.error('[ATIVIDADES] Erro ao listar alunos:', error);
    return res.status(500).json({ message: 'Erro ao listar alunos.' });
  }
}

module.exports = { listar, criar, atualizar, uploadImagem, responderAtividade, entregas, corrigirEntrega, obter, listarAlunos };
