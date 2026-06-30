"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, Library, Clock, BarChart2, Mail, Sun, Moon, LogOut,
  ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import ProfileModal from "@/components/ProfileModal";

const NAV = [
  { href: "/biblioteca", icon: Library, label: "Biblioteca" },
  { href: "/lectura", icon: Clock, label: "Lectura" },
  { href: "/estadisticas", icon: BarChart2, label: "Estadísticas" },
  { href: "/buzon", icon: Mail, label: "Buzón" },
];

const BADGES = [
  { emoji: "🔥", unlocked: true },
  { emoji: "📚", unlocked: true },
  { emoji: "⭐", unlocked: true },
  { emoji: "🌙", unlocked: true },
  { emoji: "🏆", unlocked: false },
  { emoji: "⚡", unlocked: false },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const [collapsed, setCollapsed] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col min-h-screen bg-[#0D1117] border-r border-[#1A2332] py-6 flex-shrink-0 transition-all duration-200 ${
          collapsed ? "w-[76px] px-2" : "w-[220px] px-4"
        }`}
      >
        {/* Logo + collapse toggle */}
        <div className={`flex items-center mb-8 ${collapsed ? "flex-col gap-3 px-0" : "justify-between px-2"}`}>
          <div className={`flex items-center gap-2.5 ${collapsed ? "flex-col" : ""}`}>
            <div className="w-8 h-8 rounded-lg bg-amber-600/30 border border-amber-600/40 flex items-center justify-center flex-shrink-0">
              <BookOpen size={15} className="text-amber-500" />
            </div>
            {!collapsed && (
              <span className="font-semibold text-white text-sm tracking-tight whitespace-nowrap">LecturaMetrica</span>
            )}
          </div>
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expandir menú" : "Plegar menú"}
            className="text-slate-500 hover:text-white hover:bg-[#1A2332] rounded-lg p-1.5 transition-colors flex-shrink-0"
          >
            {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
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

        {/* Bottom user section */}
        <div className="space-y-3 mt-4 pt-4 border-t border-[#1A2332]">
          <button
            onClick={toggleTheme}
            title={collapsed ? `Modo ${darkMode ? "claro" : "oscuro"}` : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors w-full rounded-xl hover:bg-[#1A2332] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            {darkMode ? <Sun size={14} className="flex-shrink-0" /> : <Moon size={14} className="flex-shrink-0" />}
            {!collapsed && `Modo ${darkMode ? "claro" : "oscuro"}`}
          </button>

          {/* Profile button - opens profile modal */}
          <button
            onClick={() => setShowProfile(true)}
            title={collapsed ? "Ver perfil" : undefined}
            className={`w-full rounded-xl transition-colors hover:bg-[#1A2332] px-2 py-2 text-left ${
              collapsed ? "flex flex-col items-center gap-2" : ""
            }`}
          >
            {collapsed ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                M
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    M
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white truncate">María García</div>
                    <div className="text-[10px] text-slate-500">7 días de racha 🔥</div>
                  </div>
                </div>
                <div className="mb-1">
                  <div className="text-[9px] text-slate-600 uppercase tracking-widest mb-1.5">Mis insignias</div>
                  <div className="flex gap-1 flex-wrap">
                    {BADGES.map((b, i) => (
                      <span
                        key={i}
                        className={`text-base leading-none ${!b.unlocked ? "opacity-25 grayscale" : ""}`}
                      >
                        {b.emoji}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </button>

          <Link
            href="/login"
            title={collapsed ? "Cerrar sesión" : undefined}
            className={`flex items-center gap-2 px-3 py-2 text-slate-500 hover:text-slate-300 text-sm transition-colors w-full rounded-xl hover:bg-[#1A2332] ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <LogOut size={14} className="flex-shrink-0" />
            {!collapsed && "Cerrar sesión"}
          </Link>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D1117]/95 backdrop-blur border-t border-[#1A2332] px-2 py-2 flex items-center justify-around">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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
          onClick={() => setShowProfile(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-slate-500 hover:text-slate-300"
        >
          <div className="w-[18px] h-[18px] rounded-full bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[10px] font-bold text-white">
            M
          </div>
          <span className="text-[9px] font-medium">Perfil</span>
        </button>
        <Link
          href="/login"
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all text-slate-500 hover:text-slate-300"
        >
          <LogOut size={18} strokeWidth={1.8} />
          <span className="text-[9px] font-medium">Salir</span>
        </Link>
      </nav>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </>
  );
}
