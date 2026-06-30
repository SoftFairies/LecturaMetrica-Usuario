"use client";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const weeklyMinutes = [
  { day: "Lun", min: 35 }, { day: "Mar", min: 28 }, { day: "Mié", min: 50 },
  { day: "Jue", min: 0 }, { day: "Vie", min: 65 }, { day: "Sáb", min: 120 }, { day: "Dom", min: 80 },
];

const dailyPages = [
  20,40,35,60,45,30,55,42,68,72,50,60,45,38,70,80,65,55,48,62,74,60,55
].map((pages, i) => ({ day: i + 1, pages }));

const distrib = [
  { name: "Completados", value: 3, color: "#D4890A" },
  { name: "En progreso", value: 4, color: "#3B82F6" },
  { name: "Por leer", value: 1, color: "#2E3D52" },
];

const monthlyGoal = [
  { month: "Ene", books: 2 },
  { month: "Feb", books: 1 },
  { month: "Mar", books: 2 },
  { month: "Abr", books: 0 },
  { month: "May", books: 1 },
  { month: "Jun", books: 0 },
];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1A2332",
    border: "1px solid #2E3D52",
    borderRadius: "12px",
    color: "#fff",
    fontSize: 12,
    padding: "8px 12px",
  },
  cursor: { fill: "rgba(255,255,255,0.02)" },
};

export default function EstadisticasPage() {
  const totalMin = weeklyMinutes.reduce((s, d) => s + d.min, 0);

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Estadísticas</h1>
        <p className="text-slate-500 text-sm mt-0.5">Tu progreso lector · junio 2025</p>
      </div>

      {/* ── Top stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { val: `${totalMin}`, label: "Minutos esta semana", icon: "⏱", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { val: "3 / 24", label: "Libros completados", icon: "☑", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { val: "7 días", label: "Racha actual", icon: "🔥", color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
          { val: "46", label: "Páginas / día", icon: "↗", color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
        ].map(({ val, label, icon, color, bg }) => (
          <div key={label} className={`bg-[#111827] border ${bg} rounded-2xl p-4`}>
            <div className={`text-base mb-1.5 ${color}`}>{icon}</div>
            <div className={`text-2xl font-bold ${color}`}>{val}</div>
            <div className="text-xs text-slate-500 mt-0.5 leading-tight">{label}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row 1 ── */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm">Tiempo de lectura semanal</h3>
          <p className="text-[10px] text-slate-500 mb-4">min · semana actual</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={weeklyMinutes} barSize={20}>
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="min" fill="#D4890A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm">Páginas leídas por día</h3>
          <p className="text-[10px] text-slate-500 mb-4">junio 2025</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={dailyPages}>
              <XAxis dataKey="day" tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#6B7280", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="pages" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts row 2 ── */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pie chart */}
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-4">Distribución de biblioteca</h3>
          <div className="flex items-center gap-6">
            <PieChart width={140} height={140}>
              <Pie
                data={distrib}
                cx={65} cy={65}
                innerRadius={40} outerRadius={65}
                dataKey="value"
                paddingAngle={3}
                strokeWidth={0}
              >
                {distrib.map(d => <Cell key={d.name} fill={d.color} />)}
              </Pie>
            </PieChart>
            <div className="space-y-3">
              {distrib.map(d => (
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

        {/* Annual goal */}
        <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-5">
          <h3 className="font-semibold text-white text-sm mb-3">Meta anual 2025</h3>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-base font-bold text-white">3 libros leídos</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">meta: 24</span>
              <div className="w-10 h-10 rounded-full bg-amber-600/20 border-2 border-amber-600/40 flex items-center justify-center">
                <span className="text-xs font-bold text-amber-400">13%</span>
              </div>
            </div>
          </div>
          <div className="w-full h-2 bg-[#2E3D52] rounded-full overflow-hidden mb-1">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "13%" }} />
          </div>
          <p className="text-[10px] text-slate-500 mb-4">13% completado · 21 libros restantes</p>

          {/* Monthly breakdown */}
          <div className="grid grid-cols-6 gap-1.5">
            {monthlyGoal.map(({ month, books }) => (
              <div key={month} className={`rounded-xl p-2.5 text-center border ${books > 0 ? "bg-amber-700/20 border-amber-700/30" : "bg-[#1A2332] border-[#2E3D52]"}`}>
                <div className={`text-[10px] font-semibold ${books > 0 ? "text-amber-400" : "text-slate-600"}`}>{month}</div>
                <div className={`text-xl font-bold mt-0.5 ${books > 0 ? "text-white" : "text-slate-700"}`}>{books}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
