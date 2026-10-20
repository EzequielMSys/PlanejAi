import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { metricasDeSessoes } from "../utils/studyMetrics";

const CHAVE_SESSOES = "planejai:study-sessions";
const CHAVE_METRICAS = "planejai:user-metrics";

const UserContext = createContext(null);

function lerSessoes() {
  try {
    const sessoes = JSON.parse(localStorage.getItem(CHAVE_SESSOES) || "[]");
    return Array.isArray(sessoes) ? sessoes : [];
  } catch {
    return [];
  }
}

function lerMetricas() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_METRICAS) || "{}");
  } catch {
    return {};
  }
}

function salvarMetricas(metricas) {
  try {
    localStorage.setItem(CHAVE_METRICAS, JSON.stringify(metricas));
  } catch {
    /* storage indisponível, ignora */
  }
}

function useAuthSafe() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { user: null, loading: false, isAuthenticated: false };
  }
  return ctx;
}

export function UserProvider({ children }) {
  const { user } = useAuthSafe();
  const [sessoes, setSessoes] = useState(() => lerSessoes());
  const [metricas, setMetricas] = useState(() => lerMetricas());

  useEffect(() => {
    let atualizadas;
    try {
      atualizadas = lerSessoes();
    } catch {
      atualizadas = [];
    }
    setSessoes(atualizadas);
    const calc = metricasDeSessoes(atualizadas);
    const novas = { ...metricas, ...calc, atualizadoEm: new Date().toISOString() };
    setMetricas(novas);
    salvarMetricas(novas);
  }, []);

  const registrarSessao = (sessao) => {
    try {
      const nova = {
        id: sessao.id || Date.now().toString(),
        idConteudo: sessao.idConteudo,
        title: sessao.titulo || sessao.title || sessao.disciplina || "",
        minutes: sessao.minutes || sessao.minutos || 0,
        difficulty: sessao.dificuldade || sessao.difficulty || "medio",
        finishedAt: new Date().toISOString(),
        source: sessao.source || "manual",
      };
      const atualizadas = [nova, ...sessoes].slice(0, 200);
      setSessoes(atualizadas);
      localStorage.setItem(CHAVE_SESSOES, JSON.stringify(atualizadas));
      const calc = metricasDeSessoes(atualizadas);
      const novasMetricas = { ...metricas, ...calc, atualizadoEm: new Date().toISOString() };
      setMetricas(novasMetricas);
      salvarMetricas(novasMetricas);
      return nova;
    } catch {
      return null;
    }
  };

  const atualizarMetricas = (dados) => {
    try {
      const novas = { ...metricas, ...dados, atualizadoEm: new Date().toISOString() };
      setMetricas(novas);
      salvarMetricas(novas);
    } catch {
      /* storage indisponível, ignora */
    }
  };

  const resumo = useMemo(() => {
    const perfil = user || {};
    return {
      usuario: perfil,
      estaAutenticado: Boolean(perfil.id || perfil.email),
      tipo: perfil.tipo || "aluno",
      nome: perfil.nome || perfil.email || "Usuário",
      ...metricas,
      sessoes,
    };
  }, [user, metricas, sessoes]);

  try {
    return (
      <UserContext.Provider value={{ ...resumo, registrarSessao, atualizarMetricas }}>
        {children}
      </UserContext.Provider>
    );
  } catch {
    return <>{children}</>;
  }
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser deve ser usado dentro de UserProvider");
  }
  return context;
};
