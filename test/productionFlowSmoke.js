// One-time, explicit production check with a disposable student account.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const base = 'https://planej-ai-dusky.vercel.app';
const email = `planejai-flow-${crypto.randomBytes(6).toString('hex')}@example.invalid`;
const password = `Teste!${crypto.randomBytes(12).toString('hex')}`;
let cookie = '', csrf = '', created = false;

async function call(path, method = 'GET', data, authenticated = true) {
  const headers = {};
  if (authenticated) { headers.Cookie = cookie; if (method !== 'GET') headers['X-CSRF-Token'] = csrf; }
  if (data !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, body: data === undefined ? undefined : JSON.stringify(data), signal: AbortSignal.timeout(60000) });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body, headers: response.headers };
}

async function main() {
  try {
    let result = await call('/api/auth/register', 'POST', { nome: 'Teste Fluxos', email, senha: password }, false);
    assert.equal(result.status, 201, 'cadastro'); created = true;
    result = await call('/api/auth/login', 'POST', { email, senha: password }, false);
    assert.equal(result.status, 200, 'login');
    cookie = result.headers.get('set-cookie').split(';')[0]; csrf = result.body.csrfToken;
    result = await call('/api/perfil', 'POST', { ano_escolar: null, objetivo: 'ENEM', areas_foco: 'Matemática', tempo_diario_min: 30, prazo_estimado: 30 });
    assert.equal(result.status, 201, 'perfil');
    result = await call('/api/perfil/disponibilidade', 'POST', { dias: [{ dia_semana: 'SEG', hora_inicio: '08:00', hora_fim: '09:00', ocupado: 0 }] });
    assert.equal(result.status, 201, 'disponibilidade');
    result = await call('/api/cronograma/gerar', 'POST', {});
    assert.equal(result.status, 201, `cronograma: ${result.body.error || result.body.message || ''}`);
    result = await call('/api/cronograma/ativo'); assert.equal(result.status, 200, 'cronograma ativo');
    console.log('Planejamento: perfil, disponibilidade, geração e leitura OK');
    result = await call('/api/inteligencia/chat', 'POST', { mensagem: 'Explique brevemente o que é uma função linear.', disciplina: 'Matemática' });
    assert.equal(result.status, 200, `Lumi: ${result.body.message || ''}`);
    console.log('Lumi: resposta OK');
    result = await call('/api/redacao', 'POST', { tema: 'Educação e tecnologia', texto: 'A tecnologia pode ampliar o acesso à educação. Contudo, é necessário garantir inclusão digital. Portanto, escolas e governos devem colaborar para oferecer recursos e formação.' });
    assert.equal(result.status, 201, `redação: ${result.body.message || ''}`);
    result = await call('/api/redacao'); assert.equal(result.status, 200, 'lista de redações');
    console.log('Redação: envio e leitura OK');
    result = await call('/api/turmas/minhas'); assert.equal(result.status, 200, 'turmas do aluno');
    console.log('Turmas: consulta do aluno OK; criação/convite exigem docente de teste');
    result = await call('/api/usuarios/me/exportar'); assert.equal(result.status, 200, 'exportação');
    assert.ok(JSON.stringify(result.body).includes(email), 'exportação contém conta');
    console.log('Exportação: JSON com dados da conta OK');
    result = await call('/api/auth/esqueci-senha', 'POST', { email }, false);
    assert.equal(result.status, 202, 'solicitação de recuperação');
    console.log('Recuperação: solicitação aceita; entrega por e-mail não verificável em example.invalid');
  } finally {
    if (created && cookie && csrf) {
      const deleted = await call('/api/usuarios/me', 'DELETE', { senha: password, confirmacao: 'EXCLUIR MINHA CONTA' });
      assert.equal(deleted.status, 200, `limpeza da conta de teste: ${deleted.body.error || deleted.body.message || ''}`);
      console.log('Conta de teste excluída');
    }
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
