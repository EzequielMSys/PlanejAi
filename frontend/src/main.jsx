import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import "./index.css";
import "./BrandSystem.css";
import "./SurfaceRefinements.css";
import "./LatestUIFixes.css";
import "./LastMile.css";
import "./PublicRefinements.css";
import "./PlanejDesignSystem.css";
import "./DarkContrast.css";
import "./ExperienceFoundation.css";
import "./Accessibility.css";
import "./VisualEvolution.css";
import App from "./App.jsx";
import { HashRouter } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import ErrorBoundary from "./components/ErrorBoundary";
import PageExperience from "./components/PageExperience";
import { registerServiceWorker } from "./registerServiceWorker";

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
