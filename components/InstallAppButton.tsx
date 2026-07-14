"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export default function InstallAppButton() {
  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone,
      );

    setIsInstalled(standalone);

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const handlePrompt = (event: Event) => {
      event.preventDefault();

      console.log("PWA: beforeinstallprompt recibido");

      setInstallEvent(event as BeforeInstallPromptEvent);
      setDismissed(false);
    };

    const handleInstalled = () => {
      console.log("PWA instalada correctamente");

      setIsInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!installEvent) {
      console.warn("PWA: el navegador todavía no habilitó la instalación.");
      return;
    }

    await installEvent.prompt();

    const choice = await installEvent.userChoice;

    console.log("PWA: resultado de instalación:", choice.outcome);

    if (choice.outcome === "accepted") {
      setIsInstalled(true);
    }

    setInstallEvent(null);
  };

  if (isInstalled || dismissed) return null;

  if (!isIOS && !installEvent) {
    return null;
  }

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-500/30 bg-[#111827] p-4 shadow-2xl">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-3 text-slate-500 hover:text-white"
        aria-label="Cerrar"
      >
        <X size={17} />
      </button>

      <h3 className="pr-7 font-semibold text-white">
        Instala LecturaMétrica
      </h3>

      {isIOS ? (
        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#1A2332] p-3">
          <Share2 className="mt-0.5 shrink-0 text-amber-400" size={18} />

          <p className="text-sm text-slate-300">
            Presiona <strong>Compartir</strong> y después{" "}
            <strong>Agregar a pantalla de inicio</strong>.
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={install}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-4 py-3 font-semibold text-white"
        >
          <Download size={18} />
          Instalar aplicación
        </button>
      )}
    </div>
  );
}