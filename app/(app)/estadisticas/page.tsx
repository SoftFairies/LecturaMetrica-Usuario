"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
  CartesianGrid,
} from "recharts";
import { api } from "@/data/api";

const STATUS_COLORS: Record<string, string> = {
  Completados: "#D4890A",
  "En progreso": "#3B82F6",
  "Por leer": "#64748B",
  Abandonados: "#EF4444",
};

const DEFAULT_WEEKLY = [
  { day: "Lun", min: 0 },
  { day: "Mar", min: 0 },
  { day: "Mié", min: 0 },
  { day: "Jue", min: 0 },
  { day: "Vie", min: 0 },
  { day: "Sáb", min: 0 },
  { day: "Dom", min: 0 },
];

const DEFAULT_MONTHLY = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
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

const AXIS_LABEL_STYLE = { fill: "#9CA3AF", fontSize: 11 };

type DashboardReport = {
  estimatedMinutesTotal?: number;
  completedBooks?: number;
  annualGoal?: number;
  currentStreak?: number;
  pagesPerDayAvg?: number;
  weeklyReadingMinutes?: Array<{
    day?: string;
    minutes?: number;
  }>;
  monthlyPagesRead?: Array<{
    day?: number;
    pages?: number;
  }>;
  libraryDistribution?: {
    completed?: number;
    inProgress?: number;
    toRead?: number;
  };
  annualProgress?: Array<{
    month?: string;
    books?: number;
  }>;
};

function safeNumber(value: unknown, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function currentMonthDays() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
}

function getStreakStyle(days: number) {
  if (days >= 15) {
    return {
      label: "Racha legendaria",
      icon: "\uD83D\uDC99",
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    };
  }

  if (days >= 7) {
    return {
      label: "Racha fuerte",
      icon: "\uD83D\uDC97",
      color: "text-pink-400",
      bg: "bg-pink-500/10 border-pink-500/20",
    };
  }

  if (days >= 3) {
    return {
      label: "Racha activa",
      icon: "\uD83D\uDD25",
      color: "text-orange-400",
      bg: "bg-orange-500/10 border-orange-500/20",
    };
  }

  return {
    label: "Racha en proceso",
    icon: "\u25CB",
    color: "text-slate-500",
    bg: "bg-slate-500/10 border-slate-500/20",
  };
}

function normalizeWeeklyMinutes(items?: DashboardReport["weeklyReadingMinutes"]) {
  const values = new Map<string, number>();

  (items ?? []).forEach((item) => {
    if (!item?.day) return;
    values.set(item.day, safeNumber(item.minutes, 0));
  });

  return DEFAULT_WEEKLY.map(({ day }) => ({
    day,
    min: values.get(day) ?? 0,
  }));
}

function normalizeMonthlyPages(items?: DashboardReport["monthlyPagesRead"]) {
  const daysInMonth = currentMonthDays();
  const values = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    pages: 0,
  }));

  (items ?? []).forEach((item) => {
    const day = Math.trunc(safeNumber(item?.day, 0));
    if (day < 1 || day > daysInMonth) return;

    values[day - 1].pages = safeNumber(item?.pages, 0);
  });

  return values;
}

function normalizeAnnualProgress(items?: DashboardReport["annualProgress"]) {
  const values = new Map<string, number>();

  (items ?? []).forEach((item) => {
    if (!item?.month) return;
    values.set(item.month, safeNumber(item.books, 0));
  });

  return DEFAULT_MONTHLY.map(({ month }) => ({
    month,
    books: values.get(month) ?? 0,
  }));
}

export default function EstadisticasPage() {
  const [weeklyMinutes, setWeeklyMinutes] = useState(DEFAULT_WEEKLY);

  const [dailyPages, setDailyPages] = useState(
    Array.from({ length: currentMonthDays() }, (_, i) => ({ day: i + 1, pages: 0 })),
  );

  const [monthlyGoal, setMonthlyGoal] = useState(DEFAULT_MONTHLY);

  const [distrib, setDistrib] = useState([
    { name: "Completados", value: 0, color: STATUS_COLORS.Completados },
    { name: "En progreso", value: 0, color: STATUS_COLORS["En progreso"] },
    { name: "Por leer", value: 0, color: STATUS_COLORS["Por leer"] },
    { name: "Abandonados", value: 0, color: STATUS_COLORS.Abandonados },
  ]);

  const [totalMin, setTotalMin] = useState(0);
  const [completedBooks, setCompletedBooks] = useState(0);
  const [dailyAvgPages, setDailyAvgPages] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const [goalBooks, setGoalBooks] = useState(0);
  const [goalProgress, setGoalProgress] = useState(0);

  const streakStyle = useMemo(() => getStreakStyle(currentStreak), [currentStreak]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const [dashboard, me, libraryPage] = await Promise.all([
          api.reports.getDashboard() as Promise<DashboardReport>,
          api.users.getMe().catch(() => null),
          api.library.getAll({ page: 0, size: 100 }).catch(() => ({ content: [] })),
        ]);

        if (!active) return;

        const completed = safeNumber(dashboard.completedBooks, 0);

        /*
          La meta anual pertenece al perfil del usuario.
          Se toma primero desde GET /users/me y solo se usa el dashboard
          como respaldo si el perfil no trae annualGoal.
        */
        const userAnnualGoal = safeNumber((me as any)?.annualGoal, 0);
        const dashboardAnnualGoal = safeNumber(dashboard.annualGoal, 0);
        const annualGoal = userAnnualGoal > 0 ? userAnnualGoal : dashboardAnnualGoal;

        const current = safeNumber(dashboard.currentStreak, 0);

        setWeeklyMinutes(normalizeWeeklyMinutes(dashboard.weeklyReadingMinutes));
        setDailyPages(normalizeMonthlyPages(dashboard.monthlyPagesRead));
        setMonthlyGoal(normalizeAnnualProgress(dashboard.annualProgress));

        const libraryItems = Array.isArray(libraryPage)
          ? libraryPage
          : Array.isArray((libraryPage as any)?.content)
            ? (libraryPage as any).content
            : [];

        const libraryDistribution = libraryItems.reduce(
          (acc: { completed: number; inProgress: number; toRead: number; abandoned: number }, item: any) => {
            const status = String(item?.readingStatusName ?? "")
              .trim()
              .toLowerCase();

            if (status === "terminado" || status === "completado") {
              acc.completed += 1;
            } else if (status === "leyendo" || status === "en progreso") {
              acc.inProgress += 1;
            } else if (status === "abandonado") {
              acc.abandoned += 1;
            } else if (status === "por leer" || status === "por leer ") {
              acc.toRead += 1;
            }

            return acc;
          },
          { completed: 0, inProgress: 0, toRead: 0, abandoned: 0 },
        );

        console.log("Distribución de biblioteca:", {
          desdeBiblioteca: libraryDistribution,
          desdeDashboard: dashboard.libraryDistribution,
        });

        setDistrib([
          {
            name: "Completados",
            value: libraryDistribution.completed,
            color: STATUS_COLORS.Completados,
          },
          {
            name: "En progreso",
            value: libraryDistribution.inProgress,
            color: STATUS_COLORS["En progreso"],
          },
          {
            name: "Por leer",
            value: libraryDistribution.toRead,
            color: STATUS_COLORS["Por leer"],
          },
          {
            name: "Abandonados",
            value: libraryDistribution.abandoned,
            color: STATUS_COLORS.Abandonados,
          },
        ]);

        setTotalMin(safeNumber(dashboard.estimatedMinutesTotal, 0));
        setCompletedBooks(completed);
        setDailyAvgPages(safeNumber(dashboard.pagesPerDayAvg, 0));
        setCurrentStreak(current);
        setMaxStreak(current);
        console.log("Meta anual:", {
          usersMe: userAnnualGoal,
          dashboard: dashboardAnnualGoal,
          usadaEnVista: annualGoal,
        });

        setGoalBooks(annualGoal);
        setGoalProgress(
          annualGoal > 0 ? Math.min(100, Math.round((completed / annualGoal) * 100)) : 0,
        );
      } catch (error) {
        console.error("Error cargando dashboard de estadisticas:", error);
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
          Estadisticas
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Tu progreso lector actualizado
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          {
            val: String(totalMin),
            label: "Minutos registrados",
            icon: "\u23F1",
            color: "text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            val: completedBooks + " / " + goalBooks,
            label: "Libros completados",
            icon: "\u2611",
            color: "text-blue-400",
            bg: "bg-blue-500/10 border-blue-500/20",
          },
          {
            val: currentStreak + " dia" + (currentStreak === 1 ? "" : "s"),
            label: streakStyle.label + " - record " + maxStreak,
            icon: streakStyle.icon,
            color: streakStyle.color,
            bg: streakStyle.bg,
          },
          {
            val: String(dailyAvgPages),
            label: "Paginas / dia",
            icon: "\u2197",
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
        ].map(({ val, label, icon, color, bg }) => (
          <div key={label} className={"bg-[#111827] border " + bg + " rounded-2xl p-4"}>
            <div className={"text-base mb-1.5 " + color}>{icon}</div>
            <div className={"text-2xl font-bold " + color}>{val}</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm">Tiempo de lectura semanal</h3>
          <p className="text-[10px] text-slate-500 mb-4">Minutos devueltos por /reports/dashboard</p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyMinutes} barSize={22} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis
                dataKey="day"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Dia de la semana",
                  position: "insideBottom",
                  offset: -12,
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Minutos",
                  angle: -90,
                  position: "insideLeft",
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="min" name="Minutos" fill="#D4890A" radius={[4, 4, 0, 0]}>
                <LabelList dataKey="min" position="top" fill="#CBD5E1" fontSize={10} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm">Paginas registradas por dia</h3>
          <p className="text-[10px] text-slate-500 mb-4">Paginas devueltas por /reports/dashboard</p>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyPages} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis
                dataKey="day"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Dia del mes",
                  position: "insideBottom",
                  offset: -12,
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Paginas",
                  angle: -90,
                  position: "insideLeft",
                  style: AXIS_LABEL_STYLE,
                }}
              />
              <Tooltip {...TOOLTIP_STYLE} />
              <Legend verticalAlign="top" height={28} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="pages" name="Paginas" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-1">Distribucion de biblioteca</h3>
          <p className="text-[10px] text-slate-500 mb-4">
            Estados actuales obtenidos desde tu biblioteca
          </p>

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
                label={(entry) => entry.name + ": " + entry.value}
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
            <span className="text-base font-bold text-white">{completedBooks} libros leidos</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">meta anual: {goalBooks > 0 ? goalBooks : "sin definir"}</span>
              <div className="w-10 h-10 rounded-full bg-amber-600/20 border-2 border-amber-600/40 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-400">{goalProgress}%</span>
              </div>
            </div>
          </div>

          <div className="w-full h-2 bg-[#2E3D52] rounded-full overflow-hidden mb-1">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: goalProgress + "%" }} />
          </div>

          <p className="text-[10px] text-slate-500 mb-4">
            {goalBooks > 0
              ? goalProgress + "% completado - " + Math.max(0, goalBooks - completedBooks) + " libros restantes"
              : "Meta anual no definida"}
          </p>

          <div className="grid grid-cols-6 gap-1.5">
            {monthlyGoal.map(({ month, books }) => (
              <div
                key={month}
                className={
                  "rounded-xl p-2.5 text-center border " +
                  (books > 0 ? "bg-amber-700/20 border-amber-700/30" : "bg-[#1A2332] border-[#2E3D52]")
                }
              >
                <div className={"text-[10px] font-semibold " + (books > 0 ? "text-amber-400" : "text-slate-600")}>
                  {month}
                </div>
                <div className={"text-xl font-bold mt-0.5 " + (books > 0 ? "text-white" : "text-slate-700")}>
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