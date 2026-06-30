"use client";
import { useState } from "react";
import { Mail, X, ThumbsUp, ThumbsDown, Send, BookPlus, ChevronRight } from "lucide-react";

const PREV_LETTERS = [
  { book: "Crónicas de una muerte anunciada", author: "García Márquez", when: "Ayer" },
  { book: "El túnel", author: "Ernesto Sábato", when: "Hace 2 días" },
  { book: "Pedro Páramo", author: "Juan Rulfo", when: "Hace 3 días" },
];

const ALL_BADGES = [
  { emoji: "🔥", label: "7 días de racha", unlocked: true },
  { emoji: "📚", label: "5 libros leídos", unlocked: true },
  { emoji: "⭐", label: "Primera reseña", unlocked: true },
  { emoji: "🌙", label: "Lector nocturno", unlocked: true },
  { emoji: "🏆", label: "Meta mensual", unlocked: false },
  { emoji: "⚡", label: "Sesión maratón", unlocked: false },
];

export default function BuzonPage() {
  const [opened, setOpened] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Buzón Literario</h1>
        <p className="text-slate-500 text-sm mt-0.5">Una recomendación anónima te espera cada día</p>
      </div>

      {/* ── Daily letter envelope / opened card ── */}
      <div className="mb-4">
        {!opened ? (
          <button
            onClick={() => setOpened(true)}
            className="w-full max-w-lg mx-auto block"
          >
            <div className="bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent border-2 border-amber-700/35 rounded-2xl p-10 text-center hover:border-amber-600/60 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-amber-700/20 border border-amber-700/30 flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-700/30 transition-colors">
                <Mail size={28} className="text-amber-400" />
              </div>
              <p className="text-amber-400 font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>¡Tu carta llegó!</p>
              <p className="text-slate-500 text-sm mt-1.5">Haz clic para abrir</p>
            </div>
          </button>
        ) : (
          <div className="max-w-lg mx-auto bg-[#111827] border border-[#2E3D52] rounded-2xl overflow-hidden shadow-xl shadow-black/40">
            {/* Card header */}
            <div className="bg-gradient-to-r from-amber-900/20 to-transparent px-5 pt-4 pb-3 border-b border-[#1A2332] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail size={13} className="text-amber-500" />
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Recomendación del día</span>
              </div>
              <button onClick={() => setOpened(false)} className="w-6 h-6 rounded-full bg-[#1A2332] flex items-center justify-center text-slate-500 hover:text-white transition-colors">
                <X size={12} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex gap-4 mb-5">
                <div className="w-16 h-24 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex-shrink-0 border border-[#2E3D52]" />
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 mb-1">Misterio · Drama</div>
                  <h3 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: "Georgia, serif" }}>La sombra del viento</h3>
                  <p className="text-slate-400 text-sm mt-0.5">Carlos Ruiz Zafón</p>
                  <p className="text-xs text-slate-600 mt-0.5">2001 · 576 páginas</p>
                  <div className="flex gap-0.5 mt-2">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                  </div>
                </div>
              </div>

              {/* Anonymous review */}
              <div className="bg-[#1A2332] rounded-xl p-4 border border-[#2E3D52] mb-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-600/20 border border-amber-600/20 flex items-center justify-center">
                    <span className="text-[10px]">👤</span>
                  </div>
                  <span className="text-xs text-amber-500 font-semibold">Lector anónimo #2847</span>
                </div>
                <p className="text-sm text-slate-300 italic leading-relaxed">
                  Una historia que te atrapa desde la primera página. La obra tejió algo único — el Cementerio de los Libros Olvidados es uno de los lugares más memorables de la literatura contemporánea en español.
                </p>
              </div>

              {/* Reaction */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500">¿Te gustó esta recomendación?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLiked(true)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${liked === true ? "bg-green-600/20 border-green-600/40 text-green-400" : "bg-[#1A2332] border-[#2E3D52] text-slate-500 hover:text-green-400"}`}
                  >
                    <ThumbsUp size={13} />
                  </button>
                  <button
                    onClick={() => setLiked(false)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${liked === false ? "bg-red-600/20 border-red-600/40 text-red-400" : "bg-[#1A2332] border-[#2E3D52] text-slate-500 hover:text-red-400"}`}
                  >
                    <ThumbsDown size={13} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30">
                  <BookPlus size={14} />
                  Agregar a mi lista
                </button>
                <button onClick={() => setOpened(false)} className="px-5 py-3 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors">
                  Pasar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-slate-600 mb-8">
        Abre tu carta diaria — una recomendación anónima de otro lector
      </p>

      {/* Previous letters */}
      <div className="max-w-lg mx-auto mb-8">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Cartas anteriores</div>
        <div className="space-y-2">
          {PREV_LETTERS.map(l => (
            <button key={l.book} className="w-full flex items-center justify-between bg-[#111827] border border-[#1A2332] hover:border-[#2E3D52] rounded-xl px-4 py-3.5 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#1A2332] border border-[#2E3D52] flex items-center justify-center">
                  <Mail size={13} className="text-slate-500" />
                </div>
                <div className="text-left">
                  <div className="text-sm text-white font-medium">{l.book}</div>
                  <div className="text-xs text-slate-500">{l.author}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-400 transition-colors">
                <span className="text-xs">{l.when}</span>
                <ChevronRight size={13} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Send a letter */}
      <div className="max-w-lg mx-auto">
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Enviar una carta</div>
        <p className="text-xs text-slate-600 mb-3">Comparte una recomendación literaria anónima. Solo puedes enviar una carta cada 24 horas.</p>
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="¿Qué libro quieres recomendar hoy? Cuenta por qué te marcó…"
          rows={5}
          className="w-full bg-[#111827] border border-[#1A2332] rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 resize-none mb-3 transition-all"
        />
        <button
          disabled={message.length < 10}
          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20"
        >
          <Send size={14} />
          Enviar carta
        </button>
        <p className="text-center text-xs text-slate-600 mt-2">Mínimo 10 caracteres · completamente anónimo</p>
      </div>

      {/* Profile trigger */}
      <div className="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-30">
        <button
          onClick={() => setShowProfile(true)}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold shadow-lg shadow-amber-900/40 hover:scale-105 transition-transform"
        >
          M
        </button>
      </div>

      {/* Profile modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0" onClick={() => setShowProfile(false)}>
          <div className="bg-[#111827] rounded-2xl max-w-sm w-full border border-[#2E3D52] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Profile header */}
            <div className="bg-gradient-to-br from-amber-900/30 to-transparent rounded-t-2xl p-5 relative">
              <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <X size={14} />
              </button>
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xl font-bold text-white shadow-lg">M</div>
                <div>
                  <div className="font-bold text-white text-lg" style={{ fontFamily: "Georgia, serif" }}>María García</div>
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
                  {["Fantasía","Clásicos","Ciencia Ficción","Misterio"].map(g => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-amber-700/15 text-amber-400 border border-amber-700/25">{g}</span>
                  ))}
                </div>
              </div>

              {/* Badges */}
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Mis insignias</div>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_BADGES.map(b => (
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
      )}
    </div>
  );
}
