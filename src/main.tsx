import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

// Apply Arabic RTL by default, matching our locale-aware UI.
document.documentElement.setAttribute("lang", "ar");
document.documentElement.setAttribute("dir", "rtl");

// Surface uncaught errors in production builds (helps diagnose blank-screen
// reports from users who can open DevTools with Ctrl+Shift+I).
window.addEventListener("error", (e) => {
  console.error("[uncaught]", e.error ?? e.message);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[unhandledrejection]", e.reason);
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
