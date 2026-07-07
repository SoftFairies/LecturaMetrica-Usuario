"use client";

import { useEffect } from "react";

/**
 * Registra /public/sw.js apenas carga la app. Es lo mínimo que Chrome en
 * Android necesita para considerar el sitio "instalable" y mostrar la
 * opción "Agregar a pantalla de inicio" / "Instalar app" en el menú.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("No se pudo registrar el service worker:", err));
  }, []);

  return null;
}
