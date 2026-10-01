const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { hexToRgb, contraste } = require('../frontend/src/theme/color.js');
const { PALETTES, tokensDaPaleta } = require('../frontend/src/theme/palettes.js');

const css = fs.readFileSync(
  path.join(__dirname, '..', 'frontend', 'src', 'components', 'ThemeCorrections.css'),
  'utf8',
);
const dashboardCss = fs.readFileSync(
  path.join(__dirname, '..', 'frontend', 'src', 'pages', 'TodayDashboard.css'),
  'utf8',
);
const appJsx = fs.readFileSync(
  path.join(__dirname, '..', 'frontend', 'src', 'App.jsx'),
  'utf8',
);

// Reproduz os mixes do CSS para conferir o contraste sem abrir o navegador.
const fundirComPreto = (hex, peso) => {
  const [r, g, b] = hexToRgb(hex);
  return [r, g, b].map((canal, i) =>
    Math.min(255, Math.max(0, Math.round(canal * peso + [21, 14, 34][i] * (1 - peso))))
  );
};

test('a sidebar não tem mais gradiente roxo fixo', () => {
  // Regressão: a sidebar era `linear-gradient(160deg,#6d35c7,#2b154b)`, então
  // escolher Brasa no seletor não mudava nada nela — a mesma falha que motivou
  // o design system inteiro. Só as regras contam: o hex pode ser citado no
  // comentário que documenta a correção.
  // `#5a2aaf` fica de fora de propósito: ele aparece dentro de um
  // `var(--pn-primaria-forte, #5a2aaf)`, que é o valor de reserva para quando
  // o JS ainda não rodou. É um fallback, não uma cor fixa da regra.
  const regras = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const cor of ['#6d35c7', '#2b154b', '#4a208f']) {
    assert.ok(!regras.includes(cor), `ainda há o roxo fixo ${cor} na sidebar`);
  }
});

test('a superfície da sidebar deriva da paleta', () => {
  assert.match(css, /--pn-shell-fundo/, 'falta a superfície derivada do token');
  assert.match(css, /var\(--pn-primaria/, 'a sidebar não usa a primária da paleta');
});

test('a textura do shell usa os tokens, não branco fixo', () => {
  // rgba(255,255,255,.7) fixo clareava o fundo no modo escuro.
  assert.match(css, /var\(--pn-grade\)/, 'a malha do fundo não usa --pn-grade');
});

test('o texto branco continua legível na sidebar de qualquer paleta', () => {
  for (const id of Object.keys(PALETTES)) {
    for (const modo of ['claro', 'escuro']) {
      const { primaria } = tokensDaPaleta(id)[modo];
      const fundo = fundirComPreto(primaria, 0.38);
      const razao = contraste([251, 249, 255], fundo);
      assert.ok(
        razao >= 4.5,
        `sidebar ${id}/${modo}: ${razao.toFixed(2)}:1 — abaixo de 4.5:1`
      );
    }
  }
});

test('o item ativo da sidebar tem contraste sobre o branco', () => {
  for (const id of Object.keys(PALETTES)) {
    for (const modo of ['claro', 'escuro']) {
      // `--pn-primaria-forte` existe justamente para este caso: ser texto sobre
      // branco independentemente do modo.
      const { 'primaria-forte': forte } = tokensDaPaleta(id)[modo];
      const razao = contraste(hexToRgb(forte), [255, 255, 255]);
      assert.ok(
        razao >= 4.5,
        `item ativo ${id}/${modo}: ${razao.toFixed(2)}:1 — abaixo de 4.5:1`
      );
    }
  }
});

test('a primária comum continua serving ao fundo, e a forte ao texto', () => {
  // As duas cumprem papéis diferentes. Se alguém unificar os tokens, a
  // primária escura passa a falhar sobre fundo escuro.
  for (const id of Object.keys(PALETTES)) {
    const escuro = tokensDaPaleta(id).escuro
    assert.notEqual(escuro.primaria, escuro['primaria-forte'], `${id}: tokens se fundiram`)
  }
});

test('o card de destaque do dashboard deriva da paleta', () => {
  // Era `linear-gradient(135deg,#3a255e,#59399b 57%,#7d57bd)`: mais um roxo fixo
  // que ignorava o seletor de cor.
  const regras = dashboardCss.replace(/\/\*[\s\S]*?\*\//g, '')
  for (const cor of ['#3a255e', '#59399b', '#7d57bd', '#271b43', '#463071', '#5d4292']) {
    assert.ok(!regras.includes(cor), `card do dashboard ainda usa ${cor}`)
  }
  assert.match(regras, /--pn-shell-fundo/, 'o card não usa a superfície da paleta')
});

test('o botão do card usa a primária forte, e não roxo fixo', () => {
  assert.match(dashboardCss, /var\(--pn-primaria-forte/, 'falta a primária forte no botão')
});

test('a rota do dashboard aponta para a tela que existe', () => {
  // App.jsx importava TodayDashboard mas a constante se chamava `Dashboard`, e
  // existia um pages/Dashboard.jsx órfão com 346 linhas que ninguém importava.
  // Migrá-lo não faria efeito nenhum: ele nunca era renderizado.
  const existeMorto = fs.existsSync(
    path.join(__dirname, '..', 'frontend', 'src', 'pages', 'Dashboard.jsx')
  )
  assert.equal(existeMorto, false, 'pages/Dashboard.jsx voltou e continua sem uso')
  assert.match(appJsx, /import\('\.\/pages\/TodayDashboard'\)/, 'a rota do dashboard sumiu')
})
