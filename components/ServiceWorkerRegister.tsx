"use client";

import { useEffect } from "react";

/**
 * Registra /public/sw.js apenas carga la app. Esto es lo que Chrome en
 * Android necesita para considerar el sitio "instalable" (mostrar
 * "Agregar a pantalla de inicio" / "Instalar app" en el menú), y además
 * habilita el soporte offline básico que ya cachea el sw.js.
 *
 * También recarga la página automáticamente cuando detecta que entró en
 * control una versión nueva del Service Worker (por ejemplo, después de
 * que subas un cambio a producción), para que siempre se use la versión
 * más reciente sin que el usuario tenga que limpiar caché a mano.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.warn("No se pudo registrar el service worker:", err));

    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  return null;
}