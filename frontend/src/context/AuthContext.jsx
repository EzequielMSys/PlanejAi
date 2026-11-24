import { createContext, useContext, useReducer, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { apiUrl } from "../config/api";
import { clearStoredSession } from "../utils/session";
import { setCsrfToken } from '../utils/csrfSession';
import { clearOfflineData } from "../utils/offlineStore";
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

export const AuthContext = createContext();

async function checkPerfilCompleto() {
  const response = await fetchWithTimeout(apiUrl("/api/perfil"), {
    credentials: 'include',
    cache: "no-store",
  });
  if (!response.ok) {
    const error = new Error("Não foi possível consultar seu perfil salvo. Tente entrar novamente.");
    error.status = response.status;
    throw error;
  }
  const { perfil, disponibilidade } = await response.json();
  return Boolean(perfil?.areas_foco?.trim() && Array.isArray(disponibilidade) && disponibilidade.length > 0);
}

const initialState = {
  user: null,
  token: null,
  primeiroAcesso: false,
  perfilCompleto: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        token: null,
        primeiroAcesso: action.payload.primeiro_acesso,
        perfilCompleto: action.payload.perfil_completo,
        loading: false,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: action.payload,
      };

    case "UPDATE_PERFIL_COMPLETO":
      return {
        ...state,
        perfilCompleto: action.payload,
      };

    case "LOGOUT":
      return {
        ...initialState,
        loading: false,
      };

    case "LOADING":
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      // Remove credentials left by releases before cookie sessions.
      localStorage.removeItem('token');
      const perfilCompleto = localStorage.getItem("perfil_completo") === "true";
      try {
          const session = await authService.session();
          const parsedUser = session.usuario;
          setCsrfToken(session.csrfToken);

          // O banco é a fonte de verdade; um cache antigo não deve repetir o onboarding.
          let completo = perfilCompleto;
          const isGestor = ["dono", "admin", "adm", "docente"].includes(parsedUser.tipo);
          try {
            completo = isGestor || await checkPerfilCompleto();
          } catch (error) {
            if (error.status === 401 || error.status === 403) { if (!cancelled) { clearStoredSession(); setCsrfToken(null); dispatch({ type: 'LOGOUT' }); } return; }
            console.error("Erro ao consultar perfil salvo:", error);
            // Uma indisponibilidade da API não apaga o estado já confirmado.
          }
          if (cancelled) return;
          localStorage.setItem('user', JSON.stringify(parsedUser));
          localStorage.setItem("perfil_completo", completo ? "true" : "false");

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              token: null,
              user: parsedUser,
              primeiro_acesso: session.primeiro_acesso,
              perfil_completo: completo,
            },
          });
        } catch (error) {
          if (error.response?.status !== 401) console.error("Erro ao restaurar sessão:", error);
          setCsrfToken(null);
          clearStoredSession();
        }

      if (cancelled) return;
      dispatch({
        type: "LOADING",
        payload: false,
      });
    };
    restore();
    return () => { cancelled = true; };
  }, []);

  const login = async (email, senha, destination) => {
    try {
      dispatch({
        type: "LOADING",
        payload: true,
      });

      const response = await authService.login(email, senha);
      localStorage.removeItem('token');
      setCsrfToken(response.csrfToken);

      const isGestor = ["dono", "admin", "adm", "docente"].includes(
        response.usuario.tipo,
      );
      const perfilCompleto = isGestor
        ? true
        : await checkPerfilCompleto();

      localStorage.setItem("user", JSON.stringify(response.usuario));

      localStorage.setItem(
        "primeiro_acesso",
        response.primeiro_acesso ? "true" : "false",
      );

      localStorage.setItem(
        "perfil_completo",
        perfilCompleto ? "true" : "false",
      );

      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          token: null,
          user: response.usuario,
          primeiro_acesso: response.primeiro_acesso,
          perfil_completo: perfilCompleto,
        },
      });

      toast.success("Login realizado com sucesso!");

      if (response.primeiro_acesso) {
        navigate("/primeiro-acesso");
      } else {
        const path = destination?.pathname;
        navigate(typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') && !['/login', '/register', '/primeiro-acesso'].includes(path) ? { pathname: path, search: destination.search || '', hash: destination.hash || '' } : '/inicio');
      }

      return response;
    } catch (error) {
      toast.error(
        error.response?.data?.error ||
          error.response?.data?.message ||
          (error.response
            ? `Não foi possível entrar (HTTP ${error.response.status}).`
            : error.message || "Não foi possível conectar à API. Verifique se o servidor está ativo."),
      );

      throw error;
    } finally {
      dispatch({
        type: "LOADING",
        payload: false,
      });
    }
  };

  const logout = async () => {
    try { await authService.logout(); } catch { /* Clear local data even if the API is unavailable. */ }
    setCsrfToken(null);
    clearOfflineData().catch(() => {});
    clearStoredSession();

    dispatch({
      type: "LOGOUT",
    });

    toast.success("Até logo!");
    navigate("/");
  };

  const completeAccountDeletion = () => {
    setCsrfToken(null);
    clearOfflineData().catch(() => {});
    clearStoredSession();
    dispatch({ type: 'LOGOUT' });
    toast.success('Conta excluída.');
    navigate('/', { replace: true });
  };

  const changePassword = async (senhaAtual, novaSenha, confirmarSenha) => {
    const response = await authService.alterarSenha(senhaAtual, novaSenha, confirmarSenha);
    setCsrfToken(response.csrfToken);
    localStorage.setItem("user", JSON.stringify(response.usuario));
    dispatch({ type: "LOGIN_SUCCESS", payload: {
      token: null, user: response.usuario,
      primeiro_acesso: state.primeiroAcesso, perfil_completo: state.perfilCompleto,
    } });
    return response;
  };

  useEffect(() => {
    const handleExpiredSession = () => {
      clearOfflineData().catch(() => {});
      setCsrfToken(null);
      dispatch({ type: "LOGOUT" });
      toast.error("Sua sessão expirou. Entre novamente.");
      navigate("/login", { replace: true });
    };
    window.addEventListener("planejai:session-expired", handleExpiredSession);
    return () => window.removeEventListener("planejai:session-expired", handleExpiredSession);
  }, [navigate]);

  const updatePerfilCompleto = (completo) => {
    localStorage.setItem("perfil_completo", completo ? "true" : "false");

    dispatch({
      type: "UPDATE_PERFIL_COMPLETO",
      payload: completo,
    });
  };

  const updateUser = (data) => {
    const updatedUser = {
      ...state.user,
      ...data,
    };

    localStorage.setItem("user", JSON.stringify(updatedUser));

    dispatch({
      type: "UPDATE_USER",
      payload: updatedUser,
    });
  };

  const isAdmin =
    state.user?.tipo === "admin" ||
    state.user?.tipo === "adm" ||
    state.user?.tipo === "dono";

  const isDocente = state.user?.tipo === "docente";

  const isDono = state.user?.tipo === "dono";

  const isGestor = isAdmin || isDono || isDocente;

  const value = {
    ...state,

    login,
    logout,
    completeAccountDeletion,
    changePassword,

    updateUser,
    updatePerfilCompleto,

    isAuthenticated: !!state.user,

    isAdmin,
    isDocente,
    isDono,
    isGestor,

    isPrimeiroAcesso: state.primeiroAcesso,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
};
