// A extensão é obrigatória: o Vite aceita import sem ela, mas o runner do Node
// (usado pelos testes) resolve o caminho literalmente e falha sem ".js".
import { oklchToHex, rgbToOklch, oklchToRgb, hexToRgb, contraste } from './color.js'

// Cada paleta nasce de uma intenção de cor, não de moda:
//
//  amethyst  -> concentração e introspecção; a cor do caderno de Concentração.
//  lagoon    -> calma e clareza; azul-verde reduz a sensação de Urgência.
//  forest    -> crescimento e recuperação; verde-escuro é o menos cansativo.
//  ember     -> energia e ação; laranja-âmbar incentiva começar.
//  rose      -> acolhimento e afeto; rosa-quadrado é calmante, não infantil.
//  slate     -> neutralidade e foco; para quem não quer cor nenhuma.
//
// `hue` é o ângulo em OKLCH. Os demais campos (L/C) são fixos por papel para que
// o contraste entre texto e fundo seja previsível em qualquer matiz: é o que
// permite trocar a cor sem quebrar a legibilidade.

export const PALETTES = {
  amethyst: {
    id: 'amethyst',
    nome: 'Amétis',
    descricao: 'Concentração e caderno de estudos',
    hue: 288,
    // Roxo claro: luminosidade maior deixa o violeta "vivo" sem virar lilás.
    chroma: 0.155,
  },
  lagoon: {
    id: 'lagoon',
    nome: 'Lagoa',
    descricao: 'Calma e clareza mental',
    hue: 205,
    chroma: 0.13,
  },
  forest: {
    id: 'forest',
    nome: 'Floresta',
    descricao: 'Progresso e energia tranquila',
    hue: 155,
    chroma: 0.12,
  },
  ember: {
    id: 'ember',
    nome: 'Brasa',
    descricao: 'Foco direto e Motivação',
    hue: 45,
    chroma: 0.15,
  },
  rose: {
    id: 'rose',
    nome: 'Rosa',
    descricao: 'Acolhimento e gentileza',
    hue: 355,
    chroma: 0.14,
  },
  slate: {
    id: 'slate',
    nome: 'Grafite',
    descricao: 'Neutro, sem cor dominante',
    hue: 265,
    chroma: 0.02,
  },
}

export const PALETA_PADRAO = 'amethyst'

// Papéis de cor. Cada papel fixa L e C e só varia o hue da paleta, garantindo
// que texto, superfície e borda mantenham contraste coerente entre as 6 paletas.
const PAPEIS = {
  claro: {
    fundo: { l: 0.985, c: 0.006, mix: 0.55 },
    fundoAlt: { l: 0.965, c: 0.012, mix: 0.6 },
    superficie: { l: 1, c: 0, mix: 0 },
    superficieAlt: { l: 0.975, c: 0.014, mix: 0.6 },
    borda: { l: 0.9, c: 0.02, mix: 0.55 },
    // No claro, `bordaForte` é ajustada por busca para atingir 3:1 contra o
    // fundo, em vez de fixar um L que só funciona para algumas matizes.
    bordaForte: { l: 0.68, c: 0.045, mix: 0.5 },
    texto: { l: 0.28, c: 0.03, mix: 0.45 },
    textoSuave: { l: 0.5, c: 0.028, mix: 0.4 },
    primaria: { l: 0.55, c: null, mix: 0 },
    primariaHover: { l: 0.48, c: null, mix: 0 },
    primariaSuave: { l: 0.945, c: null, mix: 0.16 },
    primariaBorda: { l: 0.85, c: null, mix: 0.3 },
  },
  escuro: {
    fundo: { l: 0.16, c: 0.018, mix: 0.5 },
    fundoAlt: { l: 0.2, c: 0.024, mix: 0.55 },
    superficie: { l: 0.225, c: 0.022, mix: 0.5 },
    superficieAlt: { l: 0.265, c: 0.026, mix: 0.5 },
    borda: { l: 0.33, c: 0.03, mix: 0.5 },
    // No escuro o inverso: a borda precisa ser bem mais clara que o fundo.
    bordaForte: { l: 0.62, c: 0.045, mix: 0.5 },
    texto: { l: 0.97, c: 0.008, mix: 0.4 },
    textoSuave: { l: 0.76, c: 0.02, mix: 0.4 },
    // No escuro a primária precisa ser mais clara para continuar legível
    // sobre o fundo, e menos saturada para não vibrar contra o OLED.
    primaria: { l: 0.78, c: null, mix: 0.68 },
    primariaHover: { l: 0.85, c: null, mix: 0.6 },
    primariaSuave: { l: 0.3, c: null, mix: 0.28 },
    primariaBorda: { l: 0.42, c: null, mix: 0.35 },
  },
}

export function paletaPorId(id) {
  return PALETTES[id] || PALETTES[PALETA_PADRAO]
}

// Aceita tanto um id ("amethyst") quanto um objeto de paleta já resolvido, que é
// o caso da cor escolhida pelo usuário no seletor. Sem isso, `PALETTES[objeto]`
// seria undefined e a cor personalizada cairia silenciosamente no roxo padrão.
export function resolverPaleta(entrada) {
  if (entrada && typeof entrada === 'object' && typeof entrada.hue === 'number') return entrada
  return paletaPorId(entrada)
}

// A primária carrega o chroma cheio da paleta; os neutros são dessaturados
// proporcionalmente a `mix`, para que o fundo não pareça colorido demais e o
// texto continue sendo o ponto de maior contraste da tela.
function chromaDe(nome, papel, paleta) {
  if (nome === 'primaria') return paleta.chroma;
  if (nome === 'primariaHover') return paleta.chroma * 1.05;
  if (nome === 'primariaSuave') return paleta.chroma * 0.28;
  if (nome === 'primariaBorda') return paleta.chroma * 0.42;
  return papel.c ?? paleta.chroma * papel.mix;
}

// Gera todos os tokens de um tema (claro/escuro) para uma paleta.
export function tokensDaPaleta(idPaleta = PALETA_PADRAO) {
  const paleta = resolverPaleta(idPaleta);
  const gerar = (modo) => {
    const saida = {};
    for (const [nome, papel] of Object.entries(PAPEIS[modo])) {
      saida[nome] = oklchToHex(papel.l, chromaDe(nome, papel, paleta), paleta.hue);
    }
    // O texto sobre a cor primária é calculado, não fixado.
    //
    // Para uma luminância Y, o branco atinge 4.5:1 quando Y <= 0.183 e o preto
    // quando Y >= 0.175. Essas faixas se sobrepõem, então escolher o melhor dos
    // dois sempre passa de 4.5:1 — desde que as duas pontas sejam realmente
    // extrema. Usar um "quase preto" tingido (OKLCH L=0.19) quebra a garantia e
    // reprova em matizes claros como lagoon (4.34:1), por isso as opções são
    // branco e preto puros.
    const clara = oklchToHex(1, 0, 0);
    const escura = oklchToHex(0, 0, 0);
    const comClara = contraste(hexToRgb(saida.primaria), hexToRgb(clara));
    const comEscura = contraste(hexToRgb(saida.primaria), hexToRgb(escura));
    saida.onPrimaria = comClara >= comEscura ? clara : escura;

    // A borda de campo precisa de 3:1 contra o fundo. Em vez de escolher um L
    // que só funciona para certas matizes, procura-se o L mais próximo do
    // desejado que satisfaça a razão. Isso mantém a garantia válida para as
    // 6 paletas e para qualquer cor que o usuário criar no seletor.
    const papelBorda = PAPEIS[modo].bordaForte;
    const cBorda = chromaDe('bordaForte', papelBorda, paleta);
    const alvoBorda = papelBorda.l;
    const fundoRgb = hexToRgb(saida.fundo);
    let melhorHex = saida.bordaForte;
    let menorDelta = Infinity;
    for (let l = 0.05; l <= 0.99; l += 0.005) {
      const hex = oklchToHex(l, cBorda, paleta.hue);
      if (contraste(hexToRgb(hex), fundoRgb) < 3) continue;
      const delta = Math.abs(l - alvoBorda);
      if (delta < menorDelta) {
        menorDelta = delta;
        melhorHex = hex;
      }
    }
    saida.bordaForte = melhorHex;

    // A cor de erro não segue o hue da paleta: um erro precisa ser reconhecível
    // como erro, e fixá-lo em vermelho puro evita que a identidade visual
    // esconda a informação. Só o L varia por modo, com busca até atingir 4.5:1
    // contra o fundo — abaixo disso o texto de erro fica ilegível justamente
    // para quem precisa dele.
    // A busca por contraste precisa varredura no sentido certo. Começando em
    // L=0.05, a primeira cor que passa seria sempre a mais escura possível, e
    // no modo escuro isso resultaria num vermelho quase invisível. Então,
    // varremos subindo a luminosidade no claro e descendo no escuro até
    // atingir a razão desejada.
    const cErro = 0.17;
    const sentido = modo === 'claro' ? 1 : -1;
    const inicio = modo === 'claro' ? 0.35 : 0.95;
    let hexErro = null;
    let hexErroBorda = null;
    for (let passo = 0; passo < 190; passo += 1) {
      const l = inicio + sentido * passo * 0.005;
      if (l < 0.05 || l > 0.99) break;
      const hex = oklchToHex(l, cErro, 25);
      if (!hexErro && contraste(hexToRgb(hex), fundoRgb) >= 4.5) hexErro = hex;
      if (!hexErroBorda && contraste(hexToRgb(hex), fundoRgb) >= 3) hexErroBorda = hex;
      if (hexErro && hexErroBorda) break;
    }
    saida.erro = hexErro ?? oklchToHex(0.52, cErro, 25);
    saida['erro-borda'] = hexErroBorda ?? hexErro ?? saida.erro;

    // `primaria` muda de luminosidade conforme o modo: clara no escuro, escura
    // no claro. Isso é correto sobre o fundo da página, mas quebra quando a
    // mesma cor é usada como TEXTO sobre um bloco branco — o item ativo da
    // sidebar faz isso, e a primária do modo escuro dava 3.89:1.
    // `primariaForte` é sempre a definição do modo claro, então serve como
    // texto sobre branco nos dois modos, sem depender do que foi escolhido.
    {
      const papelClaro = PAPEIS.claro.primaria
      const l = Math.min(papelClaro.l, 0.52)
      saida['primaria-forte'] = oklchToHex(l, chromaDe('primaria', papelClaro, paleta), paleta.hue)
    }

    return saida;
  };

  return { claro: gerar('claro'), escuro: gerar('escuro') };
}
