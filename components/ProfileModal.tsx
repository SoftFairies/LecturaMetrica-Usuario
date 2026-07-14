"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Check, Lock, Camera } from "lucide-react";
import Image from "next/image";
import Swal from "sweetalert2";
import { api } from "@/data/api";

interface ApiBadge {
  id?: number | string;
  badgeId?: number | string;
  name: string;
  description?: string;
  url?: string;
  earnedAt?: string;
}

interface ProfileModalProps {
  onClose: () => void;
}

const getBadgeKey = (badge: ApiBadge) => String(badge.badgeId ?? badge.id ?? badge.name);

export default function ProfileModal({ onClose }: ProfileModalProps) {
  const [mounted, setMounted] = useState(false);
  const [choosingAvatar, setChoosingAvatar] = useState(false);
  const [activeTab, setActiveTab] = useState<"perfil" | "insignias">("perfil");

  const [user, setUser] = useState<any | null>(null);
  const [stats, setStats] = useState({ completed: 0, reading: 0, pages: 0 });
  const [annualGoal, setAnnualGoal] = useState(0);

  const [badges, setBadges] = useState<ApiBadge[]>([]);
  const [earnedBadgeKeys, setEarnedBadgeKeys] = useState<Record<string, boolean>>({});

  const [selectedAvatarId, setSelectedAvatarId] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const [availablePictures, setAvailablePictures] = useState<Array<{ id: number; url: string; name?: string }>>([]);
  const [favoriteGenres, setFavoriteGenres] = useState<string[]>([]);

  const [editName, setEditName] = useState("");
  const [editLastname, setEditLastname] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const passwordIsValid = (p: string) => {
    if (!p) return true;
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(p);
  };

  const passwordError = editPassword.length > 0 && !passwordIsValid(editPassword);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const me = await api.users.getMe();
        if (!active) return;

        setUser(me);

        const backendGoal = Number((me as any)?.annualGoal);

        if (Number.isFinite(backendGoal) && backendGoal > 0) {
          setAnnualGoal(Math.trunc(backendGoal));
        } else {
          setAnnualGoal(0);
        }
      } catch (error) {
        console.error("No se pudo cargar la meta anual desde /users/me:", error);
        if (active) setAnnualGoal(0);
      }

      try {
        const libsPage = await api.library.getAll({ page: 0, size: 100 });
        if (!active) return;

        const libs = libsPage.content ?? [];
        const completed = libs.filter((l: any) => l.readingStatusName === "Terminado").length;
        const reading = libs.filter((l: any) => l.readingStatusName === "Leyendo").length;
        const pages = libs.reduce((acc: number, l: any) => acc + (l.currentPage ?? 0), 0);

        setStats({ completed, reading, pages });
      } catch {
        setStats({ completed: 0, reading: 0, pages: 0 });
      }

      try {
        const page = await api.badges.getAll({ page: 0, size: 100 });
        if (!active) return;

        const apiBadges = Array.isArray(page?.content) ? page.content : [];
        setBadges(apiBadges);
      } catch {
        if (active) setBadges([]);
      }

      try {
        const earned = await api.gamification.getMyBadges();
        if (!active) return;

        const uniqueEarned: ApiBadge[] = [];
        const earnedMap: Record<string, boolean> = {};
        const seen: Record<string, boolean> = {};

        for (const badge of Array.isArray(earned) ? earned : []) {
          const key = getBadgeKey(badge);
          earnedMap[key] = true;

          if (!seen[key]) {
            seen[key] = true;
            uniqueEarned.push(badge);
          }
        }

        setEarnedBadgeKeys(earnedMap);

        setBadges((current) => {
          if (current.length > 0) return current;
          return uniqueEarned;
        });
      } catch {
        if (active) setEarnedBadgeKeys({});
      }

      try {
        const picsPage = await api.pictures.getAll({ size: 50 });
        if (!active) return;

        setAvailablePictures(
          picsPage.content.map((p: any) => ({ id: p.id, url: p.url, name: p.name })),
        );
      } catch {
      }

      try {
        const preferences = await api.preferences.get();
        if (!active) return;

        setFavoriteGenres(
          Array.isArray(preferences?.genres)
            ? preferences.genres
                .map((genre: any) =>
                  typeof genre === "string"
                    ? genre
                    : genre?.name ?? genre?.genreName ?? "",
                )
                .filter((genreName: string) => genreName.trim().length > 0)
            : [],
        );
      } catch {
        if (active) setFavoriteGenres([]);
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
    user?.pictureUrl ??
    availablePictures.find((p) => String(p.id) === selectedAvatarId)?.url ??
    "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

  const unlockedCount = useMemo(
    () => badges.filter((badge) => earnedBadgeKeys[getBadgeKey(badge)]).length,
    [badges, earnedBadgeKeys],
  );

  const selectPublicAvatar = async (pictureId: string) => {
    if (selecting) return;

    setSelecting(true);

    try {
      await api.users.updateMe({ pictureId: Number(pictureId) });

      const me = await api.users.getMe();
      setUser(me);
      setSelectedAvatarId(String(me.pictureId ?? pictureId));
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
        text: err?.message || "No se pudo actualizar el avatar.",
      });
    } finally {
      setSelecting(false);
    }
  };

  const saveProfile = async () => {
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

    if (editName !== (user?.name ?? "")) payload.name = editName;
    if (editLastname !== (user?.lastname ?? "")) payload.lastname = editLastname;
    if (editEmail !== (user?.email ?? "")) payload.email = editEmail;
    if (editPassword.trim() !== "") payload.password = editPassword;

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

  const goalProgress = annualGoal > 0 ? Math.min(100, Math.round((stats.completed / annualGoal) * 100)) : 0;
  const remainingBooks = Math.max(0, annualGoal - stats.completed);
  const currentYear = new Date().getFullYear();

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl max-w-sm w-full border border-[#2E3D52] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-br from-amber-900/30 to-transparent rounded-t-2xl p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setChoosingAvatar(!choosingAvatar)}
                className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/60 hover:border-amber-400 transition-all group shadow-lg"
                title="Cambiar avatar"
              >
                <Image
                  src={currentAvatarSrc}
                  alt={user?.name ?? "avatar"}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  unoptimized
                />
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
            </div>
          )}
        </div>

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
              {tab === "insignias" ? `Insignias (${unlockedCount}/${badges.length})` : "Perfil"}
            </button>
          ))}
        </div>

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
                <span className="text-sm font-semibold text-white">Meta anual {currentYear}</span>
                <span className="text-xs font-bold text-amber-400">{annualGoal > 0 ? `${stats.completed} / ${annualGoal} libros` : "Meta sin definir"}</span>
              </div>

              <div className="w-full h-1.5 bg-[#2E3D52] rounded-full overflow-hidden mb-1">
                <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${goalProgress}%` }} />
              </div>

              <p className="text-[10px] text-slate-500">
                {annualGoal > 0 ? `${goalProgress}% completado · ${remainingBooks} libros restantes` : "Configura tu meta anual en el registro o perfil."}
              </p>
            </div>

            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Géneros favoritos</div>
              <div className="flex flex-wrap gap-1.5">
                {favoriteGenres.length > 0 ? (
                  favoriteGenres.map((g) => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-amber-700/15 text-amber-400 border border-amber-700/25">
                      {g}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Aún no seleccionaste géneros favoritos.</span>
                )}
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

              <div className="mt-3 flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Insignias obtenidas</div>
                <button onClick={() => setActiveTab("insignias")} className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors">
                  Ver todas →
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                {badges.filter((b) => earnedBadgeKeys[getBadgeKey(b)]).map((b) => (
                  <div key={getBadgeKey(b)} title={b.name} className="w-11 h-11">
                    {b.url ? (
                      <Image src={b.url} alt={b.name} width={44} height={44} className="w-full h-full object-contain drop-shadow-md" unoptimized />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-amber-500/20 border border-amber-500/40" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "insignias" && (
          <div className="p-5">
            <div className="bg-[#1A2332] border border-[#2E3D52] rounded-xl p-3.5 mb-4 flex items-center gap-4">
              <div className="text-3xl font-bold text-amber-400">{unlockedCount}</div>
              <div className="flex-1">
                <div className="text-xs font-semibold text-white mb-1.5">
                  de {badges.length} insignias obtenidas
                </div>
                <div className="w-full h-1.5 bg-[#2E3D52] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{ width: badges.length > 0 ? `${(unlockedCount / badges.length) * 100}%` : "0%" }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {badges.length > 0 ? (
                badges.map((badge) => {
                  const key = getBadgeKey(badge);
                  const isUnlocked = !!earnedBadgeKeys[key];

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border p-3 flex items-center gap-3 transition-all ${
                        isUnlocked ? "bg-[#1A2332] border-[#2E3D52]" : "bg-[#0D1117] border-[#1A2332] opacity-50"
                      }`}
                    >
                      <div className="relative flex-shrink-0 w-14 h-14">
                        {badge.url ? (
                          <Image
                            src={badge.url}
                            alt={badge.name}
                            width={56}
                            height={56}
                            className={`w-full h-full object-contain ${isUnlocked ? "drop-shadow-md" : "grayscale brightness-50"}`}
                            unoptimized
                          />
                        ) : (
                          <div className={`w-14 h-14 rounded-full border ${isUnlocked ? "bg-amber-500/20 border-amber-500/40" : "bg-slate-800 border-slate-700"}`} />
                        )}

                        {!isUnlocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-5 h-5 bg-[#0D1117]/90 rounded-full flex items-center justify-center">
                              <Lock size={10} className="text-slate-600" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className={`text-xs font-semibold leading-tight ${isUnlocked ? "text-white" : "text-slate-600"}`}>
                          {badge.name}
                        </div>
                        <div className="text-[10px] text-slate-600 mt-0.5 leading-tight">
                          {badge.description || "Insignia de LecturaMétrica"}
                        </div>
                        <div className={`text-[10px] font-semibold mt-1.5 ${isUnlocked ? "text-amber-400" : "text-slate-700"}`}>
                          {isUnlocked ? "✓ Obtenida" : "Bloqueada"}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-500 col-span-2">
                  No se pudieron cargar las insignias desde la API.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
