import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Accessibility.css";

const titles = {
  "/": "PlanejAI — Estude com direção",
  "/lumi": "Lumi — Seu espaço para perguntar",
  "/chat": "Lumi — PlanejAI",
  "/preferencias": "Meu espaço — Cores e leitura",
  "/login": "Entrar — PlanejAI",
  "/register": "Criar conta — PlanejAI",
  "/esqueci-senha": "Recuperar acesso — PlanejAI",
  "/redefinir-senha": "Nova senha — PlanejAI",
  "/inicio": "Meu dia — PlanejAI",
  "/dashboard": "Meu dia — PlanejAI",
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
      if (event.key === "Escape") document.activeElement?.blur();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate]);

  return (
    <>
      <a className="skip-link" href="#conteudo-principal" onClick={event => {
        event.preventDefault();
        const main = document.getElementById('conteudo-principal');
        main?.focus();
        main?.scrollIntoView({ block: 'start' });
      }}>
        Pular para o conteúdo
      </a>
      <span className="sr-route" aria-live="polite">
        {titles[pathname] || "PlanejAI"}
      </span>
    </>
  );
}
