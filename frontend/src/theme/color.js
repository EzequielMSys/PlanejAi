// Sistema de cor do PlanejAI.
//
// As paletas são descritas em OKLCH, um espaço perceptualmente uniforme: dois
// tons com a mesma luminosidade (L) parecem igualmente claros para o olho,
// aconteça o que acontecer com a matiz. Isso importa aqui porque a marca é
// roxa, e um roxo "40% mais claro" em HSL costuma ficar lavado ou escuro demais
// dependendo da matiz. Em OKLCH o mesmo L produz a mesma sensação nos dois modos.
//
// A conversão para sRGB é feita de verdade (OKLCH -> OKLab -> sRGB linear ->
// sRGB) para que o contraste WCAG possa ser calculado sobre os valores que o
// navegador realmente exibe, e não sobre números inventados.

const clamp = (valor, minimo, maximo) => Math.min(maximo, Math.max(minimo, valor));

export function oklchToRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const linear = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  // Curva de gama do sRGB: valores lineares fora de [0,1] são recortados, o que
  // é aceitável porque as paletas abaixo foram escolhidas dentro do gamut.
  return linear.map((canal) => {
    const srgb = canal <= 0.0031308 ? canal * 12.92 : 1.055 * canal ** (1 / 2.4) - 0.055;
    return Math.round(clamp(srgb, 0, 1) * 255);
  });
}

export function rgbToHex([r, g, b]) {
  return `#${[r, g, b].map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

export function hexToRgb(hex) {
  const limpo = String(hex).replace('#', '');
  const completo = limpo.length === 3 ? limpo.split('').map((c) => c + c).join('') : limpo;
  return [0, 2, 4].map((i) => parseInt(completo.slice(i, i + 2), 16));
}

export function rgbToOklch([r, g, b]) {
  const linear = [r, g, b].map((canal) => {
    const s = canal / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });

  const l = Math.cbrt(0.4122214708 * linear[0] + 0.5363325363 * linear[1] + 0.0514459929 * linear[2]);
  const m = Math.cbrt(0.2119034982 * linear[0] + 0.6806995451 * linear[1] + 0.1073969566 * linear[2]);
  const s = Math.cbrt(0.0883024619 * linear[0] + 0.2817188376 * linear[1] + 0.6299787005 * linear[2]);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  return { l: L, c: C, h: H };
}

export function oklchToHex(L, C, H) {
  return rgbToHex(oklchToRgb(L, C, H));
}

// Luminância relativa conforme WCAG 2.1. Usa os canais lineares, não os valores
// de 0 a 255 diretamente, senão o contraste sai sempre inflado.
export function luminanciaRelativa([r, g, b]) {
  const [rl, gl, bl] = [r, g, b].map((canal) => {
    const s = canal / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

export function contraste(primeira, segunda) {
  const a = luminanciaRelativa(primeira);
  const b = luminanciaRelativa(segunda);
  const claro = Math.max(a, b);
  const escuro = Math.min(a, b);
  return (claro + 0.05) / (escuro + 0.05);
}
