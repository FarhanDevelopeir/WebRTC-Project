import 'regenerator-runtime/runtime';
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'global';
import App from "./App.jsx";
import "./index.css";
import { ContextProvider } from "./ContextAzure.jsx";


createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </StrictMode>
);
