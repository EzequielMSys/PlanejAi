const pool = require('../config/db');
const TYPES = ['materias', 'materiais', 'anotacoes', 'redacoes'];
const LABELS = { materias: 'Matérias', materiais: 'Materiais', anotacoes: 'Anotações', redacoes: 'Redações' };
const LIMIT = 12;
const staff = user => ['docente', 'admin', 'adm', 'dono'].includes(user.tipo);
const owner = user => Number(user.id_usuario || user.id);
function options(input = {}) {
  const q = typeof input.q === 'string' ? input.q.trim().replace(/\s+/g, ' ') : '';
  const type = input.tipo || 'todos';
  const page = input.pagina === undefined ? 1 : Number(input.pagina);
  if (q.length < 2 || q.length > 100 || !['todos', ...TYPES].includes(type) || !Number.isSafeInteger(page) || page < 1 || page > 100) {
    throw Object.assign(new Error('Use de 2 a 100 caracteres e um filtro válido.'), { status: 400 });
  }
  // A literal escape character avoids depending on MySQL backslash modes.
  const escaped = q.replace(/[!%_]/g, value => `!${value}`);
  return { q, type, page, pattern: `%${escaped}%`, prefix: `${escaped}%` };
}
function contentScope(user) {
  if (staff(user)) return { sql: '1=1', params: [] };
  return { sql: `(EXISTS (SELECT 1 FROM cronograma_conteudos cc
    JOIN cronograma_dias d ON d.id_dia=cc.id_dia
    JOIN cronogramas cr ON cr.id_cronograma=d.id_cronograma
    JOIN perfil_estudo p ON p.id_perfil=cr.id_perfil
    WHERE cc.id_conteudo=c.id_conteudo AND p.id_usuario=?))`, params: [owner(user)] };
}
function excerpt(text, query, length = 190) {
  const value = String(text || '').replace(/\s+/g, ' ').trim();
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  const index = normalize(value).indexOf(normalize(query));
  const start = Math.max(0, index - 45);
  return `${start ? '…' : ''}${value.slice(start, start + length)}${value.length > start + length ? '…' : ''}`;
}
function resourceTitles(value){try{const items=typeof value==='string'?JSON.parse(value):value;return Array.isArray(items)?items.slice(0,20).map(item=>typeof item?.titulo==='string'?item.titulo.slice(0,300):'').filter(Boolean).join(' · '):''}catch{return ''}}
async function search(user, input, db = pool) {
  const opt = options(input);
  const scope = contentScope(user);
  const offset = (opt.page - 1) * LIMIT;
  const selected = opt.type === 'todos' ? TYPES : [opt.type];
  const groups = await Promise.all(selected.map(async type => {
    let sql, params;
    if (type === 'materias') {
      sql = `SELECT DISTINCT c.disciplina AS titulo FROM conteudos c WHERE (${scope.sql})
        AND c.disciplina LIKE ? ESCAPE '!' ORDER BY c.disciplina LIMIT ${LIMIT + 1} OFFSET ${offset}`;
      params = [...scope.params, opt.pattern];
    } else if (type === 'materiais') {
      sql = `SELECT c.id_conteudo AS id, c.titulo, c.disciplina, LEFT(COALESCE(c.area,''),500) AS texto,c.materiais AS recursos
        FROM conteudos c WHERE (${scope.sql}) AND (c.titulo LIKE ? ESCAPE '!' OR c.disciplina LIKE ? ESCAPE '!' OR c.area LIKE ? ESCAPE '!' OR CAST(c.materiais AS CHAR) LIKE ? ESCAPE '!')
        ORDER BY (c.titulo LIKE ? ESCAPE '!') DESC,c.titulo,c.id_conteudo LIMIT ${LIMIT + 1} OFFSET ${offset}`;
      params = [...scope.params, ...Array(4).fill(opt.pattern), opt.prefix];
    } else if (type === 'anotacoes') {
      sql = `SELECT a.id_conteudo AS id,c.titulo,c.disciplina,a.texto,a.atualizado_em AS atualizadoEm
        FROM anotacoes_estudo a JOIN conteudos c ON c.id_conteudo=a.id_conteudo
        WHERE a.id_usuario=? AND TRIM(a.texto)<>'' AND (a.texto LIKE ? ESCAPE '!' OR c.titulo LIKE ? ESCAPE '!' OR c.disciplina LIKE ? ESCAPE '!')
        ORDER BY a.atualizado_em DESC,a.id_conteudo LIMIT ${LIMIT + 1} OFFSET ${offset}`;
      params = [owner(user), opt.pattern, opt.pattern, opt.pattern];
    } else {
      sql = `SELECT r.id_redacao AS id,r.tema AS titulo,r.texto,r.enviada_em AS atualizadoEm
        FROM redacoes r WHERE r.id_usuario=? AND (r.tema LIKE ? ESCAPE '!' OR r.texto LIKE ? ESCAPE '!')
        ORDER BY (r.tema LIKE ? ESCAPE '!') DESC,r.enviada_em DESC,r.id_redacao DESC LIMIT ${LIMIT + 1} OFFSET ${offset}`;
      params = [owner(user), opt.pattern, opt.pattern, opt.prefix];
    }
    const [rows] = await db.execute(sql, params);
    return { tipo: type, nome: LABELS[type], mais: rows.length > LIMIT, itens: rows.slice(0,LIMIT).map(row => ({
      id: row.id || row.titulo, titulo: row.titulo, disciplina: row.disciplina || '',
      trecho: excerpt(type==='materiais'?[row.texto,resourceTitles(row.recursos)].filter(Boolean).join(' · '):row.texto, opt.q), atualizadoEm: row.atualizadoEm || null,
    })) };
  }));
  return { query: opt.q, pagina: opt.page, limite: LIMIT, grupos: groups };
}
async function content(user, id, db = pool, notes = false) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) <= 0) return null;
  if (notes) {
    const [rows] = await db.execute(`SELECT c.id_conteudo,c.titulo,c.disciplina,c.area FROM conteudos c
      JOIN anotacoes_estudo a ON a.id_conteudo=c.id_conteudo WHERE c.id_conteudo=? AND a.id_usuario=? LIMIT 1`,[Number(id),owner(user)]);
    return rows[0] || null;
  }
  const scope = contentScope(user);
  const [rows] = await db.execute(`SELECT c.id_conteudo,c.titulo,c.disciplina,c.area,c.tipo,c.link,c.materiais
    FROM conteudos c WHERE c.id_conteudo=? AND (${scope.sql}) LIMIT 1`, [Number(id), ...scope.params]);
  return rows[0] || null;
}
module.exports = { search, content, options, excerpt, contentScope };
