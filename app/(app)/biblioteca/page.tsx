"use client";

import { useEffect, useState } from "react";
import { Search, Plus, X, ChevronLeft, ChevronRight, Trash2, Pencil } from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/data/api";

/* ──────────────── Types ──────────────── */
interface Book {
  id: string; // id de library
  bookId?: string; // id del libro global
  title: string;
  author: string;
  color: string;
  status: string;
  progress?: number;
  currentPage?: number;
  totalPages: number;
  genre?: string;
  format?: string;
}

interface CatalogItem {
  id: number;
  name: string;
  description?: string;
}

/* ──────────────── Data ──────────────── */
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
  "#c2410c", "#d97706", "#15803d", "#1d4ed8", "#0891b2", "#7c3aed",
  "#db2777", "#475569", "#4338ca", "#dc2626", "#0d9488", "#374151",
];

const FALLBACK_STATUSES: CatalogItem[] = [
  { id: 1, name: "Leyendo" },
  { id: 2, name: "Terminado" },
  { id: 3, name: "Pausado" },
  { id: 4, name: "Abandonado" },
  { id: 5, name: "Por Leer" },
];

const STATUS_BADGE: Record<string, string> = {
  Leyendo: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  Terminado: "bg-green-500/15 text-green-300 border-green-500/30",
  Pausado: "bg-yellow-500/15 text-yellow-300 border-yellow-500/30",
  Abandonado: "bg-red-500/15 text-red-300 border-red-500/30",
  "Por Leer": "bg-slate-500/15 text-slate-400 border-slate-500/20",
};

const statusClass = (status: string) =>
  STATUS_BADGE[status] || "bg-slate-500/15 text-slate-400 border-slate-500/20";

const statusIdFromName = (statuses: CatalogItem[], name: string) =>
  statuses.find((s) => s.name.toLowerCase() === name.toLowerCase())?.id || 1;

const coverFromValue = (coverValue?: string, index = 0) => {
  if (coverValue && coverValue.startsWith("#")) return `linear-gradient(160deg,${coverValue},#111827)`;
  return COVER_COLORS[index % COVER_COLORS.length];
};

const ProgressBar = ({ pct }: { pct: number }) => (
  <div className="w-full h-1 bg-[#2E3D52] rounded-full overflow-hidden">
    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
  </div>
);

/* ──────────────── BookCard ──────────────── */
function BookCard({
  book,
  onClick,
  onDelete,
  onEdit,
}: {
  book: Book;
  onClick: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <div
      className="relative bg-[#111827] rounded-2xl overflow-hidden cursor-pointer group border border-[#1E2A3A] hover:border-[#2E3D52] transition-all hover:shadow-lg hover:shadow-black/30"
      onClick={onClick}
    >
      <div className="w-full h-40 relative" style={{ background: book.color }}>
        <button
          type="button"
          title="Editar"
          className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 hover:bg-amber-600/40"
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
        >
          <Pencil size={11} />
        </button>

        <button
          type="button"
          title="Eliminar"
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-600/40"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 size={11} />
        </button>

        <div className="absolute bottom-2.5 left-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusClass(book.status)}`}>
            {book.status}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="font-semibold text-white text-sm leading-tight line-clamp-1">{book.title}</div>
        <div className="text-slate-500 text-xs mt-0.5 truncate">{book.author}</div>

        {(book.genre || book.format) && (
          <div className="text-[10px] text-slate-500 mt-1.5 truncate">
            {[book.genre, book.format].filter(Boolean).join(" · ")}
          </div>
        )}

        {book.progress !== undefined ? (
          <div className="mt-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Progreso</span>
              <span className="text-[10px] font-bold text-amber-400">{book.progress}%</span>
            </div>
            <ProgressBar pct={book.progress} />
            <div className="text-[10px] text-slate-600 mt-1">
              {book.currentPage ?? 0} / {book.totalPages || "?"} págs
            </div>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 mt-2">
            {book.totalPages || "?"} páginas
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── AddBookModal ──────────────── */
function AddBookModal({ onClose, onAdded }: { onClose: () => void; onAdded?: () => void }) {
  const [tab, setTab] = useState<"search" | "manual">("manual");
  const [selectedColor, setSelectedColor] = useState(0);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [pages, setPages] = useState("");
  const [statusId, setStatusId] = useState<number>(1);
  const [genreId, setGenreId] = useState<number | "">("");
  const [formatId, setFormatId] = useState<number | "">(5);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<CatalogItem[]>([]);
  const [formats, setFormats] = useState<CatalogItem[]>([]);
  const [statuses, setStatuses] = useState<CatalogItem[]>(FALLBACK_STATUSES);
  const [authors, setAuthors] = useState<CatalogItem[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<CatalogItem | null>(null);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [genrePage, formatPage, statusPage, authorPage] = await Promise.all([
          api.genders.getAll({ page: 0, size: 50 }).catch(() => ({ content: [] })),
          api.formats.getAll({ page: 0, size: 50 }).catch(() => ({ content: [] })),
          api.readingStatus.getAll({ page: 0, size: 50 }).catch(() => ({ content: FALLBACK_STATUSES })),
          api.authors.getAll({ page: 0, size: 300 }).catch(() => ({ content: [] })),
        ]);

        setGenres(genrePage.content || []);
        setFormats(formatPage.content || []);
        setStatuses(statusPage.content?.length ? statusPage.content : FALLBACK_STATUSES);
        setAuthors(authorPage.content || []);

        // ✅ Forma funcional: lee el valor más reciente de formatId sin
        // necesitar que "formatId" esté en el arreglo de dependencias del
        // useEffect. Así este efecto sigue corriendo UNA sola vez al montar
        // (no cada vez que formatId cambia, lo que provocaría refetches
        // innecesarios de los 4 catálogos).
        setFormatId((current) =>
          current === "" && formatPage.content?.[0]?.id ? formatPage.content[0].id : current
        );
      } catch {
        setGenres([]);
        setFormats([]);
        setStatuses(FALLBACK_STATUSES);
        setAuthors([]);
      }
    };

    void loadCatalogs();
  }, []); // ✅ ya no genera el warning de exhaustive-deps: no leemos formatId por closure

  const fetchBooks = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const page = await api.books.getAll({ q: searchQuery.trim(), size: 12 });
      const mapped: Book[] = (page.content || []).map((b: any, index: number) => ({
        id: b.id,
        bookId: b.id,
        title: b.title,
        author: (b.authors && b.authors.map((a: any) => a.name).join(", ")) || b.origin || "Desconocido",
        color: coverFromValue(b.coverValue, index),
        status: "Por Leer",
        totalPages: b.defaultPages || b.defaultChapters || 200,
        genre: b.genres?.[0]?.name,
        format: b.format?.name,
      }));
      setSearchResults(mapped);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (!selectedBookId && (!title.trim() || !selectedAuthor)) {
      setError("Título y autor son obligatorios. Selecciona un autor de la lista.");
      return;
    }

    if (!selectedBookId && !formatId) {
      setError("Selecciona un formato de libro.");
      return;
    }

    setAdding(true);
    try {
      const currentPage = statusId === 2 ? Number(pages) || 1 : 1;

      if (selectedBookId) {
        await api.library.add({
          bookId: selectedBookId,
          readingStatusId: Number(statusId),
          currentPage,
        });
      } else {
        await api.library.add({
          bookData: {
            title: title.trim(),
            defaultChapters: 0,
            defaultPages: Number(pages) || 200,
            origin: selectedAuthor?.name || author.trim(),
            coverType: "COLOR",
            coverValue: SOLID_COLORS[selectedColor] || "#334155",
            formatId: Number(formatId),
            authorIds: selectedAuthor ? [selectedAuthor.id] : [],
            genreIds: genreId ? [Number(genreId)] : [],
          },
          readingStatusId: Number(statusId),
          currentPage,
        });
      }

      await Swal.fire({ icon: "success", title: "Libro agregado", text: "Se agregó el libro a tu biblioteca." });
      onAdded?.();
      onClose();
    } catch (err: any) {
      const message = String(err?.message || "");
      if (message.includes("integridad") || message.includes("vinculado") || message.includes("409")) {
        setError("No se pudo agregar: puede que el libro ya exista en el catálogo o ya esté en tu biblioteca. Intenta buscarlo en la pestaña Buscar.");
      } else {
        setError(message || "No se pudo agregar el libro.");
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0" onClick={onClose}>
      <div className="bg-[#111827] rounded-2xl w-full max-w-md border border-[#2E3D52] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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

        <div className="px-5 pt-4">
          <div className="flex rounded-xl bg-[#1A2332] p-1 mb-4">
            <button
              type="button"
              onClick={() => setTab("search")}
              className={`flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 ${tab === "search" ? "bg-[#243044] text-amber-400" : "text-slate-400 hover:text-white"}`}
            >
              <Search size={12} /> Buscar
            </button>
            <button
              type="button"
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
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void fetchBooks(); }}
                type="text"
                placeholder="Busca por título, autor o ISBN"
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Resultados</div>
                <button type="button" onClick={() => void fetchBooks()} className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors">
                  Buscar
                </button>
              </div>
              <div className="space-y-2">
                {searching ? (
                  <div className="text-xs text-slate-400">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((b) => (
                    <div key={b.id} className="flex items-center gap-3 bg-[#1A2332] rounded-xl p-3 border border-[#2E3D52]">
                      <div className="w-10 h-14 rounded-lg flex-shrink-0" style={{ background: b.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{b.title}</div>
                        <div className="text-xs text-slate-500">{b.author}</div>
                        <div className="text-[10px] text-slate-600">{[b.genre, b.format].filter(Boolean).join(" · ")}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBookId(b.id);
                          setTitle(b.title);
                          setAuthor(b.author);
                          setPages(String(b.totalPages));
                          setTab("manual");
                        }}
                        className="text-xs px-3 py-1 rounded-md bg-amber-500 text-black font-semibold"
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">Presiona Buscar o Enter para ver resultados.</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            <div className="flex gap-4 items-start">
              <div className="w-16 h-20 rounded-xl flex-shrink-0 border border-[#2E3D52]" style={{ background: COVER_COLORS[selectedColor] }} />
              <div className="flex-1">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Color de portada</div>
                <div className="flex gap-1.5 flex-wrap">
                  {SOLID_COLORS.map((c, i) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setSelectedColor(i)}
                      className={`w-5 h-5 rounded-full transition-all ${selectedColor === i ? "ring-2 ring-white ring-offset-1 ring-offset-[#111827] scale-110" : "hover:scale-110"}`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Estado</div>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setStatusId(s.id)}
                    className={`py-2 text-xs font-medium rounded-xl border transition-all ${statusId === s.id ? `${statusClass(s.name)} border-current` : "border-[#2E3D52] text-slate-500 hover:text-slate-300 bg-[#1A2332]"}`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Título *</label>
              <input disabled={!!selectedBookId} value={title} onChange={(e) => setTitle(e.target.value)} type="text" placeholder="Ej. Cien años de soledad" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all disabled:opacity-50" />
            </div>

            <div className="relative">
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Autor *</label>
              <input
                disabled={!!selectedBookId}
                value={selectedAuthor ? selectedAuthor.name : authorSearch}
                onChange={(e) => {
                  setAuthorSearch(e.target.value);
                  setSelectedAuthor(null);
                  setAuthor(e.target.value);
                }}
                type="text"
                placeholder="Busca y selecciona un autor"
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all disabled:opacity-50"
              />

              {!selectedBookId && !selectedAuthor && authorSearch.trim().length > 0 && (
                <div className="absolute z-30 mt-1 w-full bg-[#111827] border border-[#2E3D52] rounded-xl max-h-48 overflow-y-auto shadow-xl">
                  {authors
                    .filter((a) => a.name.toLowerCase().includes(authorSearch.toLowerCase()))
                    .slice(0, 10)
                    .map((a) => (
                      <button
                        type="button"
                        key={a.id}
                        onClick={() => {
                          setSelectedAuthor(a);
                          setAuthor(a.name);
                          setAuthorSearch("");
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1A2332] hover:text-white transition-colors"
                      >
                        {a.name}
                      </button>
                    ))}

                  {authors.filter((a) => a.name.toLowerCase().includes(authorSearch.toLowerCase())).length === 0 && (
                    <div className="px-4 py-2.5 text-xs text-slate-500">No se encontraron autores.</div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Páginas</label>
                <input value={pages} onChange={(e) => setPages(e.target.value)} type="number" placeholder="432" className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all" />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Género</label>
                <select
                  disabled={!!selectedBookId}
                  value={genreId}
                  onChange={(e) => setGenreId(e.target.value ? Number(e.target.value) : "")}
                  className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40 disabled:opacity-50"
                >
                  <option value="">Selecciona</option>
                  {genres.map((g) => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Formato *</label>
              <select
                disabled={!!selectedBookId}
                value={formatId}
                onChange={(e) => setFormatId(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40 disabled:opacity-50"
              >
                <option value="">Selecciona formato</option>
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            {selectedBookId && (
              <p className="text-[10px] text-slate-500">
                Este libro ya existe en el catálogo. Solo se agregará a tu biblioteca con el estado seleccionado.
              </p>
            )}

            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

            <button
              disabled={(!selectedBookId && (!title || !selectedAuthor || !formatId)) || adding}
              onClick={() => void handleSave()}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl transition-all hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
            >
              {adding ? "Guardando..." : "Continuar →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────── EditBookModal ──────────────── */
function EditBookModal({
  book,
  onClose,
  onSaved,
}: {
  book: Book;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const [statuses, setStatuses] = useState<CatalogItem[]>(FALLBACK_STATUSES);
  const [statusId, setStatusId] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState(String(book.currentPage ?? 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatuses = async () => {
      try {
        const page = await api.readingStatus.getAll({ page: 0, size: 50 });
        const content = page.content?.length ? page.content : FALLBACK_STATUSES;
        setStatuses(content);
        setStatusId(statusIdFromName(content, book.status));
      } catch {
        setStatuses(FALLBACK_STATUSES);
        setStatusId(statusIdFromName(FALLBACK_STATUSES, book.status));
      }
    };

    void loadStatuses();
  }, [book.status]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      await api.library.updateProgress(book.id, {
        readingStatusId: Number(statusId),
        currentPage: Math.max(1, Number(currentPage) || 1),
      });

      await Swal.fire({ icon: "success", title: "Libro actualizado", text: "Se actualizó el estado del libro." });
      onSaved?.();
      onClose();
    } catch (err: any) {
      setError(err?.message || "No se pudo editar el libro.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-[#111827] rounded-2xl max-w-md w-full border border-[#2E3D52]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-[#1A2332]">
          <div>
            <h3 className="font-bold text-white">Editar libro</h3>
            <p className="text-slate-500 text-xs mt-0.5">Actualiza estado y progreso</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#1A2332] flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <div className="w-12 h-16 rounded-lg flex-shrink-0" style={{ background: book.color }} />
            <div className="min-w-0">
              <div className="text-white font-semibold truncate">{book.title}</div>
              <div className="text-xs text-slate-500 truncate">{book.author}</div>
              <div className="text-[10px] text-slate-600 truncate">{[book.genre, book.format].filter(Boolean).join(" · ")}</div>
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Estado</div>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStatusId(s.id)}
                  className={`py-2 text-xs font-medium rounded-xl border transition-all ${statusId === s.id ? `${statusClass(s.name)} border-current` : "border-[#2E3D52] text-slate-500 hover:text-slate-300 bg-[#1A2332]"}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">Página actual</label>
            <input
              value={currentPage}
              onChange={(e) => setCurrentPage(e.target.value)}
              type="number"
              min={1}
              max={book.totalPages || undefined}
              className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
            />
          </div>

          <p className="text-[10px] text-slate-500">
            Para usuarios normales, el backend permite editar la biblioteca con PATCH: estado y progreso. Título, género y formato se definen al agregar el libro.
          </p>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all disabled:opacity-40"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── BookDetailModal ──────────────── */
function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-[#111827] rounded-2xl max-w-sm w-full overflow-hidden border border-[#2E3D52]" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-44" style={{ background: book.color }}>
          <button onClick={onClose} className="absolute top-3 right-3 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors">
            <X size={13} />
          </button>
          <div className="absolute bottom-3 left-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${statusClass(book.status)}`}>
              {book.status}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h2 className="text-xl font-bold text-white leading-tight" style={{ fontFamily: "Georgia, serif" }}>{book.title}</h2>
          <p className="text-slate-400 text-sm mt-0.5">{book.author}</p>

          {(book.genre || book.format) && (
            <span className="mt-2 inline-block text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 rounded-full px-2.5 py-0.5">
              {[book.genre, book.format].filter(Boolean).join(" · ")}
            </span>
          )}

          {book.progress !== undefined && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">Progreso de lectura</span>
                <span className="text-xs font-bold text-amber-400">{book.progress}%</span>
              </div>
              <ProgressBar pct={book.progress} />
              <p className="text-xs text-slate-500 mt-1">{book.currentPage ?? 0} de {book.totalPages || "?"} páginas leídas</p>
            </div>
          )}

          <div className="mt-4 bg-[#1A2332] rounded-xl p-3.5 border border-[#2E3D52] space-y-2">
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Detalles</div>
            {[
              ["Género", book.genre],
              ["Formato", book.format],
              ["Total páginas", book.totalPages?.toString()],
              ["Estado", book.status],
            ].map(([k, v]) => v && (
              <div key={k} className="flex justify-between text-sm gap-3">
                <span className="text-slate-500">{k}</span>
                <span className="text-white text-right">{v}</span>
              </div>
            ))}
          </div>

          <button onClick={onClose} className="w-full mt-4 py-3 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────── Main Page ──────────────── */
type FilterType = "Todos" | "Leyendo" | "Terminado" | "Pausado" | "Abandonado" | "Por Leer";

export default function BibliotecaPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<FilterType>("Todos");
  const [search, setSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [factIdx, setFactIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const data = await api.library.getAll();
      const mapped = (data || []).map((item: any, i: number) => {
        const total = Number(item.book?.defaultPages ?? item.book?.defaultChapters ?? 0);
        const current = Number(item.currentPage ?? 0);
        const progress = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : undefined;

        return {
          id: item.id,
          bookId: item.book?.id,
          title: item.customTitle || item.book?.title || "Sin título",
          author: (item.book?.authors && item.book.authors.map((a: any) => a.name).join(", ")) || item.book?.origin || "Autor desconocido",
          color: coverFromValue(item.customCoverValue || item.book?.coverValue, i),
          status: item.readingStatus?.name || "Por Leer",
          progress,
          currentPage: current,
          totalPages: item.customPages || total,
          genre: item.book?.genres?.[0]?.name,
          format: item.book?.format?.name,
        } as Book;
      });
      setBooks(mapped);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLibrary();
  }, []);

  const filtered = books.filter((b) => {
    const matchFilter = filter === "Todos" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().includes(q) ||
      b.author.toLowerCase().includes(q) ||
      (b.genre || "").toLowerCase().includes(q) ||
      (b.format || "").toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const filters: FilterType[] = ["Todos", "Leyendo", "Terminado", "Pausado", "Abandonado", "Por Leer"];

  const counts: Record<FilterType, number> = {
    Todos: books.length,
    Leyendo: books.filter((b) => b.status === "Leyendo").length,
    Terminado: books.filter((b) => b.status === "Terminado").length,
    Pausado: books.filter((b) => b.status === "Pausado").length,
    Abandonado: books.filter((b) => b.status === "Abandonado").length,
    "Por Leer": books.filter((b) => b.status === "Por Leer").length,
  };

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>Mi Biblioteca</h1>
          <p className="text-slate-500 text-sm mt-0.5">{loading ? "Cargando..." : `${books.length} libros en tu colección`}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-900/30 hover:from-amber-400 hover:to-amber-600 transition-all"
        >
          <Plus size={15} /> Agregar libro
        </button>
      </div>

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
          <button onClick={() => setFactIdx((i) => (i - 1 + FACTS.length) % FACTS.length)} className="w-6 h-6 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <ChevronLeft size={11} />
          </button>
          <button onClick={() => setFactIdx((i) => (i + 1) % FACTS.length)} className="w-6 h-6 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 hover:text-white flex items-center justify-center transition-colors">
            <ChevronRight size={11} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por título, autor, género o formato…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111827] border border-[#1A2332] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30"
          />
        </div>
        <div className="flex gap-1.5 flex-shrink-0 overflow-x-auto pb-0.5">
          {filters.map((f) => (
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => setSelectedBook(book)}
            onEdit={() => setEditBook(book)}
            onDelete={() => setDeleteBook(book)}
          />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full text-center text-slate-500 py-16 border border-dashed border-[#2E3D52] rounded-2xl">
            No hay libros que coincidan con tu búsqueda.
          </div>
        )}

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

      {selectedBook && <BookDetailModal book={selectedBook} onClose={() => setSelectedBook(null)} />}
      {editBook && <EditBookModal book={editBook} onClose={() => setEditBook(null)} onSaved={() => void loadLibrary()} />}

      {deleteBook && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4" onClick={() => setDeleteBook(null)}>
          <div className="bg-[#111827] rounded-2xl max-w-xs w-full p-6 border border-[#2E3D52] text-center" onClick={(e) => e.stopPropagation()}>
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
                onClick={async () => {
                  try {
                    await api.library.remove(deleteBook.id);
                    setBooks((current) => current.filter((b) => b.id !== deleteBook.id));
                    setDeleteBook(null);
                    await Swal.fire({ icon: "success", title: "Eliminado", text: "El libro se eliminó de tu biblioteca." });
                  } catch (err: any) {
                    await Swal.fire({ icon: "error", title: "Error", text: err?.message || "No se pudo eliminar el libro." });
                  }
                }}
                className="flex-1 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-500 transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <AddBookModal onClose={() => setShowAdd(false)} onAdded={() => void loadLibrary()} />}
    </div>
  );
}