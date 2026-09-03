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
      if (!['MULTIPLA_ESCOLHA', 'CHECKBOX', 'DISSERTATIVA', 'RESPOSTA_CURTA', 'ORDENACAO', 'ASSOCIACAO', 'ARQUIVO'].includes(tipo)) throw new Error('Tipo de questão inválido.');
      const opcoes = Array.isArray(questao.opcoes) ? questao.opcoes.map(String).filter(Boolean) : [];
      if (['MULTIPLA_ESCOLHA', 'CHECKBOX', 'ORDENACAO'].includes(tipo) && opcoes.length < 2) throw new Error(`A questão ${index + 1} precisa de pelo menos duas opções.`);
      const gabarito = questao.resposta_correta;
      if (tipo === 'MULTIPLA_ESCOLHA' && !opcoes.includes(String(gabarito ?? ''))) throw new Error(`Selecione uma opção válida como gabarito na questão ${index + 1}.`);
      if (tipo === 'CHECKBOX' && (!Array.isArray(gabarito) || !gabarito.length || gabarito.some((valor) => !opcoes.includes(String(valor))))) throw new Error(`Selecione uma ou mais opções válidas como gabarito na questão ${index + 1}.`);
      const pares = Array.isArray(questao.pares) ? questao.pares.map((par) => ({ esquerda: String(par.esquerda || '').trim(), direita: String(par.direita || '').trim() })).filter((par) => par.esquerda && par.direita) : [];
      if (tipo === 'ASSOCIACAO' && pares.length < 2) throw new Error(`A questão ${index + 1} precisa de pelo menos dois pares.`);
      return {
        id: questao.id || `q${index + 1}`,
        enunciado: questao.enunciado.trim(),
        tipo,
        opcoes,
        pares,
        resposta_correta: tipo === 'ORDENACAO' ? opcoes : tipo === 'ASSOCIACAO' ? Object.fromEntries(pares.map((par) => [par.esquerda, par.direita])) : questao.resposta_correta ?? null,
        pontos: Math.max(0.25, Number(questao.pontos) || 1),
        disciplina: String(questao.disciplina || '').trim() || null,
        dificuldade: ['FACIL', 'MEDIA', 'DIFICIL'].includes(questao.dificuldade) ? questao.dificuldade : 'MEDIA',
        explicacao: String(questao.explicacao || '').trim() || null,
        rubrica: Array.isArray(questao.rubrica) ? questao.rubrica.filter(Boolean) : []
      };
    }),
    atribuicao,
    destinatarios,
    rubrica: Array.isArray(body.rubrica) ? body.rubrica.filter(Boolean) : [],
    publicarEm: body.publicarEm || null,
    permiteReenvio: Boolean(body.permiteReenvio)
  };
}

function semGabarito({ rascunho, rascunho_conteudo, ...atividade }) {
  const embaralhar = (itens) => [...itens].sort(() => Math.random() - 0.5);
  return { ...atividade, questoes: atividade.questoes.map(({ resposta_correta, ...questao }) => {
    if (questao.tipo === 'ORDENACAO') return { ...questao, opcoes: embaralhar(questao.opcoes || []) };
    if (questao.tipo === 'ASSOCIACAO') return { ...questao, itensEsquerda: (questao.pares || []).map((par) => par.esquerda), itensDireita: embaralhar((questao.pares || []).map((par) => par.direita)), pares: undefined };
    return questao;
  }) };
}

function corrigirAutomaticamente(questoes, respostas) {
  let total = 0;
  let obtidos = 0;
  let requerManual = false;
  const detalhes = [];
  for (const questao of questoes) {
    const pontos = Number(questao.pontos) || 1;
    total += pontos;
    if (['DISSERTATIVA', 'RESPOSTA_CURTA', 'ARQUIVO'].includes(questao.tipo)) { requerManual = true; detalhes.push({ idQuestao: questao.id, tipo: questao.tipo, pontos, status: 'AGUARDA_CORRECAO' }); continue; }
    const normalizar = (valor, preservarOrdem = false) => {
      if (valor && typeof valor === 'object' && !Array.isArray(valor)) return JSON.stringify(Object.fromEntries(Object.entries(valor).sort(([a], [b]) => a.localeCompare(b))))
      if (Array.isArray(valor)) { const itens = [...valor].map(String); return (preservarOrdem ? itens : itens.sort()).join('|'); }
      return String(valor ?? '').trim()
    };
    const acertou = normalizar(respostas?.[questao.id], questao.tipo === 'ORDENACAO') === normalizar(questao.resposta_correta, questao.tipo === 'ORDENACAO');
    if (acertou) obtidos += pontos;
    detalhes.push({ idQuestao: questao.id, tipo: questao.tipo, pontos, pontosObtidos: acertou ? pontos : 0, acertou, explicacao: questao.explicacao || null });
  }
  return { requerManual, nota: total ? Number(((obtidos / total) * 100).toFixed(2)) : 0, correta: !requerManual && obtidos === total, detalhes, pontosAutomaticos: obtidos, pontosTotais: total };
}

async function listar(req, res) {
  try {
    if (eGestor(req)) return res.json(await atividadeModel.listarGestao(req.usuario.tipo === 'docente' ? usuarioId(req) : null));
    const atividades = await atividadeModel.listarPublicadas(usuarioId(req));
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

async function autosalvar(req, res) {
  try {
    const id = req.params.idAtividade && req.params.idAtividade !== 'novo' ? Number(req.params.idAtividade) : null;
    if (id) {
      const atividade = await atividadeModel.buscarPorId(id);
      if (!atividade) return res.status(404).json({ message: 'Rascunho não encontrado.' });
      if (req.usuario.tipo === 'docente' && Number(atividade.criado_por) !== Number(usuarioId(req))) return res.status(403).json({ message: 'Você só pode editar seus rascunhos.' });
    }
    const atividade = await atividadeModel.autosalvarRascunho(id, req.body, id ? (await atividadeModel.buscarPorId(id)).criado_por : usuarioId(req));
    return res.json({ atividade, salvoEm: new Date().toISOString() });
  } catch (error) { return res.status(400).json({ message: error.message || 'Não foi possível salvar o rascunho.' }); }
}

async function atualizar(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade);
    if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
    if (req.usuario.tipo === 'docente' && Number(atividade.criado_por) !== Number(usuarioId(req))) return res.status(403).json({ message: 'Você só pode editar atividades criadas por você.' });
    return res.json({ atividade: await atividadeModel.atualizar(req.params.idAtividade, validarAtividade(req.body), usuarioId(req)) });
  } catch (error) { return res.status(400).json({ message: error.message }); }
}

async function uploadImagem(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    const url = `/uploads/atividades/${req.file.filename}`;
    return res.status(201).json({ url, filename: req.file.filename });
  } catch (error) { console.error('[UPLOAD ATIVIDADE]', error); return res.status(500).json({ message: 'Erro ao enviar imagem.' }); }
}

async function uploadResposta(req, res) {
  try {
    if (!req.file) return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
    return res.status(201).json({ url: `/uploads/atividades/${req.file.filename}`, nome: req.file.originalname, tipo: req.file.mimetype });
  } catch (error) { console.error('[UPLOAD RESPOSTA]', error); return res.status(500).json({ message: 'Erro ao enviar o arquivo da resposta.' }); }
}

async function responderAtividade(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade || req.body.atividade_id);
    if (!atividade || atividade.status !== 'PUBLICADA') return res.status(404).json({ message: 'Atividade não encontrada ou indisponível.' });
    if (!eGestor(req) && !destinadaAoUsuario(atividade, usuarioId(req))) return res.status(404).json({ message: 'Atividade não encontrada ou indisponível.' });
    const respostas = req.body.respostas || req.body.resposta;
    if (!respostas || typeof respostas !== 'object') return res.status(400).json({ message: 'Preencha as respostas antes de enviar.' });
    const anterior = await respostaModel.obterPorAtividadeEUsuario(atividade.id_atividade, usuarioId(req));
    if (anterior && anterior.status !== 'RASCUNHO' && !atividade.permite_reenvio) return res.status(409).json({ message: 'Esta atividade já foi entregue.' });
    const resultado = corrigirAutomaticamente(atividade.questoes, respostas);
    const registro = await respostaModel.registrarResposta(usuarioId(req), atividade.id_atividade, respostas, { correta: resultado.requerManual ? null : resultado.correta, status: resultado.requerManual ? 'ENTREGUE' : 'CORRIGIDA', nota: resultado.requerManual ? null : resultado.nota, detalhes: resultado.detalhes });
    return res.status(201).json({ message: resultado.requerManual ? 'Atividade enviada para correção.' : 'Atividade corrigida automaticamente.', resultado: { ...registro, nota: resultado.nota } });
  } catch (error) { console.error('[RESPOSTA ATIVIDADE]', error); return res.status(500).json({ message: 'Erro ao enviar atividade.' }); }
}

async function salvarRascunhoResposta(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade);
    if (!atividade || atividade.status !== 'PUBLICADA' || !destinadaAoUsuario(atividade, usuarioId(req))) return res.status(404).json({ message: 'Atividade não encontrada ou indisponível.' });
    const anterior = await respostaModel.obterPorAtividadeEUsuario(atividade.id_atividade, usuarioId(req));
    if (anterior && anterior.status !== 'RASCUNHO' && !atividade.permite_reenvio) return res.status(409).json({ message: 'A atividade já foi entregue.' });
    const resposta = await respostaModel.salvarRascunho(usuarioId(req), atividade.id_atividade, req.body.respostas || {});
    return res.json({ resposta, salvoEm: new Date().toISOString() });
  } catch (error) { return res.status(400).json({ message: error.message || 'Não foi possível salvar o progresso.' }); }
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
    return res.json({ resposta: await respostaModel.corrigir(resposta.id_resposta, { nota, feedback: req.body.feedback, detalhes: req.body.detalhes, corrigidoPor: usuarioId(req) }) });
  } catch (error) {
    console.error('[CORRECAO ATIVIDADE]', error);
    return res.status(500).json({ message: 'Erro ao corrigir entrega.' });
  }
}

async function versoes(req, res) {
  try {
    const atividade = await atividadeModel.buscarPorId(req.params.idAtividade);
    if (!atividade) return res.status(404).json({ message: 'Atividade não encontrada.' });
    if (req.usuario.tipo === 'docente' && Number(atividade.criado_por) !== Number(usuarioId(req))) return res.status(403).json({ message: 'Você não pode acessar este histórico.' });
    return res.json(await atividadeModel.listarVersoes(atividade.id_atividade));
  } catch { return res.status(500).json({ message: 'Erro ao carregar versões.' }); }
}

function validarQuestaoBanco(body) {
  const dados = validarAtividade({ titulo: 'Questão do banco', questoes: [body], status: 'RASCUNHO' });
  return { ...dados.questoes[0], titulo: String(body.titulo || '').trim() || null, tags: Array.isArray(body.tags) ? body.tags.map(String).filter(Boolean) : [], visibilidade: body.visibilidade };
}

async function bancoQuestoes(req, res) {
  try { return res.json(await atividadeModel.listarBancoQuestoes(usuarioId(req), ['dono', 'admin', 'adm'].includes(req.usuario.tipo))); }
  catch { return res.status(500).json({ message: 'Erro ao carregar o banco de questões.' }); }
}

async function criarQuestaoBanco(req, res) {
  try {
    const questao = validarQuestaoBanco(req.body);
    if (req.usuario.tipo === 'docente') questao.visibilidade = 'PRIVADA';
    return res.status(201).json(await atividadeModel.criarQuestaoBanco(usuarioId(req), questao));
  }
  catch (error) { return res.status(400).json({ message: error.message }); }
}

async function usarQuestaoBanco(req, res) {
  try { await atividadeModel.registrarUsoQuestao(req.params.idQuestao); return res.json({ registrado: true }); }
  catch { return res.status(400).json({ message: 'Não foi possível registrar o uso.' }); }
}

async function deletarQuestaoBanco(req, res) {
  try {
    const removida = await atividadeModel.deletarQuestaoBanco(req.params.idQuestao, usuarioId(req), ['dono', 'admin', 'adm'].includes(req.usuario.tipo));
    return removida ? res.status(204).end() : res.status(404).json({ message: 'Questão não encontrada.' });
  } catch { return res.status(500).json({ message: 'Não foi possível remover a questão.' }); }
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

module.exports = { listar, criar, autosalvar, atualizar, uploadImagem, uploadResposta, responderAtividade, salvarRascunhoResposta, entregas, corrigirEntrega, obter, listarAlunos, versoes, bancoQuestoes, criarQuestaoBanco, usarQuestaoBanco, deletarQuestaoBanco };
module.exports._test = { validarAtividade, corrigirAutomaticamente, semGabarito };
