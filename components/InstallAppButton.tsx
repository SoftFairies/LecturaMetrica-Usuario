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
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      Boolean(
        (window.navigator as Navigator & { standalone?: boolean }).standalone
      );

    if (standalone) {
      setIsInstalled(true);
      return;
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const appleDevice = /iphone|ipad|ipod/.test(userAgent);

    setIsIOS(appleDevice);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();

      setInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setVisible(false);
      setInstallPrompt(null);
    };

    window.addEventListener(
      "beforeinstallprompt",
      handleInstallPrompt
    );

    window.addEventListener("appinstalled", handleInstalled);

    if (appleDevice) {
      setVisible(true);
    }

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleInstallPrompt
      );

      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();

    const result = await installPrompt.userChoice;

    if (result.outcome === "accepted") {
      setVisible(false);
    }

    setInstallPrompt(null);
  };

  if (isInstalled || !visible) return null;

  return (
    <div className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-amber-500/30 bg-[#111827] p-4 shadow-2xl shadow-black/50">
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-3 text-slate-500 transition-colors hover:text-white"
        aria-label="Cerrar"
      >
        <X size={17} />
      </button>

      <h3 className="pr-7 text-base font-semibold text-white">
        Instala LecturaMétrica
      </h3>

      {isIOS ? (
        <>
          <p className="mt-1 text-sm leading-relaxed text-slate-400">
            Instala la aplicación para acceder rápidamente desde tu pantalla de
            inicio.
          </p>

          <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#1A2332] p-3 text-sm text-slate-300">
            <Share2 size={18} className="shrink-0 text-amber-400" />

            <span>
              Presiona <strong>Compartir</strong> y después selecciona{" "}
              <strong>Agregar a pantalla de inicio</strong>.
            </span>
          </div>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-slate-400">
            Agrégala a tu teléfono y úsala como una aplicación.
          </p>

          <button
            type="button"
            onClick={handleInstall}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 px-4 py-3 text-sm font-semibold text-white transition hover:from-amber-400 hover:to-amber-600"
          >
            <Download size={18} />
            Instalar aplicación
          </button>
        </>
      )}
    </div>
  );
}