import { lazy, Suspense, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Accessibility.css";
const AccessibilityToolbar = lazy(() => import('./AccessibilityToolbar'))

const titles = {
  "/": "PlanejAI — Estude com direção",
  "/login": "Entrar — PlanejAI",
  "/register": "Criar conta — PlanejAI",
  "/inicio": "Visão geral — PlanejAI",
  "/dashboard": "Visão geral — PlanejAI",
  "/cronograma": "Meu cronograma — PlanejAI",
  "/aprendizagem": "Laboratório de aprendizagem — PlanejAI",
  "/provas": "Provas e simulados — PlanejAI",
  "/redacoes": "Redações — PlanejAI",
  "/atividades": "Atividades — PlanejAI",
  "/minhas-atividades": "Minhas atividades — PlanejAI",
  "/avisos": "Avisos — PlanejAI",
  "/perfil": "Meu perfil — PlanejAI",
  "/materiais": "Materiais — PlanejAI",
  "/dashboard-gestor": "Painel pedagógico — PlanejAI",
  "/usuarios": "Usuários — PlanejAI",
  "/dono": "Painel do proprietário — PlanejAI",
  "/alterar-senha": "Segurança da conta — PlanejAI",
  "/onboarding": "Configurar estudos — PlanejAI",
  "/primeiro-acesso": "Primeiro acesso — PlanejAI",
  "/chat": "Tutor de estudos — PlanejAI",
  "/estudar": "Sessão de estudo — PlanejAI",
  "/minha-jornada": "Minha jornada — PlanejAI",
  "/planejamento-inteligente": "Planejamento — PlanejAI",
  "/minhas-turmas": "Minhas turmas — PlanejAI",
  "/turmas": "Gestão de turmas — PlanejAI",
  "/status": "Estado do sistema — PlanejAI",
  "/esqueci-senha": "Recuperar acesso — PlanejAI",
  "/redefinir-senha": "Nova senha — PlanejAI",
  "/dono/usuarios": "Gestão de pessoas — PlanejAI",
};

export default function PageExperience() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const pageKey = pathname === "/"
      ? "landing"
      : pathname.replace(/^\/+|\/+$/g, "").replaceAll("/", "-") || "landing";

    document.body.dataset.page = pageKey;
    document.title = titles[pathname] || "PlanejAI";
    window.scrollTo({ top: 0, behavior: "instant" });

    return () => {
      delete document.body.dataset.page;
    };
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        const shortcuts = {
          1: "/inicio",
          c: "/cronograma",
          l: "/aprendizagem",
          r: "/redacoes",
          a: "/atividades",
        };
        const target = shortcuts[event.key.toLowerCase()];
        if (target) {
          event.preventDefault();
          navigate(target);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo
      </a>
      <span className="sr-route" aria-live="polite">
        {titles[pathname] || "PlanejAI"}
      </span>
      <Suspense fallback={null}><AccessibilityToolbar /></Suspense>
    </>
  );
}
