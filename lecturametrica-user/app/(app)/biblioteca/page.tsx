"use client";
import { useState } from "react";
import { Search, Plus, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

/* ──────────────── Types ──────────────── */
interface Book {
  id: number;
  title: string;
  author: string;
  color: string;
  status: "Leyendo" | "Completado" | "Pendiente";
  progress?: number;
  currentPage?: number;
  totalPages: number;
  genre?: string;
  rating?: number;
  notes?: string;
}

/* ──────────────── Data ──────────────── */
const INITIAL_BOOKS: Book[] = [
  { id: 1, title: "El nombre del viento", author: "Patrick Rothfuss", color: "linear-gradient(160deg,#c2410c 0%,#7c2d12 100%)", status: "Leyendo", progress: 70, currentPage: 463, totalPages: 662, genre: "Fantasía", rating: 5 },
  { id: 2, title: "Dune", author: "Frank Herbert", color: "linear-gradient(160deg,#d97706 0%,#92400e 100%)", status: "Completado", progress: 100, currentPage: 896, totalPages: 896, genre: "Ciencia Ficción", rating: 5 },
  { id: 3, title: "Cien años de soledad", author: "García Márquez", color: "linear-gradient(160deg,#15803d 0%,#14532d 100%)", status: "Leyendo", progress: 35, currentPage: 151, totalPages: 432, genre: "Clásicos", rating: 4 },
  { id: 4, title: "Foundation", author: "Isaac Asimov", color: "linear-gradient(160deg,#1e40af 0%,#0f2944 100%)", status: "Pendiente", totalPages: 255, genre: "Ciencia Ficción" },
  { id: 5, title: "El Principito", author: "Antoine de Saint-Exupéry", color: "linear-gradient(160deg,#0f766e 0%,#134e4a 100%)", status: "Completado", progress: 100, currentPage: 96, totalPages: 96, genre: "Clásicos", rating: 5 },
  { id: 6, title: "Neuromancer", author: "William Gibson", color: "linear-gradient(160deg,#7c3aed 0%,#4c1d95 100%)", status: "Leyendo", progress: 55, currentPage: 149, totalPages: 271, genre: "Ciencia Ficción", rating: 4 },
  { id: 7, title: "Rayuela", author: "Julio Cortázar", color: "linear-gradient(160deg,#be123c 0%,#881337 100%)", status: "Leyendo", progress: 20, currentPage: 147, totalPages: 736, genre: "Clásicos", rating: 4 },
  { id: 8, title: "1984", author: "George Orwell", color: "linear-gradient(160deg,#334155 0%,#0f172a 100%)", status: "Completado", progress: 100, currentPage: 328, totalPages: 328, genre: "Distopía", rating: 5 },
];

const FACTS = [
  { text: "El libro más largo del mundo, 'À la recherche du temps perdu' de Proust, tiene 1.5 millones de palabras.", source: "Guinness World Records" },
  { text: "La primera novela del mundo se considera 'Genji Monogatari', escrita por Murasaki Shikibu en el año 1000.", source: "Historia de la Literatura" },
  { text: "El promedio de lectura de un adulto es de unas 250 palabras por minuto.", source: "Investigación lingüística" },
];

const COVER_COLORS = [
  "linear-gradient(160deg,#c2410c,#7c2d12)",
  "linear-gradient(160deg,#d97706,#92400e)",
  "linear-gradient(160deg,#15803d,#14532d)",
  "linear-gradient(160deg,#1d4ed8,#0f2944)",
  "linear-gradient(160deg,#0891b2,#164e63)",
  "linear-gradient(160deg,#7c3aed,#4c1d95)",
  "linear-gradient(160deg,#db2777,#831843)",
  "linear-gradient(160deg,#475569,#1e293b)",
  "linear-gradient(160deg,#4338ca,#312e81)",
  "linear-gradient(160deg,#dc2626,#7f1d1d)",
  "linear-gradient(160deg,#0d9488,#134e4a)",
  "linear-gradient(160deg,#374151,#111827)",
];

const SOLID_COLORS = [
  "#c2410c","#d97706","#15803d","#1d4ed8","#0891b2",
  "#7c3aed","#db2777","#475569","#4338ca","#dc2626","#0d9488","#374151",
];

type Filter = "Todos" | "Leyendo" | "Completados" | "Pendientes";

const STATUS_BADGE: Record<Book["status"], string> = {
  Leyendo: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Completado: "bg-green-500/15 text-green-300 border-green-500/30",
  Pendiente: "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const Stars = ({ rating, max = 5 }: { rating: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} className={`text-xs ${i < rating ? "text-amber-400" : "text-slate-700"}`}>★</span>
    ))}
  </div>
);

const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="w-full h-1 bg-[#2E3D52] rounded-full overflow-hidden">
    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
  </div>
);

/* ──────────────── BookCard ──────────────── */
function BookCard({ book, onClick, onDelete }: { book: Book; onClick: () => void; onDelete: () => void }) {
  return (
    <div
      className="relative bg-[#111827] rounded-2xl overflow-hidden cursor-pointer group border border-[#1E2A3A] hover:border-[#2E3D52] transition-all hover:shadow-lg hover:shadow-black/30"
      onClick={onClick}
    >
      {/* Cover */}
      <div className="w-full h-40 relative" style={{ background: book.color }}>
        {/* Status badge */}
        <div className="absolute bottom-2.5 left-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_BADGE[book.status]}`}>
            {book.status}
          </span>
        </div>
        {/* Notes icon if has notes */}
        {book.notes && (
          <div className="absolute top-2 right-2 w-6 h-6 bg-amber-600/80 rounded-md flex items-center justify-center">
            <span className="text-[10px]">📝</span>
          </div>
        )}
        {/* Delete btn on hover */}
        <button
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-600/40"
          onClick={e => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="font-semibold text-white text-sm leading-tight line-clamp-1">{book.title}</div>
        <div className="text-slate-500 text-xs mt-0.5 truncate">{book.author}</div>

        {book.rating !== undefined && (
          <div className="mt-1.5">
            <Stars rating={book.rating} />
          </div>
        )}

        {book.status !== "Pendiente" && book.progress !== undefined ? (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Progreso</span>
              <span className="text-[10px] font-bold text-amber-400">{book.progress}%</span>
            </div>
            <ProgressBar pct={book.progress} />
            <div className="text-[10px] text-slate-600 mt-1">
              {book.currentPage} / {book.totalPages} págs
            </div>
          </div>
        ) : book.status === "Pendiente" ? (
          <div className="text-[10px] text-slate-500 mt-2">
            {book.totalPages} páginas · {book.genre}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ──────────────── AddBookModal ──────────────── */
function AddBookModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"search" | "manual">("manual");
  const [selectedColor, setSelectedColor] = useState(0);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [genre, setGenre] = useState("");
  const [statusVal, setStatusVal] = useState<Book["status"]>("Leyendo");

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div className="bg-[#111827] rounded-2xl w-full max-w-md border border-[#2E3D52] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#1A2332]">
          <div>
            <h3 className="font-bold text-white">Agregar libro</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {tab === "manual" ? "Ingresa los datos manualmente" : "Busca en nuestra base de datos 📚"}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#1A2332] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-5 pt-4">
          <div className="flex rounded-xl bg-[#1A2332] p-1 mb-4">
            <button
              onClick={() => setTab("search")}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === "search" ? "bg-[#243044] text-amber-400" : "text-slate-400 hover:text-white"}`}
            >
              <Search size={12} /> Buscar
            </button>
            <button
              onClick={() => setTab("manual")}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === "manual" ? "bg-amber-700/30 text-amber-400" : "text-slate-400 hover:text-white"}`}
            >
              <Plus size={12} /> Manual
            </button>
          </div>
        </div>

        {tab === "search" ? (
          <div className="px-5 pb-5 space-y-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Busca por título, autor o ISBN" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40" />
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Géneros populares</div>
              <div className="flex flex-wrap gap-1.5">
                {["Fantasía","Ciencia Ficción","Clásicos","Misterio","Thriller","Romance","Historia","Manga"].map(g => (
                  <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 cursor-pointer hover:text-white hover:border-slate-500 transition-colors">{g}</span>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Tendencias</div>
              <div className="space-y-2">
                {[
                  { title: "El juego de Ender", author: "Orson Scott Card", year: "1985", pages: "324 págs.", genre: "Ciencia Ficción", genreColor: "text-blue-400", color: "#1d4ed8" },
                  { title: "Fahrenheit 451", author: "Ray Bradbury", year: "1953", pages: "256 págs.", genre: "Distopía", genreColor: "text-amber-400", color: "#c2410c" },
                  { title: "El alquimista", author: "Paulo Coelho", year: "1988", pages: "208 págs.", genre: "Filosofía", genreColor: "text-amber-400", color: "#d97706" },
                ].map(b => (
                  <div key={b.title} className="flex items-center gap-3 bg-[#1A2332] rounded-xl p-3 border border-[#2E3D52]">
                    <div className="w-10 h-14 rounded-lg flex-shrink-0" style={{ background: b.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-white">{b.title}</div>
                      <div className="text-xs text-slate-500">{b.author}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-600">{b.year} · {b.pages}</span>
                        <span className={`text-[10px] font-medium ${b.genreColor}`}>{b.genre}</span>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/30 flex items-center justify-center text-amber-400 hover:bg-amber-600/40 transition-colors flex-shrink-0">
                      <Plus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {/* Cover preview + color picker */}
            <div className="flex gap-4 items-start">
              <div className="w-16 h-20 rounded-xl flex-shrink-0 border border-[#2E3D52]" style={{ background: COVER_COLORS[selectedColor] }} />
              <div className="flex-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Color de portada</div>
                <div className="flex gap-1.5 flex-wrap">
                  {SOLID_COLORS.map((c, i) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(i)}
                      className={`w-5 h-5 rounded-full transition-all ${selectedColor === i ? "ring-2 ring-white ring-offset-1 ring-offset-[#111827] scale-110" : "hover:scale-110"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Status selector */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Estado</div>
              <div className="flex gap-2">
                {(["Leyendo","Completado","Pendiente"] as Book["status"][]).map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusVal(s)}
                    className={`flex-1 py-2 text-xs font-medium rounded-xl border transition-all ${statusVal === s ? `${STATUS_BADGE[s]} border-current` : "border-[#2E3D52] text-slate-500 hover:text-slate-300 bg-[#1A2332]"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Título *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="Ej. Cien años de soledad" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Autor *</label>
              <input value={author} onChange={e => setAuthor(e.target.value)} type="text" placeholder="Ej. Gabriel García Márquez" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Páginas</label>
                <input value={pages} onChange={e => setPages(e.target.value)} type="number" placeholder="432" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Género</label>
                <input value={genre} onChange={e => setGenre(e.target.value)} type="text" placeholder="Fantasía" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all" />
              </div>
            </div>

            <button
              disabled={!title || !author}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl transition-all hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
            >
              Continuar →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── BookDetailModal ──────────────── */
function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const [notes, setNotes] = useState(book.notes ?? "");
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-[#111827] rounded-2xl max-w-sm w-full overflow-hidden border border-[#2E3D52]" onClick={e => e.stopPropagation()}>
        {/* Cover */}
        <div className="relative h-44" style={{ background: book.color }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <X size={13} />
          </button>
          <div className="absolute bottom-3 left-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_BADGE[book.status]}`}>
              {book.status}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: "Georgia, serif" }}>{book.title}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{book.author}</p>
          {book.genre && (
            <span className="mt-2 inline-block text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 rounded-full px-2.5 py-0.5">
              {book.genre}
            </span>
          )}
          {book.rating !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={`text-sm ${i < book.rating! ? "text-amber-400" : "text-slate-700"}`}>★</span>
                ))}
              </div>
              <span className="text-xs text-slate-500">{book.totalPages} páginas</span>
            </div>
          )}

          {/* Progress */}
          {book.progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Progreso de lectura</span>
                <span className="text-xs font-bold text-amber-400">{book.progress}%</span>
              </div>
              <ProgressBar pct={book.progress} />
              <p className="text-xs text-slate-500 mt-1">{book.currentPage} de {book.totalPages} páginas leídas</p>
            </div>
          )}

          {/* Details */}
          <div className="mt-4 bg-[#1A2332] rounded-xl p-3.5 border border-[#2E3D52] space-y-2">
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Detalles</div>
            {[
              ["Género", book.genre],
              ["Total páginas", book.totalPages?.toString()],
              ["Estado", book.status],
            ].map(([k, v]) => v && (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-slate-500">{k}</span>
                <span className="text-white">{v}</span>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div className="mt-4">
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1.5">Mis notas</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Escribe tus impresiones, citas favoritas…"
              rows={3}
              className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none"
            />
          </div>

          <div className="flex gap-2.5 mt-4">
            <button className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30">
              Actualizar progreso
            </button>
            <button onClick={onClose} className="px-5 py-3 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main Page ──────────────── */
type FilterType = "Todos" | "Leyendo" | "Completados" | "Pendientes";

export default function BibliotecaPage() {
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [filter, setFilter] = useState<FilterType>("Todos");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [factIdx, setFactIdx] = useState(0);

  const filtered = books.filter(b => {
    const matchFilter =
      filter === "Todos" ||
      (filter === "Leyendo" && b.status === "Leyendo") ||
      (filter === "Completados" && b.status === "Completado") ||
      (filter === "Pendientes" && b.status === "Pendiente");
    const matchSearch =
      !search ||
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      b.author.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts: Record<FilterType, number> = {
    Todos: books.length,
    Leyendo: books.filter(b => b.status === "Leyendo").length,
    Completados: books.filter(b => b.status === "Completado").length,
    Pendientes: books.filter(b => b.status === "Pendiente").length,
  };

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Mi Biblioteca</h1>
          <p className="text-slate-500 text-sm mt-0.5">{books.length} libros en tu colección</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-900/30 hover:from-amber-400 hover:to-amber-600 transition-all"
        >
          <Plus size={15} /> Agregar libro
        </button>
      </div>

      {/* Fact card */}
      <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-4 mb-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-700/20 flex items-center justify-center flex-shrink-0">
          <span className="text-base">📚</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-1">Dato curioso</div>
          <p className="text-sm text-slate-300 leading-snug">{FACTS[factIdx].text}</p>
          <p className="text-xs text-slate-600 mt-1">— {FACTS[factIdx].source}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={() => setFactIdx(i => (i - 1 + FACTS.length) % FACTS.length)} className="w-6 h-6 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <ChevronLeft size={11} />
          </button>
          <button onClick={() => setFactIdx(i => (i + 1) % FACTS.length)} className="w-6 h-6 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <ChevronRight size={11} />
          </button>
        </div>
      </div>

      {/* Search + filter tabs */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título o autor…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#1A2332] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30"
          />
        </div>
        <div className="flex gap-1.5 flex-shrink-0 overflow-x-auto pb-0.5">
          {(["Todos", "Leyendo", "Completados", "Pendientes"] as FilterType[]).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === f
                  ? "bg-amber-700/25 text-amber-400 border border-amber-700/30"
                  : "text-slate-400 hover:text-white bg-[#111827] border border-[#1A2332]"
              }`}
            >
              {f} <span className="text-xs opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Book grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map(book => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => setSelectedBook(book)}
            onDelete={() => setDeleteBook(book)}
          />
        ))}
        {/* Add new card */}
        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#111827] border-2 border-dashed border-[#2E3D52] rounded-2xl flex flex-col items-center justify-center gap-2 h-[230px] text-slate-700 hover:text-slate-500 hover:border-[#3A4D66] transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-[#1A2332] flex items-center justify-center group-hover:bg-[#243044] transition-colors">
            <Plus size={18} />
          </div>
          <span className="text-xs font-medium">Nuevo libro</span>
        </button>
      </div>

      {/* ── Modals ── */}
      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}

      {/* Delete confirm */}
      {deleteBook && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setDeleteBook(null)}>
          <div className="bg-[#111827] rounded-2xl max-w-xs w-full p-6 border border-[#2E3D52] text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">¿Eliminar libro?</h3>
            <p className="text-slate-400 text-sm mb-1">&ldquo;{deleteBook.title}&rdquo;</p>
            <p className="text-slate-600 text-xs mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteBook(null)} className="flex-1 py-2.5 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => { setBooks(books.filter(b => b.id !== deleteBook.id)); setDeleteBook(null); }}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-500 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
