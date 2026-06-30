"use client";
import { useState } from "react";
import { X, Check, Lock, Camera } from "lucide-react";
import Image from "next/image";

const AVATARS = [
  { id: "maria",    src: "/avatars/avatar-maria.svg",    name: "María" },
  { id: "juan",     src: "/avatars/avatar-juan.svg",     name: "Juan" },
  { id: "ana",      src: "/avatars/avatar-ana.svg",      name: "Ana" },
  { id: "carlos",   src: "/avatars/avatar-carlos.svg",   name: "Carlos" },
  { id: "luis",     src: "/avatars/avatar-luis.svg",     name: "Luis" },
  { id: "patricia", src: "/avatars/avatar-patricia.svg", name: "Patricia" },
  { id: "sara",     src: "/avatars/avatar-sara.svg",     name: "Sara" },
  { id: "anonimo",  src: "/avatars/avatar-anonimo.svg",  name: "Anónimo" },
];

const ALL_BADGES = [
  { id: "primera-racha",   src: "/badges/badge-primera-racha.svg",    label: "Primera racha",    desc: "Mantén la llama viva",              unlocked: true  },
  { id: "racha-7",         src: "/badges/badge-racha-7-dias.svg",     label: "Racha 7 días",     desc: "¡Una semana de fuego!",             unlocked: true  },
  { id: "racha-15",        src: "/badges/badge-racha-15-dias.svg",    label: "Racha 15 días",    desc: "Consistencia imparable",            unlocked: false },
  { id: "registrarse",     src: "/badges/badge-registrarse.svg",      label: "Registrarse",      desc: "¡Bienvenido a la comunidad!",       unlocked: true  },
  { id: "3-libros",        src: "/badges/badge-agregar-3-libros.svg", label: "Agregar 3 libros", desc: "Tu biblioteca crece",               unlocked: true  },
  { id: "buzon",           src: "/badges/badge-primer-buzon.svg",     label: "Primer buzón",     desc: "Primera recomendación enviada",     unlocked: false },
  { id: "primera-sesion",  src: "/badges/badge-primera-sesion.svg",   label: "Primera sesión",   desc: "¡Empieza a contar el tiempo!",      unlocked: true  },
  { id: "nocturno",        src: "/badges/badge-lector-nocturno.svg",  label: "Lector nocturno",  desc: "Las mejores horas son de noche",    unlocked: false },
];

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [selectedAvatar, setSelectedAvatar] = useState("maria");
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "insignias">("perfil");

  const currentAvatar = AVATARS.find((a) => a.id === selectedAvatar) ?? AVATARS[0];
  const unlockedCount = ALL_BADGES.filter((b) => b.unlocked).length;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl max-w-sm w-full border border-[#2E3D52] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-900/30 to-transparent rounded-t-2xl p-5 relative">
          <button onClick={onClose} className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>

          <div className="flex items-center gap-4">
            {/* Avatar clicable */}
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setChoosingAvatar(!choosingAvatar)}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 hover:border-amber-400 transition-all group shadow-lg"
                title="Cambiar avatar"
              >
                <Image src={currentAvatar.src} alt={currentAvatar.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera size={16} className="text-white" />
                </div>
              </button>
              <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-amber-500 rounded-full border-2 border-[#111827] flex items-center justify-center pointer-events-none">
                <Camera size={9} className="text-white" />
              </div>
            </div>

            <div>
              <div className="font-bold text-white text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                María García
              </div>
              <div className="text-xs text-slate-400 mt-0.5">Lectora apasionada · desde 2024</div>
              <div className="text-xs text-amber-400 font-semibold mt-1">7 días de racha 🔥</div>
            </div>
          </div>

          {/* Selector de avatares */}
          {choosingAvatar && (
            <div className="mt-4 bg-[#0D1117] rounded-2xl p-3 border border-[#2E3D52]">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">Elige tu avatar</p>
              <div className="grid grid-cols-4 gap-2">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    onClick={() => { setSelectedAvatar(av.id); setChoosingAvatar(false); }}
                    title={av.name}
                    className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedAvatar === av.id
                        ? "border-amber-500 scale-105 shadow-lg shadow-amber-900/40"
                        : "border-[#2E3D52] hover:border-amber-700/60 hover:scale-105"
                    }`}
                  >
                    <Image src={av.src} alt={av.name} width={64} height={64} className="w-full h-auto" unoptimized />
                    {selectedAvatar === av.id && (
                      <div className="absolute bottom-1 right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow">
                        <Check size={9} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-2.5">
                Seleccionado: <span className="text-amber-500 font-medium">{currentAvatar.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1E2A3A] px-5 pt-1">
          {(["perfil", "insignias"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2.5 pt-1 px-3 text-sm font-semibold capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab === "insignias" ? `Insignias (${unlockedCount}/${ALL_BADGES.length})` : "Perfil"}
            </button>
          ))}
        </div>

        {/* TAB: PERFIL */}
        {activeTab === "perfil" && (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-3 gap-2.5">
              {[{ v: "3", l: "Completados" }, { v: "4", l: "Leyendo" }, { v: "1320", l: "Páginas" }].map(({ v, l }) => (
                <div key={l} className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-white">{v}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{l}</div>
                </div>
              ))}
            </div>

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

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Géneros favoritos</div>
              <div className="flex flex-wrap gap-1.5">
                {["Fantasía", "Clásicos", "Ciencia Ficción", "Misterio"].map((g) => (
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-amber-700/15 text-amber-400 border border-amber-700/25">{g}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Insignias obtenidas</div>
                <button onClick={() => setActiveTab("insignias")} className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors">Ver todas →</button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {ALL_BADGES.filter((b) => b.unlocked).map((b) => (
                  <div key={b.id} title={b.label} className="w-11 h-11">
                    <Image src={b.src} alt={b.label} width={44} height={44} className="w-full h-full object-contain drop-shadow-md" unoptimized />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB: INSIGNIAS */}
        {activeTab === "insignias" && (
          <div className="p-5">
            <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3.5 mb-4 flex items-center gap-4">
              <div className="text-3xl font-bold text-amber-400">{unlockedCount}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-white mb-1.5">de {ALL_BADGES.length} insignias obtenidas</div>
                <div className="w-full h-1.5 bg-[#2E3D52] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(unlockedCount / ALL_BADGES.length) * 100}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {ALL_BADGES.map((b) => (
                <div
                  key={b.id}
                  className={`rounded-2xl border p-3 flex items-center gap-3 transition-all ${
                    b.unlocked ? "bg-[#1A2332] border-[#2E3D52]" : "bg-[#0D1117] border-[#1A2332] opacity-50"
                  }`}
                >
                  <div className="relative flex-shrink-0 w-14 h-14">
                    <Image
                      src={b.src}
                      alt={b.label}
                      width={56}
                      height={56}
                      className={`w-full h-full object-contain ${b.unlocked ? "drop-shadow-md" : "grayscale brightness-50"}`}
                      unoptimized
                    />
                    {!b.unlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-5 h-5 bg-[#0D1117]/90 rounded-full flex items-center justify-center">
                          <Lock size={10} className="text-slate-600" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-semibold leading-tight ${b.unlocked ? "text-white" : "text-slate-600"}`}>{b.label}</div>
                    <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{b.desc}</div>
                    <div className={`text-[10px] font-semibold mt-1.5 ${b.unlocked ? "text-amber-400" : "text-slate-700"}`}>
                      {b.unlocked ? "✓ Obtenida" : "Bloqueada"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
