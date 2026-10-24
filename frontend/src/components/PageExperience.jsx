import { lazy, Suspense, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Accessibility.css";
const AccessibilityToolbar = lazy(() => import('./AccessibilityToolbar'))
import { focusRouteContent } from '../utils/routeFocus'

const titles = {
  "/": "PlanejAI — Estude com direção",
  "/login": "Entrar — PlanejAI",
  "/register": "Criar conta — PlanejAI",
  "/inicio": "Hoje — PlanejAI",
  "/dashboard": "Hoje — PlanejAI",
  "/cronograma": "Cronograma — PlanejAI",
  "/aprendizagem": "Praticar e revisar — PlanejAI",
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
  "/lumi": "Lumi — PlanejAI",
  "/fontes-estudo": "Fontes para estudar — PlanejAI",
  "/preferencias": "Meu espaço — PlanejAI",
  "/estudar": "Sessão de estudo — PlanejAI",
  "/minha-jornada": "Sessão guiada — PlanejAI",
  "/sessao-guiada": "Sessão guiada — PlanejAI",
  "/planejamento-inteligente": "Ferramentas de estudo — PlanejAI",
  "/ferramentas-estudo": "Ferramentas de estudo — PlanejAI",
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
  const previousPath = useRef(pathname)
  useEffect(() => {
    if (previousPath.current === pathname) return
    previousPath.current = pathname
    return focusRouteContent()
  }, [pathname])

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
        if (event.target?.closest?.('input,textarea,select,[contenteditable="true"]')) return;
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
      <a className="skip-link" href="#conteudo-principal" onClick={(event) => {
        event.preventDefault();
        const principal = document.getElementById("conteudo-principal") || document.querySelector("main");
        if (!principal) return;
        if (!principal.hasAttribute("tabindex")) principal.setAttribute("tabindex", "-1");
        principal.scrollIntoView({ block: "start" });
        principal.focus({ preventScroll: true });
      }}>
        Pular para o conteúdo
      </a>
      <span className="sr-route" aria-live="polite">
        {titles[pathname] || "PlanejAI"}
      </span>
      <Suspense fallback={null}><AccessibilityToolbar /></Suspense>
    </>
  );
}
