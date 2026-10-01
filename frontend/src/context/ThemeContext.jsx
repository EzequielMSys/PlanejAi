import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { PALETTES, PALETA_PADRAO, paletaPorId, tokensDaPaleta } from "../theme/palettes.js";
import { hexToRgb, rgbToOklch, oklchToHex } from "../theme/color.js";

const ThemeContext = createContext();
const CHAVE_TEMA = "planejai:tema";
const CHAVE_PALETA = "planejai:paleta";
const CHAVE_COR = "planejai:cor-custom";

function getInitialTheme() {
  // 1. Preferência salva pelo usuário
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") return saved;

  // 2. Preferência do sistema operacional
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function lerAjuste() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_TEMA) || "{}");
  } catch {
    return {};
  }
}

function lerPaleta() {
  const salva = localStorage.getItem(CHAVE_PALETA);
  return salva && PALETTES[salva] ? salva : PALETA_PADRAO;
}

function lerCorCustom() {
  const salva = localStorage.getItem(CHAVE_COR);
  return salva && /^#[0-9a-f]{6}$/i.test(salva) ? salva : null;
}

// Converte uma cor escolhida a dedo em uma paleta derivada. Reaproveita a
// matiz do Hex e o chroma da paleta ativa, o que preserva a "personalidade" da
// paleta (violeta continua violeta) enquanto troca o tom. O contraste continua
// garantido porque `tokensDaPaleta` corrige borda e texto sobre a primária.
export function paletaDeCor(hex, base = PALETA_PADRAO) {
  const { l, c, h } = rgbToOklch(hexToRgb(hex));
  return {
    id: 'custom',
    nome: 'Sua cor',
    descricao: 'Escolhida por você',
    hue: h,
    // Um croma baixo deixaria a cor desbotada; limitar pelo da paleta base
    // mantém a vivacidade sem exagerar em tons que cansam a vista.
    chroma: Math.max(0.02, Math.min(c, paletaPorId(base).chroma * 1.6)),
  };
}

function aplicarTokens(tokens) {
  const root = document.documentElement;
  for (const [nome, hex] of Object.entries(tokens)) {
    root.style.setProperty(`--pn-${nome}`, hex);
    // Também publica em RGB separado, para o Tailwind usar com alpha:
    // rgb(var(--pn-primaria-rgb) / 0.2)
    const [r, g, b] = hexToRgb(hex);
    root.style.setProperty(`--pn-${nome}-rgb`, `${r} ${g} ${b}`);
  }
}

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);
  const [paleta, setPaleta] = useState(lerPaleta);
  const [corCustom, setCorCustom] = useState(lerCorCustom);
  const [ajustes, setAjustes] = useState(lerAjuste);

  const paletaAtiva = useMemo(() => {
    if (!corCustom) return paletaPorId(paleta);
    return paletaDeCor(corCustom, paleta);
  }, [corCustom, paleta]);

  const tokens = useMemo(() => tokensDaPaleta(paletaAtiva), [paletaAtiva]);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Contraste é independente do modo: o usuário pode escurecer mais o fundo
    // para leitura longa, útil sob muita luz ambiente ou baixa visão.
    const querContrasteAlto =
      ajustes.contraste === 'alto' || (ajustes.contraste === 'auto' && ajustes.fundoTorrido);
    root.classList.toggle('pn-alto-contraste', Boolean(querContrasteAlto));

    localStorage.setItem("theme", theme);
    localStorage.setItem(CHAVE_PALETA, paleta);
    if (corCustom) localStorage.setItem(CHAVE_COR, corCustom);
    else localStorage.removeItem(CHAVE_COR);
    localStorage.setItem(CHAVE_TEMA, JSON.stringify(ajustes));

    // Aplica só o conjunto do modo atual.
    aplicarTokens(tokens[theme === "dark" ? "escuro" : "claro"]);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    themeMeta?.setAttribute(
      "content",
      tokens[theme === "dark" ? "escuro" : "claro"].fundo,
    );
  }, [theme, paleta, corCustom, tokens, ajustes]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const escolherPaleta = (id) => {
    setPaleta(PALETTES[id] ? id : PALETA_PADRAO);
    // Trocar de paleta deve limpar a cor manual, senão a escolha não teria
    // efeito visível e o usuário ficaria sem saída.
    setCorCustom(null);
  };

  const escolherCor = (hex) => {
    setCorCustom(hex && /^#[0-9a-f]{6}$/i.test(hex) ? hex : null);
  };

  const usarCorPadrao = () => setCorCustom(null);

  const ajustar = (chave, valor) => setAjustes((s) => ({ ...s, [chave]: valor }));

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === "dark",
        toggleTheme,
        paleta,
        paletaAtiva,
        corCustom,
        escolherPaleta,
        escolherCor,
        usarCorPadrao,
        paletas: PALETTES,
        tokens: tokens[theme === "dark" ? "escuro" : "claro"],
        ajustes,
        ajustar,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  }

  return context;
};
