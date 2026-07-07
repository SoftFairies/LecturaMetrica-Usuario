"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  Library,
  Clock,
  BarChart2,
  Mail,
  Sun,
  Moon,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import ProfileModal from "@/components/ProfileModal";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/data/api";

const NAV = [
  { href: "/biblioteca", icon: Library, label: "Biblioteca" },
  { href: "/lectura", icon: Clock, label: "Lectura" },
  { href: "/estadisticas", icon: BarChart2, label: "Estadísticas" },
  { href: "/buzon", icon: Mail, label: "Buzón" },
];

type SidebarBadge = {
  id?: string | number;
  name: string;
  emoji?: string;
  icon?: string;
  url?: string;
  unlocked: boolean;
};

const FALLBACK_BADGES: SidebarBadge[] = [
  { name: "Racha", emoji: "🔥", unlocked: false },
  { name: "Lector", emoji: "📚", unlocked: false },
  { name: "Favorito", emoji: "⭐", unlocked: false },
  { name: "Nocturno", emoji: "🌙", unlocked: false },
  { name: "Trofeo", emoji: "🏆", unlocked: false },
  { name: "Velocidad", emoji: "⚡", unlocked: false },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
}

function normalizeBadge(raw: any): SidebarBadge {
  return {
    id: raw?.id,
    name: raw?.name || raw?.title || "Insignia",
    emoji: raw?.emoji || raw?.icon || raw?.symbol || "🏅",
    icon: raw?.icon,
    url: raw?.url || raw?.imageUrl || raw?.pictureUrl,
    unlocked: true,
  };
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const darkMode = theme === "dark";

  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState("Usuario");
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [badges, setBadges] = useState<SidebarBadge[]>([]);

  const badgeCount = badges.length;
  const initials = useMemo(() => getInitials(userName), [userName]);

  const visibleBadges = badges.length > 0 ? badges : FALLBACK_BADGES;

  const renderAvatar = (sizeClass: string, textClass: string, onlyFirstLetter = false) => {
    if (profileImageUrl) {
      return (
        <img
          src={profileImageUrl}
          alt="Foto de perfil"
          onError={() => setProfileImageUrl("")}
          className={`${sizeClass} rounded-full object-cover border border-amber-600/40 flex-shrink-0`}
        />
      );
    }

    return (
      <div
        className={`${sizeClass} rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center font-bold text-white flex-shrink-0 ${textClass}`}
      >
        {onlyFirstLetter ? initials.charAt(0) : initials}
      </div>
    );
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      try {
        const user = await api.users.getMe();
        if (!active) return;

        const fullName = `${user?.name ?? ""} ${user?.lastname ?? ""}`.trim();
        const pictureUrl =
          user?.pictureUrl ||
          "";

        setUserName(fullName || user?.email || "Usuario");
        setProfileImageUrl(pictureUrl);
      } catch (error) {
        console.error("Error cargando usuario:", error);
        if (active) {
          setUserName("Usuario");
          setProfileImageUrl("");
        }
      }
    };

    const loadBadges = async () => {
      try {
        const apiBadges = await api.gamification.getMyBadges();
        if (!active) return;

        const normalized = Array.isArray(apiBadges)
          ? apiBadges.map(normalizeBadge)
          : [];

        setBadges(normalized);
      } catch (error) {
        console.error("Error cargando insignias:", error);
        if (active) setBadges([]);
      }
    };

    void loadUser();
    void loadBadges();

    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <aside
        className={`hidden md:flex flex-col min-h-screen bg-[#0D1117] border-r border-[#1A2332] py-6 flex-shrink-0 transition-all duration-200 ${
          collapsed ? "w-[76px] px-2" : "w-[220px] px-4"
        }`}
      >
        <div
          className={`flex items-center mb-8 ${
            collapsed ? "flex-col gap-3 px-0" : "justify-between px-2"
          }`}
        >
          <div className={`flex items-center gap-2.5 ${collapsed ? "flex-col" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
              <BookOpen size={15} className="text-amber-500" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">
                LecturaMetrica
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expandir menú" : "Plegar menú"}
            className="text-slate-500 hover:text-white hover:bg-[#1A2332] rounded-lg p-1.5 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-amber-700/25 text-amber-400 border border-amber-700/30"
                    : "text-slate-400 hover:text-white hover:bg-[#1A2332]"
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} className="flex-shrink-0" />
                {!collapsed && label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 mt-4 pt-4 border-t border-[#1A2332]">
          <button
            type="button"
            onClick={toggleTheme}
            title={collapsed ? `Modo ${darkMode ? "claro" : "oscuro"}` : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors w-full rounded-xl hover:bg-[#1A2332] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {darkMode ? (
              <Sun size={14} className="flex-shrink-0" />
            ) : (
              <Moon size={14} className="flex-shrink-0" />
            )}
            {!collapsed && `Modo ${darkMode ? "claro" : "oscuro"}`}
          </button>

          <button
            type="button"
            onClick={() => setShowProfile(true)}
            title={collapsed ? "Ver perfil" : undefined}
            className={`w-full rounded-xl transition-colors hover:bg-[#1A2332] px-2 py-2 text-left ${
              collapsed ? "flex flex-col items-center gap-2" : ""
            }`}
          >
            {collapsed ? (
              renderAvatar("w-8 h-8", "text-xs")
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-3">
                  {renderAvatar("w-8 h-8", "text-xs")}

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{userName}</div>
                    <div className="text-[10px] text-slate-500">
                      {badgeCount} insignias desbloqueadas
                    </div>
                  </div>
                </div>

                <div className="mb-1">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">
                    Mis insignias
                  </div>

                  <div className="flex gap-1 flex-wrap">
                    {visibleBadges.map((badge, index) => (
                      <span
                        key={`${badge.id ?? badge.name}-${index}`}
                        title={badge.name}
                        className={`text-base leading-none ${
                          !badge.unlocked ? "opacity-25 grayscale" : ""
                        }`}
                      >
                        {badge.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={badge.url}
                            alt={badge.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          badge.emoji || "🏅"
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors w-full rounded-xl hover:bg-[#1A2332] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} className="flex-shrink-0" />
            {!collapsed && "Cerrar sesión"}
          </button>
        </div>
      </aside>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1117]/95 backdrop-blur border-t border-[#1A2332] px-2 py-2 flex items-center justify-around">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                active ? "text-amber-400" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </Link>
          );
        })}

        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-slate-500 hover:text-slate-300"
        >
          {renderAvatar("w-[18px] h-[18px]", "text-[10px]", true)}
          <span className="text-[9px] font-medium">Perfil</span>
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-slate-500 hover:text-slate-300"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="text-[9px] font-medium">Salir</span>
        </button>
      </nav>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
