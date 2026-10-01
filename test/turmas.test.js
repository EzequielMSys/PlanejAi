const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const migration = fs.readFileSync(
  path.join(__dirname, '..', 'migrations', 'turmas_classroom_v16.sql'),
  'utf8',
);


test('a migration cria a tabela de convites com uso único', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS turma_convites/);
  // O código precisa ser único: dois convites iguais darião acesso duplicado.
  assert.match(migration, /UNIQUE KEY uk_convite_codigo/);
  assert.match(migration, /expira_em DATETIME NOT NULL/);
});

test('atividades e avisos passam a pertencer a uma turma', () => {
  assert.match(migration, /ALTER TABLE atividades\s+ADD COLUMN IF NOT EXISTS id_turma INT NULL/);
  assert.match(migration, /ALTER TABLE avisos\s+ADD COLUMN IF NOT EXISTS id_turma INT NULL/);
});

test('o modelo expõe entrada, saída, convites e a visão do aluno', () => {
  const model = require('../src/models/turmaModel');
  for (const fn of [
    'entrarPorCodigo', 'sair', 'criarConvite', 'listarConvites',
    'cancelarConvite', 'usarConvite', 'minhasTurmas', 'detalheDoAluno',
  ]) {
    assert.equal(typeof model[fn], 'function', `falta ${fn}`);
  }
});

test('a visão do aluno não é a tela de gestão', () => {
  // /detalhes exige gerenciar a turma e devolve a lista de alunos. A rota do
  // aluno precisa existir separada, senão ele é barrado ou vê a lista de colegas.
  const controller = require('../src/controllers/turmaController');
  assert.equal(typeof controller.minhas, 'function');
  assert.equal(typeof controller.minhaTurma, 'function');
  assert.notEqual(controller.minhas, controller.detalhes);
});

test('entrar por código normaliza o que o aluno digitou', async () => {
  const model = require('../src/models/turmaModel');
  // Sem normalizar, "fis-2026" seria recusado mesmo sendo o código certo.
  assert.match(model.entrarPorCodigo.toString(), /normalizarCodigo/);
});

test('usar convite marca o uso somente depois de entrar', async () => {
  const model = require('../src/models/turmaModel');
  const fonte = model.usarConvite.toString();
  const posEntrada = fonte.indexOf('entrarPorCodigo');
  // Precisa ser o UPDATE, não a checagem `convite.usado_em` que vem antes.
  const posUso = fonte.indexOf('UPDATE turma_convites SET usado_em');
  assert.ok(posEntrada > -1, 'não vincula o aluno na turma');
  assert.ok(posUso > -1, 'não marca o convite como usado');
  // Marcar antes de criar o vínculo queimaria o convite sem dar acesso.
  assert.ok(posUso > posEntrada, 'o convite é marcado antes de vincular');
});

test('o responsável não consegue sair deixando a turma órfã', () => {
  const model = require('../src/models/turmaModel');
  assert.match(model.sair.toString(), /RESPONSAVEL/);
});

test('as rotas de aluno não estão presas ao perfil gestor', () => {
  const rotas = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'routes', 'turmaRoutes.js'),
    'utf8',
  );
  // Se estas rotas tivessem isGestorPedagogico, o aluno nunca conseguiria
  // entrar por código — que é justamente o recurso que motiva a mudança.
  for (const rota of ["'/entrar'", "'/convites/usar'", "'/:id/sair'"]) {
    const linha = rotas.split('\n').find(l => l.includes(`r.post(${rota}`) || l.includes(`r.get(${rota}`));
    assert.ok(linha, `rota ${rota} não encontrada`);
    assert.ok(!linha.includes('isGestorPedagogico'), `${rota} está restrita ao gestor`);
  }
});
