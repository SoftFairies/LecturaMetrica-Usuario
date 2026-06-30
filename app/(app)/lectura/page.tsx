"use client";
import { useState, useEffect, useRef } from "react";
import { Play, Square, Pause, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react";

export default function LecturaPage() {
  const [page, setPage] = useState(463);
  const [running, setRunning] = useState(false);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [notes, setNotes] = useState("");
  const [manualMinutes, setManualMinutes] = useState(30);
  const [showManual, setShowManual] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTotalSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const TOTAL_PAGES = 662;
  const progress = Math.round((page / TOTAL_PAGES) * 100);
  const displayMins = Math.floor(totalSeconds / 60);
  const displaySecs = totalSeconds % 60;
  const sessionMins = Math.floor(totalSeconds / 60);
  const GOAL_SECS = 45 * 60;
  const arcPct = Math.min(totalSeconds / GOAL_SECS, 1);

  // SVG arc helpers
  const R = 44;
  const circumference = 2 * Math.PI * R;

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Sesión de lectura</h1>
        <p className="text-slate-500 text-sm mt-0.5">Registra tu progreso en tiempo real</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* ── Left: Book + page ── */}
        <div className="bg-[#111827] rounded-2xl border border-[#1A2332] overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-[#1A2332]">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Leyendo ahora</span>
          </div>

          <div className="p-5">
            {/* Book info */}
            <div className="flex gap-4 mb-6 pb-5 border-b border-[#1A2332]">
              <div
                className="w-16 h-22 rounded-xl flex-shrink-0 shadow-lg"
                style={{ background: "linear-gradient(160deg,#c2410c,#7c2d12)", height: "88px" }}
              />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-white leading-snug" style={{ fontFamily: "Georgia, serif" }}>El nombre del viento</h2>
                <p className="text-slate-400 text-sm mt-0.5">Patrick Rothfuss</p>
                <div className="flex gap-0.5 mt-1.5">
                  {[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}
                </div>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Progreso total</span>
                    <span className="font-bold text-amber-400">{progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#2E3D52] rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">{page} / {TOTAL_PAGES} páginas</p>
                </div>
              </div>
            </div>

            {/* Page counter */}
            <div className="mb-5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Página actual</div>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="w-10 h-10 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all"
                >
                  <Minus size={14} />
                </button>
                <div className="flex-1 bg-[#1A2332] border border-[#2E3D52] rounded-xl py-2.5 text-center">
                  <input
                    type="number"
                    value={page}
                    onChange={e => setPage(Math.min(TOTAL_PAGES, Math.max(1, Number(e.target.value))))}
                    className="bg-transparent text-xl font-bold text-amber-400 text-center w-full focus:outline-none"
                    min={1}
                    max={TOTAL_PAGES}
                  />
                </div>
                <button
                  onClick={() => setPage(p => Math.min(TOTAL_PAGES, p + 1))}
                  className="w-10 h-10 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all"
                >
                  <Plus size={14} />
                </button>
                <div className="text-slate-500 text-sm pl-1">/ {TOTAL_PAGES}</div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Notas de la sesión</div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Observaciones, citas favoritas…"
                rows={5}
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* ── Right: Timer ── */}
        <div className="bg-[#111827] rounded-2xl border border-[#1A2332] overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-[#1A2332]">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Temporizador</span>
          </div>

          <div className="p-5">
            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{sessionMins}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">min. hoy</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">45</div>
                <div className="text-[10px] text-slate-500 mt-0.5">meta (min)</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">7</div>
                <div className="text-[10px] text-slate-500 mt-0.5">racha días 🔥</div>
              </div>
            </div>

            {/* Clock ring */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
                  {/* Track */}
                  <circle cx="50" cy="50" r={R} fill="none" stroke="#1E2A3A" strokeWidth="7" />
                  {/* Tick marks */}
                  {Array.from({ length: 12 }).map((_, i) => {
                    const angle = (i / 12) * 2 * Math.PI;
                    const x1 = 50 + 43 * Math.cos(angle);
                    const y1 = 50 + 43 * Math.sin(angle);
                    const x2 = 50 + 47 * Math.cos(angle);
                    const y2 = 50 + 47 * Math.sin(angle);
                    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#243044" strokeWidth="1.5" strokeLinecap="round" />;
                  })}
                  {/* Progress arc */}
                  <circle
                    cx="50" cy="50" r={R}
                    fill="none"
                    stroke="url(#goldGrad)"
                    strokeWidth="7"
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - arcPct)}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D4890A" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-bold text-white font-mono tabular-nums">
                    {String(displayMins).padStart(2, "0")}:{String(displaySecs).padStart(2, "0")}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">sesión activa</div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2.5">
              <div className="flex gap-2">
                <button
                  onClick={() => setRunning(r => !r)}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30"
                >
                  {running ? <Pause size={15} /> : <Play size={15} />}
                  {running ? "Pausar" : "Iniciar sesión"}
                </button>
                <button
                  onClick={() => { setRunning(false); setTotalSeconds(0); }}
                  className="w-12 h-12 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all"
                >
                  <Square size={14} />
                </button>
              </div>
              <button className="w-full py-3 bg-transparent border border-amber-700/40 text-amber-400 font-semibold text-sm rounded-xl hover:bg-amber-700/10 transition-all">
                Finalizar y guardar sesión
              </button>
            </div>

            {/* Manual time accordion */}
            <div className="mt-4 bg-[#1A2332] border border-[#2E3D52] rounded-xl overflow-hidden">
              <button
                onClick={() => setShowManual(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <span>¿No usaste el temporizador?</span>
                {showManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              {showManual && (
                <div className="px-4 pb-4 border-t border-[#2E3D52]">
                  <p className="text-xs text-slate-500 py-3">Registra cuánto tiempo leíste manualmente</p>
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Minutos leídos</div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <button
                      onClick={() => setManualMinutes(m => Math.max(1, m - 5))}
                      className="w-9 h-9 bg-[#111827] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white flex items-center justify-center"
                    >
                      <Minus size={13} />
                    </button>
                    <div className="flex-1 bg-[#111827] border border-[#2E3D52] rounded-xl py-2.5 text-center text-xl font-bold text-amber-400">
                      {manualMinutes}
                    </div>
                    <button
                      onClick={() => setManualMinutes(m => m + 5)}
                      className="w-9 h-9 bg-[#111827] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white flex items-center justify-center"
                    >
                      <Plus size={13} />
                    </button>
                    <span className="text-slate-500 text-sm">min</span>
                  </div>
                  <button className="w-full py-2.5 border border-amber-700/40 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-700/10 transition-all">
                    Guardar {manualMinutes} minutos de lectura
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
