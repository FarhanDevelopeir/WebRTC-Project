import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import 'global';
import App from "./App.jsx";
import "./index.css";
import { ContextProvider } from "./SocketContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </StrictMode>
);
