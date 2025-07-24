import React from "react";
import ReactDOM from "react-dom/client";
import { initMercadoPago } from "@mercadopago/sdk-react";
import App from "./App.jsx";
import "./index.css";

// Inicializar MercadoPago
initMercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY);

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
