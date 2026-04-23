import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client"; // ← named imports only, no ReactDOM
import App from "./App.jsx";
import "./index.css";

const rootElement = document.getElementById("root");

if (rootElement.hasChildNodes()) {
  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  createRoot(rootElement).render(   // ← was ReactDOM.createRoot, now just createRoot
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}