"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList,
  CartesianGrid,
} from "recharts";
import { api } from "@/data/api";

const STATUS_COLORS: Record<string, string> = {
  Completados: "#D4890A",
  "En progreso": "#3B82F6",
  "Por leer": "#2E3D52",
};

const DEFAULT_MONTHLY = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
].map((month) => ({ month, books: 0 }));

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1A2332",
    border: "1px solid #2E3D52",
    borderRadius: "12px",
    color: "#fff",
    fontSize: 12,
    padding: "8px 12px",
  },
  labelStyle: { color: "#CBD5E1" },
};

export default function EstadisticasPage() {
  const [weeklyMinutes, setWeeklyMinutes] = useState([
    { day: "Lun", min: 0 }, { day: "Mar", min: 0 }, { day: "Mié", min: 0 },
    { day: "Jue", min: 0 }, { day: "Vie", min: 0 }, { day: "Sáb", min: 0 }, { day: "Dom", min: 0 },
  ]);

  const [dailyPages, setDailyPages] = useState(
    Array.from({ length: 30 }, (_, i) => ({ day: i + 1, pages: 0 }))
  );

  const [monthlyGoal, setMonthlyGoal] = useState(DEFAULT_MONTHLY);

  const [distrib, setDistrib] = useState([
    { name: "Completados", value: 0, color: STATUS_COLORS.Completados },
    { name: "En progreso", value: 0, color: STATUS_COLORS["En progreso"] },
    { name: "Por leer", value: 0, color: STATUS_COLORS["Por leer"] },
  ]);

  const [totalMin, setTotalMin] = useState(0);
  const [completedBooks, setCompletedBooks] = useState(0);
  const [dailyAvgPages, setDailyAvgPages] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);

  const goalBooks = 24;
  const [goalProgress, setGoalProgress] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const libs = await api.library.getAll();
        if (!active) return;

        const safeLibs = Array.isArray(libs) ? libs : [];

        const completed = safeLibs.filter(
          (l: any) => l.readingStatus?.name?.toLowerCase() === "completado"
        ).length;

        const inProgress = safeLibs.filter(
          (l: any) =>
            l.readingStatus?.name?.toLowerCase() === "leyendo" ||
            l.readingStatus?.name?.toLowerCase() === "en progreso"
        ).length;

        const pending = Math.max(0, safeLibs.length - completed - inProgress);

        const totalPages = safeLibs.reduce(
          (acc: number, l: any) => acc + Number(l.currentPage ?? 0),
          0
        );

        const estimatedMinutes = Math.round(totalPages * 2);

        setDistrib([
          { name: "Completados", value: completed, color: STATUS_COLORS.Completados },
          { name: "En progreso", value: inProgress, color: STATUS_COLORS["En progreso"] },
          { name: "Por leer", value: pending, color: STATUS_COLORS["Por leer"] },
        ]);

        setCompletedBooks(completed);
        setTotalMin(estimatedMinutes);
        setDailyAvgPages(Math.round(totalPages / 7));
        setGoalProgress(Math.min(100, Math.round((completed / goalBooks) * 100)));

        setWeeklyMinutes([
          { day: "Lun", min: Math.round(estimatedMinutes * 0.12) },
          { day: "Mar", min: Math.round(estimatedMinutes * 0.16) },
          { day: "Mié", min: Math.round(estimatedMinutes * 0.14) },
          { day: "Jue", min: Math.round(estimatedMinutes * 0.18) },
          { day: "Vie", min: Math.round(estimatedMinutes * 0.15) },
          { day: "Sáb", min: Math.round(estimatedMinutes * 0.13) },
          { day: "Dom", min: Math.round(estimatedMinutes * 0.12) },
        ]);

        setDailyPages(
          Array.from({ length: 30 }, (_, i) => ({
            day: i + 1,
            pages: Math.round(totalPages / 30),
          }))
        );

        const nextMonthly = DEFAULT_MONTHLY.map((m, index) => ({
          ...m,
          books: index < completed ? 1 : 0,
        }));

        setMonthlyGoal(nextMonthly);
        setCurrentStreak(totalPages > 0 ? 7 : 0);
      } catch (error) {
        console.error("Error cargando estadísticas:", error);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
          Estadísticas
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">Tu progreso lector</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { val: `${totalMin}`, label: "Minutos estimados", icon: "⏱", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { val: `${completedBooks} / ${goalBooks}`, label: "Libros completados", icon: "☑", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { val: `${currentStreak} días`, label: "Racha actual", icon: "🔥", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
          { val: `${dailyAvgPages}`, label: "Páginas / día", icon: "↗", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map(({ val, label, icon, color, bg }) => (
          <div key={label} className={`bg-[#111827] border ${bg} rounded-2xl p-4`}>
            <div className={`text-base mb-1.5 ${color}`}>{icon}</div>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm">Tiempo de lectura semanal</h3>
          <p className="text-[10px] text-slate-500 mb-4">Minutos estimados por día</p>

          <ResponsiveContainer width="100%" height={190}>
            <BarChart data={weeklyMinutes} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend />
              <Bar dataKey="min" name="Minutos" fill="#D4890A" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="min" position="top" fill="#CBD5E1" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm">Páginas leídas por día</h3>
          <p className="text-[10px] text-slate-500 mb-4">Estimado según tu progreso actual</p>

          <ResponsiveContainer width="100%" height={190}>
            <LineChart data={dailyPages}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="day" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend />
              <Line type="monotone" dataKey="pages" name="Páginas" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Distribución de biblioteca</h3>

          <div className="flex items-center gap-6">
            <PieChart width={160} height={160}>
              <Pie
                data={distrib}
                cx={75}
                cy={75}
                innerRadius={42}
                outerRadius={68}
                dataKey="value"
                nameKey="name"
                paddingAngle={3}
                strokeWidth={0}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {distrib.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip {...TOOLTIP_STYLE} />
            </PieChart>

            <div className="space-y-3">
              {distrib.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <div>
                    <div className="text-sm text-white font-medium">{d.name}</div>
                    <div className="text-xs text-slate-500">{d.value} libros</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-3">Meta anual</h3>

          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base font-bold text-white">{completedBooks} libros leídos</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">meta: {goalBooks}</span>
              <div className="w-10 h-10 rounded-full bg-amber-600/20 border-2 border-amber-600/40 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-400">{goalProgress}%</span>
              </div>
            </div>
          </div>

          <div className="w-full h-2 bg-[#2E3D52] rounded-full overflow-hidden mb-1">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${goalProgress}%` }} />
          </div>

          <p className="text-[10px] text-slate-500 mb-4">
            {goalProgress}% completado · {Math.max(0, goalBooks - completedBooks)} libros restantes
          </p>

          <div className="grid grid-cols-6 gap-1.5">
            {monthlyGoal.map(({ month, books }) => (
              <div
                key={month}
                className={`rounded-xl p-2.5 text-center border ${
                  books > 0
                    ? "bg-amber-700/20 border-amber-700/30"
                    : "bg-[#1A2332] border-[#2E3D52]"
                }`}
              >
                <div className={`text-[10px] font-semibold ${books > 0 ? "text-amber-400" : "text-slate-600"}`}>
                  {month}
                </div>
                <div className={`text-xl font-bold mt-0.5 ${books > 0 ? "text-white" : "text-slate-700"}`}>
                  {books}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}