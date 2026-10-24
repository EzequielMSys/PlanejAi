const test = require('node:test');
const assert = require('node:assert/strict');

test('navigation respects student, teacher and owner permissions', async () => {
  const { navigationFor, pageFor, searchPages } = await import('../frontend/src/config/navigation.js');
  const student = navigationFor('aluno').map(page => page.path);
  assert.ok(student.includes('/lumi'));
  assert.ok(student.includes('/preferencias'));
  assert.ok(!student.includes('/usuarios'));
  assert.ok(!student.includes('/dono'));
  assert.ok(!navigationFor('docente').some(page => page.path === '/usuarios'));
  assert.ok(navigationFor('dono').some(page => page.path === '/dono'));
  assert.equal(pageFor('/minhas-turmas/42').title, 'Minhas turmas');
  assert.equal(pageFor('/chat').path, '/lumi');
  assert.equal(pageFor('/dashboard').path, '/inicio');
  assert.ok(searchPages('aluno', 'redacoes').some(page => page.path === '/redacoes'));
  assert.ok(!searchPages('aluno', 'pessoas').some(page => page.path === '/usuarios'));
});

test('navigation groups secondary tools under their parent and preserves legacy search', async () => {
  const { navigationFor, pageFor, searchPages } = await import('../frontend/src/config/navigation.js');
  const visible = navigationFor('aluno');
  assert.equal(visible.find(page => page.path === '/inicio').title, 'Hoje');
  assert.equal(visible.find(page => page.path === '/cronograma').title, 'Cronograma');
  assert.ok(!visible.some(page => ['/sessao-guiada', '/minha-jornada', '/planejamento-inteligente', '/ferramentas-estudo'].includes(page.path)));
  assert.equal(pageFor('/minha-jornada').navParent, '/inicio');
  assert.equal(pageFor('/planejamento-inteligente').navParent, '/aprendizagem');
  assert.equal(searchPages('aluno', 'progresso')[0].path, '/aprendizagem');
  assert.ok(searchPages('aluno', 'flashcards').some(page => page.path === '/ferramentas-estudo'));
  assert.ok(searchPages('aluno', 'sessao guiada').some(page => page.path === '/sessao-guiada'));
  assert.ok(!searchPages('docente', 'sessao guiada').some(page => page.path === '/sessao-guiada'));
});
test('reading preferences clamp unsafe values and retain supported choices', async () => {
  const { normalizeReadingPreferences, READING_DEFAULTS } = await import('../frontend/src/utils/readingPreferences.js');
  assert.deepEqual(normalizeReadingPreferences(null), READING_DEFAULTS);
  assert.deepEqual(normalizeReadingPreferences({ fontScale: 'bad', lineHeight: Infinity }), READING_DEFAULTS);
  const settings = normalizeReadingPreferences({ fontScale: 300, lineHeight: 0, readingFont: 'serif', focusMode: true, readingWidth: 'javascript', readingSurface: 'paper' });
  assert.equal(settings.fontScale, 140);
  assert.equal(settings.lineHeight, 1.5);
  assert.equal(settings.readingFont, 'serif');
  assert.equal(settings.readingWidth, 'balanced');
  assert.equal(settings.readingSurface, 'paper');
  assert.equal(settings.focusMode, true);
});
test('Lumi text supports reading structure without interpreting HTML', async () => {
  const { parseStudyText, inlineStudyText } = await import('../frontend/src/utils/studyText.js');
  const blocks = parseStudyText('# Conceito\n\nUma **ideia** simples.\n\n1. Primeiro\n2. Segundo\n\n```js\nconst a = 1\n```\n\n<img src=x onerror=alert(1)>');
  assert.deepEqual(blocks.map(block => block.type), ['heading', 'paragraph', 'list', 'code', 'paragraph']);
  assert.equal(blocks[2].ordered, true);
  assert.equal(blocks[3].text, 'const a = 1');
  assert.equal(blocks[4].text, '<img src=x onerror=alert(1)>');
  assert.equal(inlineStudyText('Uma **ideia** e `exemplo`')[1].type, 'strong');
});
