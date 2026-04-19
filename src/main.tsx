import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import {
  AppErrorBoundary,
  DebugOverlay,
  installDebugCapture,
} from "./components/DebugOverlay";

document.documentElement.setAttribute("lang", "ar");
document.documentElement.setAttribute("dir", "rtl");

installDebugCapture();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
      <DebugOverlay />
    </AppErrorBoundary>
  </React.StrictMode>,
);
