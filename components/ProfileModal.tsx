"use client";
import { useEffect, useState } from "react";
import { X, Check, Lock, Camera } from "lucide-react";
import Image from "next/image";
import Swal from "sweetalert2";
import { api } from "@/data/api";

interface BadgeDef {
  id: string;
  src: string;
  label: string;
  desc: string;
}

const ALL_BADGES: BadgeDef[] = [
  { id: "primera_racha", src: "/badges/badge-primera-racha.svg", label: "Primera racha", desc: "Mantén la llama viva" },
  { id: "racha_7", src: "/badges/badge-racha-7-dias.svg", label: "Racha 7 días", desc: "¡Una semana de fuego!" },
  { id: "racha_15", src: "/badges/badge-racha-15-dias.svg", label: "Racha 15 días", desc: "Consistencia imparable" },
  { id: "registrarse", src: "/badges/badge-registrarse.svg", label: "Registrarse", desc: "¡Bienvenido a la comunidad!" },
  { id: "agregar_3", src: "/badges/badge-agregar-3-libros.svg", label: "Agregar 3 libros", desc: "Tu biblioteca crece" },
  { id: "primer_buzon", src: "/badges/badge-primer-buzon.svg", label: "Primer buzón", desc: "Primera recomendación enviada" },
  { id: "primera_sesion", src: "/badges/badge-primera-sesion.svg", label: "Primera sesión", desc: "¡Empieza a contar el tiempo!" },
  { id: "lector_nocturno", src: "/badges/badge-lector-nocturno.svg", label: "Lector nocturno", desc: "Las mejores horas son de noche" },
];

const BADGE_NAME_MATCHERS: Record<string, RegExp> = {
  primera_racha: /primera.*racha/i,
  racha_7: /racha.*7|7.*d[ií]as|semana/i,
  racha_15: /racha.*15|15.*d[ií]as/i,
  registrarse: /registr/i,
  agregar_3: /3.*libro|agregar.*libro/i,
  primer_buzon: /buz[oó]n/i,
  primera_sesion: /sesi[oó]n/i,
  lector_nocturno: /noctur/i,
};

interface ProfileModalProps {
  onClose: () => void;
}

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "insignias">("perfil");

  const [user, setUser] = useState<any | null>(null);
  const [stats, setStats] = useState({ completed: 0, reading: 0, pages: 0 });
  const [unlocked, setUnlocked] = useState<Record<string, boolean>>({});
  const [badgeImages, setBadgeImages] = useState<Record<string, string>>({});
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [availablePictures, setAvailablePictures] = useState<Array<{ id: number; url: string; name?: string }>>([]);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editLastname, setEditLastname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");

  // Evita disparar el mismo PUT /users/me varias veces si el usuario
  // hace doble clic (o mantiene presionado Enter) mientras la petición
  // anterior sigue en curso.
  const [saving, setSaving] = useState(false);

  const passwordIsValid = (p: string) => {
    if (!p) return true; // vacío = sin cambio
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(p);
  };

  const passwordError = editPassword.length > 0 && !passwordIsValid(editPassword);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const me = await api.users.getMe();
        if (!active) return;
        setUser(me);
      } catch (_) {
        // no autenticado / error de red
      }

      try {
        const libs = await api.library.getAll();
        if (!active) return;

        const completed = libs.filter((l) => l.readingStatus?.name === "Terminado").length;
        const reading = libs.filter((l) => l.readingStatus?.name === "Leyendo").length;
        const pages = libs.reduce((acc, l) => acc + (l.currentPage ?? 0), 0);
        setStats({ completed, reading, pages });

        setUnlocked({
          registrarse: true,
          agregar_3: libs.length >= 3,
          primera_sesion: libs.some((l) => (l.currentPage ?? 0) > 0),
          primera_racha: false,
          racha_7: false,
          racha_15: false,
          primer_buzon: false,
          lector_nocturno: false,
        });
      } catch (_) {
        // sin librería todavía
      }

      try {
        const earned = await api.gamification.getMyBadges();
        if (!active) return;
        const unlockedMap: Record<string, boolean> = {
          registrarse: true,
          agregar_3: false,
          primera_sesion: false,
          primera_racha: false,
          racha_7: false,
          racha_15: false,
          primer_buzon: false,
          lector_nocturno: false,
        };
        const images: Record<string, string> = {};

        for (const badge of earned) {
          const match = ALL_BADGES.find((local) => {
            if (String(local.id) === String(badge.id)) return true;
            if (local.label === badge.name) return true;
            const matcher = BADGE_NAME_MATCHERS[local.id];
            return matcher?.test(badge.name);
          });
          if (match) {
            unlockedMap[match.id] = true;
            if (badge.url) images[match.id] = badge.url;
          }
        }

        setUnlocked((prev) => ({ ...prev, ...unlockedMap }));
        setBadgeImages((prev) => ({ ...prev, ...images }));
      } catch (_) {
        try {
          const page = await api.badges.getAll({ size: 50 });
          if (!active) return;
          const images: Record<string, string> = {};
          for (const local of ALL_BADGES) {
            const matcher = BADGE_NAME_MATCHERS[local.id];
            const match = page.content.find((b) => matcher?.test(b.name));
            if (match) images[local.id] = match.url;
          }
          setBadgeImages(images);
        } catch (_) {
          // catálogo no disponible: se usan los íconos locales
        }
      }

      try {
        const picsPage = await api.pictures.getAll({ size: 50 });
        if (!active) return;
        setAvailablePictures(picsPage.content.map((p: any) => ({ id: p.id, url: p.url, name: p.name })));
      } catch (_) {
        // no bloquear si falla el catálogo de fotos
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setEditName(user.name ?? "");
    setEditLastname(user.lastname ?? "");
    setEditEmail(user.email ?? "");
    if (user.pictureId) {
      setSelectedAvatarId(String(user.pictureId));
    }
  }, [user]);

  const currentAvatarSrc =
    user?.pictureUrl ?? availablePictures.find((p) => String(p.id) === selectedAvatarId)?.url ?? "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

  const selectPublicAvatar = async (pictureId: string) => {
    const picObj = availablePictures.find((p) => String(p.id) === pictureId);
    if (!picObj || !user || selecting) return;

    setSelecting(true);
    try {
      await api.users.updateMe({
        name: user.name ?? "Usuario",
        lastname: user.lastname ?? "",
        email: user.email ?? "",
        pictureId: Number(pictureId),
      });

      const me = await api.users.getMe();
      setUser(me);
      setSelectedAvatarId(pictureId);
      setChoosingAvatar(false);

      Swal.fire({
        icon: "success",
        title: "Avatar actualizado",
        text: "Tu foto de perfil se actualizó correctamente.",
      });
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.message || "No se pudo actualizar el avatar en el servidor.",
      });
    } finally {
      setSelecting(false);
    }
  };

  const unlockedCount = ALL_BADGES.filter((b) => unlocked[b.id]).length;

  const saveProfile = async () => {
    // Guard: si ya hay un guardado en curso, ignora clics/entradas repetidas.
    if (saving) return;

    if (passwordError) {
      Swal.fire({
        icon: "warning",
        title: "Contraseña inválida",
        text: "La contraseña debe contener una mayúscula, un número, un carácter especial y tener al menos 8 caracteres.",
      });
      return;
    }

    const payload: any = {};
    if (editName) payload.name = editName;
    if (editLastname) payload.lastname = editLastname;
    if (editEmail) payload.email = editEmail;
    if (editPassword) payload.password = editPassword;
    if (Object.keys(payload).length === 0) {
      Swal.fire({ icon: "info", title: "Nada para guardar", text: "No hay cambios en el perfil." });
      return;
    }

    setSaving(true);
    try {
      const updated = await api.users.updateMe(payload);
      setUser(updated);
      setEditPassword("");
      Swal.fire({ icon: "success", title: "Perfil actualizado", text: "Tus datos se guardaron correctamente." });
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "Error", text: err?.message || "No se pudo actualizar el perfil." });
    } finally {
      setSaving(false);
    }
  };

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
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setChoosingAvatar(!choosingAvatar)}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 hover:border-amber-400 transition-all group shadow-lg"
                title="Cambiar avatar"
              >
                <Image src={currentAvatarSrc} alt={user?.name ?? "avatar"} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                  <Camera size={16} className="text-white" />
                </div>
              </button>
            </div>

            <div>
              <div className="font-bold text-white text-lg leading-tight" style={{ fontFamily: "Georgia, serif" }}>
                {user ? `${user.name ?? ""} ${user.lastname ?? ""}`.trim() || "Usuario" : "Usuario"}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">{user?.email ?? ""}</div>
              <div className="text-xs text-amber-400 font-semibold mt-1">
                {stats.reading} leyendo · {stats.completed} completados
              </div>
            </div>
          </div>

          {choosingAvatar && (
            <div className="mt-4 bg-[#0D1117] rounded-2xl p-3 border border-[#2E3D52]">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-3 font-semibold">Elige tu avatar</p>
              <div className="grid grid-cols-4 gap-2">
                {availablePictures.length > 0 ? (
                  availablePictures.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => selectPublicAvatar(String(p.id))}
                      title={p.name ?? `Foto ${p.id}`}
                      disabled={selecting}
                      className={`relative rounded-xl overflow-hidden border-2 transition-all ${
                        selectedAvatarId === String(p.id)
                          ? "border-amber-500 scale-105 shadow-lg shadow-amber-900/40"
                          : "border-[#2E3D52] hover:border-amber-700/60 hover:scale-105"
                      }`}
                    >
                      <Image src={p.url} alt={p.name ?? "foto"} width={64} height={64} className="w-full h-auto" unoptimized />
                      {selectedAvatarId === String(p.id) && (
                        <div className="absolute bottom-1 right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow">
                          <Check size={9} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-500 col-span-4">No hay fotos disponibles</div>
                )}
              </div>
              <p className="text-[10px] text-slate-600 text-center mt-2.5">
                Seleccionado: <span className="text-amber-500 font-medium">{availablePictures.find((a) => String(a.id) === selectedAvatarId)?.name ?? user?.name ?? "Usuario"}</span>
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
              <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{stats.completed}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Completados</div>
              </div>
              <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{stats.reading}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Leyendo</div>
              </div>
              <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3 text-center">
                <div className="text-xl font-bold text-white">{stats.pages}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Páginas</div>
              </div>
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
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-amber-700/15 text-amber-400 border border-amber-700/25">
                    {g}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3">
                <div className="text-sm font-semibold text-white mb-2">Editar perfil</div>
                <div className="grid grid-cols-1 gap-2">
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Nombre" disabled={saving} className="bg-[#0B1320] border border-[#2E3D52] rounded-md px-3 py-2 text-sm text-white disabled:opacity-50" />
                  <input value={editLastname} onChange={(e) => setEditLastname(e.target.value)} placeholder="Apellido" disabled={saving} className="bg-[#0B1320] border border-[#2E3D52] rounded-md px-3 py-2 text-sm text-white disabled:opacity-50" />
                  <input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} placeholder="Correo electrónico" disabled={saving} className="bg-[#0B1320] border border-[#2E3D52] rounded-md px-3 py-2 text-sm text-white disabled:opacity-50" />
                  <input value={editPassword} onChange={(e) => setEditPassword(e.target.value)} placeholder="Nueva contraseña" type="password" disabled={saving} className="bg-[#0B1320] border border-[#2E3D52] rounded-md px-3 py-2 text-sm text-white disabled:opacity-50" />
                  {passwordError && (
                    <div className="text-[11px] text-red-400 pt-1">
                      La contraseña debe contener una mayúscula, un número, un carácter especial y tener al menos 8 caracteres.
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] text-slate-400">La contraseña debe tener mayúscula, número, carácter especial y mínimo 8 caracteres.</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={saveProfile}
                        disabled={passwordError || saving}
                        className="text-xs px-3 py-1 rounded-md bg-amber-500 text-black font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Insignias obtenidas</div>
                <button onClick={() => setActiveTab("insignias")} className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors">
                  Ver todas →
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                {ALL_BADGES.filter((b) => unlocked[b.id]).map((b) => (
                  <div key={b.id} title={b.label} className="w-11 h-11">
                    <Image src={badgeImages[b.id] ?? b.src} alt={b.label} width={44} height={44} className="w-full h-full object-contain drop-shadow-md" unoptimized />
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
              {ALL_BADGES.map((b) => {
                const isUnlocked = !!unlocked[b.id];
                return (
                  <div
                    key={b.id}
                    className={`rounded-2xl border p-3 flex items-center gap-3 transition-all ${
                      isUnlocked ? "bg-[#1A2332] border-[#2E3D52]" : "bg-[#0D1117] border-[#1A2332] opacity-50"
                    }`}
                  >
                    <div className="relative flex-shrink-0 w-14 h-14">
                      <Image
                        src={badgeImages[b.id] ?? b.src}
                        alt={b.label}
                        width={56}
                        height={56}
                        className={`w-full h-full object-contain ${isUnlocked ? "drop-shadow-md" : "grayscale brightness-50"}`}
                        unoptimized
                      />
                      {!isUnlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-5 h-5 bg-[#0D1117]/90 rounded-full flex items-center justify-center">
                            <Lock size={10} className="text-slate-600" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className={`text-xs font-semibold leading-tight ${isUnlocked ? "text-white" : "text-slate-600"}`}>{b.label}</div>
                      <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">{b.desc}</div>
                      <div className={`text-[10px] font-semibold mt-1.5 ${isUnlocked ? "text-amber-400" : "text-slate-700"}`}>
                        {isUnlocked ? "✓ Obtenida" : "Bloqueada"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
