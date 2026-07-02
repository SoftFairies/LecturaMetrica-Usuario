"use client";
import { X } from "lucide-react";

const ALL_BADGES = [
  { emoji: "🔥", label: "7 días de racha", unlocked: true },
  { emoji: "📚", label: "5 libros leídos", unlocked: true },
  { emoji: "⭐", label: "Primera reseña", unlocked: true },
  { emoji: "🌙", label: "Lector nocturno", unlocked: true },
  { emoji: "🏆", label: "Meta mensual", unlocked: false },
  { emoji: "⚡", label: "Sesión maratón", unlocked: false },
];

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl max-w-sm w-full border border-[#2E3D52] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Profile header */}
        <div className="bg-gradient-to-br from-amber-900/30 to-transparent rounded-t-2xl p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-bold text-white shadow-lg">
              M
            </div>
            <div>
              <div className="font-bold text-white text-lg" style={{ fontFamily: "Georgia, serif" }}>
                María García
              </div>
              <div className="text-xs text-slate-400">Lectora apasionada · desde 2024</div>
              <div className="text-xs text-amber-400 font-semibold mt-0.5">7 días de racha 🔥</div>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {[{ v: "3", l: "Completados" }, { v: "4", l: "Leyendo" }, { v: "1320", l: "Páginas" }].map(({ v, l }) => (
              <div key={l} className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{v}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{l}</div>
              </div>
            ))}
          </div>

          {/* Annual goal */}
          <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white">Meta anual 2025</span>
              <span className="text-xs font-bold text-amber-400">3 / 24 libros</span>
            </div>
            <div className="w-full h-1.5 bg-[#2E3D52] rounded-full overflow-hidden mb-1">
              <div className="h-full bg-amber-500 rounded-full" style={{ width: "13%" }} />
            </div>
            <p className="text-[10px] text-slate-500">13% completado · 21 libros restantes</p>
          </div>

          {/* Favorite genres */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Géneros favoritos</div>
            <div className="flex flex-wrap gap-1.5">
              {["Fantasía", "Clásicos", "Ciencia Ficción", "Misterio"].map((g) => (
                <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-amber-700/15 text-amber-400 border border-amber-700/25">
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Badges */}
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Mis insignias</div>
            <div className="grid grid-cols-2 gap-2">
              {ALL_BADGES.map((b) => (
                <div
                  key={b.label}
                  className={`rounded-xl p-3 border ${b.unlocked ? "bg-[#1A2332] border-[#2E3D52]" : "bg-[#111827] border-[#1A2332] opacity-40"}`}
                >
                  <div className="text-2xl mb-1.5">{b.emoji}</div>
                  <div className="text-xs text-white font-medium leading-tight">{b.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {b.unlocked ? "✓ Obtenida" : "Bloqueada"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
