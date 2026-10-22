import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import "./StudentDesign.css";
import App from "./App.jsx";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import ErrorBoundary from "./components/ErrorBoundary";
import PageExperience from "./components/PageExperience";
import { registerServiceWorker, registerChunkRecovery } from "./registerServiceWorker";

registerChunkRecovery();
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <ThemeProvider>
        <AccessibilityProvider>
        <ErrorBoundary>
          <PageExperience />
          <App />
        </ErrorBoundary>
        <Toaster position="top-right" />
        </AccessibilityProvider>
      </ThemeProvider>
    </HashRouter>
  </React.StrictMode>,
);

// A coleta de métricas não participa da primeira renderização nem envia dados pessoais.
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const startMetrics = () => import('./performance/fieldMetrics').then(({ startFieldMetrics }) => startFieldMetrics()).catch(() => {});
  if (document.readyState === 'complete') startMetrics();
  else window.addEventListener('load', startMetrics, { once: true });
}
