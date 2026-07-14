"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      console.warn("Este navegador no soporta Service Workers.");
      return;
    }

    const register = async () => {
      try {
        const oldRegistrations =
          await navigator.serviceWorker.getRegistrations();

        for (const registration of oldRegistrations) {
          await registration.update();
        }

        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
          updateViaCache: "none",
        });

        console.log("PWA: Service Worker registrado:", registration.scope);
      } catch (error) {
        console.error("PWA: error registrando Service Worker:", error);
      }
    };

    void register();
  }, []);

  return null;
}