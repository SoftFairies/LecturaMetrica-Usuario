"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  X,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Pencil,
  Sparkles,
  Heart,
} from "lucide-react";
import Swal from "sweetalert2";
import { api, BookResponse } from "@/data/api";

interface Book {
  id: string; 
  bookId?: string; 
  title: string;
  author: string;
  cover?: string;
  status: string; 
  format?: string; 
  formatId?: number;
  genre?: string;
  totalPages?: number;
  totalChapters?: number;
  currentChapter?: number;
  currentPage?: number;
  isFavorite?: boolean;
}

interface BookNote {
  id: string;
  page?: number;
  chapter?: number;
  content: string;
  createdAt?: string;
}


interface CatalogItem {
  id: number;
  name: string;
  description?: string;
}

const FACTS = [
  {
    text: "El libro mas largo del mundo, 'A la recherche du temps perdu' de Proust, tiene 1.5 millones de palabras.",
    source: "Guinness World Records",
  },
  {
    text: "La primera novela del mundo se considera 'Genji Monogatari', escrita por Murasaki Shikibu en el ano 1000.",
    source: "Historia de la Literatura",
  },
  {
    text: "El promedio de lectura de un adulto es de unas 250 palabras por minuto.",
    source: "Investigacion linguistica",
  },
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
  "#c2410c",
  "#d97706",
  "#15803d",
  "#1d4ed8",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#475569",
  "#4338ca",
  "#dc2626",
  "#0d9488",
  "#374151",
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

const isImageCover = (cover?: string) => !!cover && /^https?:\/\//i.test(cover);

const coverGradient = (cover?: string, index = 0) => {
  if (cover && cover.startsWith("#")) return "linear-gradient(160deg," + cover + ",#111827)";
  return COVER_COLORS[index % COVER_COLORS.length];
};


const normalizeBookNote = (note: any): BookNote => {
  const page = Number(note?.page);
  const chapter = Number(note?.chapter);

  return {
    id: String(note?.id ?? crypto.randomUUID?.() ?? Date.now()),
    page: Number.isFinite(page) && page > 0 ? Math.trunc(page) : undefined,
    chapter: Number.isFinite(chapter) && chapter > 0 ? Math.trunc(chapter) : undefined,
    content: String(note?.content ?? note?.text ?? ""),
    createdAt: String(note?.createdAt ?? note?.updatedAt ?? ""),
  };
};

const isAnnotationNote = (note: BookNote) => Boolean(note.page && note.chapter);

const formatNoteDate = (value?: string) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString();
};


const getBookPagesFromResponse = (book: any): number | null => {
  const value =
    book?.totalPage ??
    book?.totalPages ??
    book?.customPages ??
    book?.defaultPages ??
    book?.pages ??
    book?.pageCount ??
    book?.volumeInfo?.pageCount;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
};

const getBookChaptersFromResponse = (book: any): number | null => {
  const value =
    book?.totalChapter ??
    book?.totalChapters ??
    book?.customChapters ??
    book?.defaultChapters ??
    book?.chapters ??
    book?.chapterCount;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.trunc(parsed) : null;
};

function CoverThumb({
  cover,
  index = 0,
  className,
}: {
  cover?: string;
  index?: number;
  className: string;
}) {
  if (isImageCover(cover)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={cover} alt="" className={className + " object-cover"} />;
  }
  return <div className={className} style={{ background: coverGradient(cover, index) }} />;
}

function RecommendedBookCard({
  book,
  onAdd,
  onDismiss,
  adding,
}: {
  book: BookResponse;
  onAdd: () => void;
  onDismiss: () => void;
  adding: boolean;
}) {
  const authorNames =
    (book.authors && book.authors.map((a) => a.name).join(", ")) || "Autor desconocido";
  const tags = book.genres && book.genres[0] ? book.genres[0].name : "";

  return (
    <div className="bg-gradient-to-br from-amber-900/20 via-[#111827] to-[#111827] border border-amber-700/30 rounded-2xl p-4 mb-5 flex items-start gap-4 relative">
      <button
        onClick={onDismiss}
        title="Ocultar recomendacion"
        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-black/30 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
      >
        <X size={12} />
      </button>

      <CoverThumb cover={book.cover} className="w-14 h-20 rounded-xl flex-shrink-0 border border-[#2E3D52]" />

      <div className="flex-1 min-w-0 pr-6">
        <div className="flex items-center gap-1.5 mb-1">
          <Sparkles size={11} className="text-amber-500 flex-shrink-0" />
          <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest">
            Recomendado para ti
          </span>
        </div>
        <div className="font-semibold text-white text-sm leading-tight truncate">{book.title}</div>
        <div className="text-slate-500 text-xs mt-0.5 truncate">{authorNames}</div>
        {tags && <div className="text-[10px] text-slate-600 mt-1 truncate">{tags}</div>}

        <button
          type="button"
          onClick={onAdd}
          disabled={adding}
          className="mt-2.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-400 border border-amber-600/30 hover:bg-amber-600/30 transition-colors disabled:opacity-40"
        >
          {adding ? "Agregando..." : "+ Agregar a mi biblioteca"}
        </button>
      </div>
    </div>
  );
}

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
      <div className="w-full h-40 relative">
        <CoverThumb cover={book.cover} className="w-full h-full absolute inset-0" />

        <button
          type="button"
          title="Editar"
          className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-amber-400 hover:bg-amber-600/40"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Pencil size={11} />
        </button>

        <button
          type="button"
          title="Eliminar"
          className="absolute top-2 right-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:bg-red-600/40"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 size={11} />
        </button>

        {book.isFavorite && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-md flex items-center justify-center text-pink-400">
            <Heart size={11} fill="currentColor" />
          </div>
        )}

        <div className="absolute bottom-2.5 left-2.5">
          <span
            className={
              "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider " +
              statusClass(book.status)
            }
          >
            {book.status}
          </span>
        </div>
      </div>

      <div className="p-3">
        <div className="font-semibold text-white text-sm leading-tight line-clamp-1">
          {book.title}
        </div>
        <div className="text-slate-500 text-xs mt-0.5 truncate">{book.author}</div>

        {(book.genre || book.format) && (
          <div className="text-[10px] text-slate-500 mt-1.5 truncate">
            {[book.genre, book.format].filter(Boolean).join(" - ")}
          </div>
        )}

        {(book.currentChapter || book.currentPage) && (
          <div className="text-[10px] text-slate-600 mt-2">
            {book.currentChapter ? "Cap. " + book.currentChapter : null}
            {book.currentChapter && book.currentPage ? " - " : null}
            {book.currentPage ? "Pag. " + book.currentPage : null}
          </div>
        )}
      </div>
    </div>
  );
}

function AddBookModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded?: () => void;
}) {
  const [tab, setTab] = useState<"search" | "manual">("manual");
  const [selectedColor, setSelectedColor] = useState(0);
  const [title, setTitle] = useState("");
  const [totalPagesInput, setTotalPagesInput] = useState("");
  const [totalChaptersInput, setTotalChaptersInput] = useState("1");
  const [statusId, setStatusId] = useState<number>(1);
  const [genreId, setGenreId] = useState<number | "">("");
  const [formatId, setFormatId] = useState<number | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BookResponse[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [selectedBook, setSelectedBook] = useState<BookResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [genres, setGenres] = useState<CatalogItem[]>([]);
  const [formats, setFormats] = useState<CatalogItem[]>([]);
  const [statuses, setStatuses] = useState<CatalogItem[]>(FALLBACK_STATUSES);
  const [authors, setAuthors] = useState<CatalogItem[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [selectedAuthor, setSelectedAuthor] = useState<CatalogItem | null>(null);
  const [genreSearch, setGenreSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<CatalogItem | null>(null);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const results = await Promise.all([
          api.genders.getAll({ page: 0, size: 50 }).catch(() => ({ content: [] as CatalogItem[] })),
          api.formats.getAll({ page: 0, size: 50 }).catch(() => ({ content: [] as CatalogItem[] })),
          api.readingStatus
            .getAll({ page: 0, size: 50 })
            .catch(() => ({ content: FALLBACK_STATUSES })),
          api.authors.getAll({ page: 0, size: 300 }).catch(() => ({ content: [] as CatalogItem[] })),
        ]);
        const genrePage = results[0];
        const formatPage = results[1];
        const statusPage = results[2];
        const authorPage = results[3];

        setGenres(genrePage.content || []);
        setFormats(formatPage.content || []);
        setStatuses(
          statusPage.content && statusPage.content.length ? statusPage.content : FALLBACK_STATUSES,
        );
        setAuthors(authorPage.content || []);

        setFormatId((current) =>
          current === "" && formatPage.content && formatPage.content[0]
            ? formatPage.content[0].id
            : current,
        );
      } catch {
        setGenres([]);
        setFormats([]);
        setStatuses(FALLBACK_STATUSES);
        setAuthors([]);
      }
    };

    void loadCatalogs();
  }, []);

  const fetchBooks = async () => {
    const q = searchQuery.trim();

    if (q.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const results = await api.books.search(q);
      setSearchResults(Array.isArray(results) ? results.slice(0, 12) : []);
    } catch (err: any) {
      setSearchResults([]);
      setError((err && err.message) || "No se pudieron buscar libros.");
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    setError(null);

    if (!formatId) {
      setError("Selecciona un formato.");
      return;
    }

    if (!selectedBook && !title.trim()) {
      setError("El titulo es obligatorio.");
      return;
    }

    const totalPages = Number(totalPagesInput);
    const totalChapters = Number(totalChaptersInput);

    if (!Number.isFinite(totalPages) || totalPages <= 0) {
      setError("Ingresa cuántas páginas tiene el libro.");
      return;
    }

    if (!Number.isFinite(totalChapters) || totalChapters <= 0) {
      setError("Ingresa cuántos capítulos tiene el libro.");
      return;
    }

    const normalizedTotalPages = Math.trunc(totalPages);
    const normalizedTotalChapters = Math.trunc(totalChapters);

    setAdding(true);
    try {
      const baseLibraryPayload = {
        readingStatusId: Number(statusId),
        formatId: Number(formatId),
        currentChapter: 1,
        currentPage: 1,
        isFavorite: false,
      };

      if (selectedBook) {
        if (selectedBook.id) {
          await api.library.add({
            bookId: selectedBook.id,
            totalPage: normalizedTotalPages,
            totalChapter: normalizedTotalChapters,
            ...baseLibraryPayload,
          } as any);
        } else {
          await api.library.add({
            newBook: {
              title: selectedBook.title || title.trim(),
              authors:
                selectedBook.authors?.length
                  ? selectedBook.authors.map((author) =>
                      author.id ? { id: author.id } : { name: author.name },
                    )
                  : [],
              genres:
                selectedBook.genres?.length
                  ? selectedBook.genres.map((genre) =>
                      genre.id ? { id: genre.id } : { name: genre.name },
                    )
                  : selectedGenre
                    ? [{ id: selectedGenre.id }]
                    : genreSearch.trim()
                      ? [{ name: genreSearch.trim() }]
                      : genreId
                        ? [{ id: Number(genreId) }]
                        : [],
              cover: selectedBook.cover || SOLID_COLORS[selectedColor] || "#334155",
              totalPage: normalizedTotalPages,
              totalChapter: normalizedTotalChapters,
              totalPages: normalizedTotalPages,
              totalChapters: normalizedTotalChapters,
              defaultPages: normalizedTotalPages,
              defaultChapters: normalizedTotalChapters,
              pages: normalizedTotalPages,
              chapters: normalizedTotalChapters,
            } as any,
            totalPage: normalizedTotalPages,
            totalChapter: normalizedTotalChapters,
            ...baseLibraryPayload,
          } as any);
        }
      } else {
        const authorsPayload = selectedAuthor
          ? [{ id: selectedAuthor.id }]
          : authorSearch.trim()
            ? [{ name: authorSearch.trim() }]
            : [];

        const genresPayload = selectedGenre
          ? [{ id: selectedGenre.id }]
          : genreSearch.trim()
            ? [{ name: genreSearch.trim() }]
            : genreId
              ? [{ id: Number(genreId) }]
              : [];

        await api.library.add({
          newBook: {
            title: title.trim(),
            authors: authorsPayload,
            genres: genresPayload,
            cover: SOLID_COLORS[selectedColor] || "#334155",
            totalPage: normalizedTotalPages,
            totalChapter: normalizedTotalChapters,
            totalPages: normalizedTotalPages,
            totalChapters: normalizedTotalChapters,
            defaultPages: normalizedTotalPages,
            defaultChapters: normalizedTotalChapters,
            pages: normalizedTotalPages,
            chapters: normalizedTotalChapters,
          } as any,
          totalPage: normalizedTotalPages,
          totalChapter: normalizedTotalChapters,
          ...baseLibraryPayload,
        } as any);
      }

      await Swal.fire({
        icon: "success",
        title: "Libro agregado",
        text: "Se agrego el libro a tu biblioteca.",
      });
      onAdded?.();
      onClose();
    } catch (err: any) {
      setError((err && err.message) || "No se pudo agregar el libro.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl w-full max-w-md border border-[#2E3D52] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1A2332]">
          <div>
            <h3 className="font-bold text-white">Agregar libro</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              {tab === "manual" ? "Ingresa los datos manualmente" : "Busca en nuestra base de datos"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#1A2332] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex rounded-xl bg-[#1A2332] p-1 mb-4">
            <button
              type="button"
              onClick={() => setTab("search")}
              className={
                "flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 " +
                (tab === "search" ? "bg-[#243044] text-amber-400" : "text-slate-400 hover:text-white")
              }
            >
              <Search size={12} /> Buscar
            </button>
            <button
              type="button"
              onClick={() => setTab("manual")}
              className={
                "flex-1 py-2 text-center text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 " +
                (tab === "manual" ? "bg-amber-700/30 text-amber-400" : "text-slate-400 hover:text-white")
              }
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
                onKeyDown={(e) => {
                  if (e.key === "Enter") void fetchBooks();
                }}
                type="text"
                placeholder="Busca por titulo, autor o ISBN"
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest">Resultados</div>
                <button
                  type="button"
                  onClick={() => void fetchBooks()}
                  className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors"
                >
                  Buscar
                </button>
              </div>
              <div className="space-y-2">
                {searching ? (
                  <div className="text-xs text-slate-400">Buscando...</div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((b, i) => (
                    <div
                      key={b.id ?? `${b.title}-${i}`}
                      className="flex items-center gap-3 bg-[#1A2332] rounded-xl p-3 border border-[#2E3D52]"
                    >
                      <CoverThumb cover={b.cover} index={i} className="w-10 h-14 rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white">{b.title}</div>
                        <div className="text-xs text-slate-500">
                          {(b.authors && b.authors.map((a) => a.name).join(", ")) || "Desconocido"}
                        </div>
                        <div className="text-[10px] text-slate-600">
                          {b.genres && b.genres[0] ? b.genres[0].name : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBook(b);
                          setTitle(b.title);
                          const pages = getBookPagesFromResponse(b);
                          const chapters = getBookChaptersFromResponse(b);
                          setTotalPagesInput(pages ? String(pages) : "");
                          setTotalChaptersInput(chapters ? String(chapters) : "1");
                          setTab("manual");
                        }}
                        className="text-xs px-3 py-1 rounded-md bg-amber-500 text-black font-semibold"
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-500">
                    Presiona Buscar o Enter para ver resultados.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-5 space-y-4">
            {!selectedBook && (
              <div className="flex gap-4 items-start">
                <CoverThumb
                  cover={SOLID_COLORS[selectedColor]}
                  className="w-16 h-20 rounded-xl flex-shrink-0 border border-[#2E3D52]"
                />
                <div className="flex-1">
                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                    Color de portada
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    {SOLID_COLORS.map((c, i) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setSelectedColor(i)}
                        className={
                          "w-5 h-5 rounded-full transition-all " +
                          (selectedColor === i
                            ? "ring-2 ring-white ring-offset-1 ring-offset-[#111827] scale-110"
                            : "hover:scale-110")
                        }
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedBook && (
              <div className="flex items-center gap-3 bg-[#1A2332] rounded-xl p-3 border border-[#2E3D52]">
                <CoverThumb cover={selectedBook.cover} className="w-10 h-14 rounded-lg flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white truncate">{selectedBook.title}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {(selectedBook.authors && selectedBook.authors.map((a) => a.name).join(", ")) ||
                      "Desconocido"}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBook(null);
                    setTitle("");
                    setTotalPagesInput("");
                    setTotalChaptersInput("1");
                    setSelectedGenre(null);
                    setGenreSearch("");
                  }}
                  className="text-[10px] text-slate-500 hover:text-white"
                >
                  Quitar
                </button>
              </div>
            )}

            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Estado</div>
              <div className="grid grid-cols-2 gap-2">
                {statuses.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setStatusId(s.id)}
                    className={
                      "py-2 text-xs font-medium rounded-xl border transition-all " +
                      (statusId === s.id
                        ? statusClass(s.name) + " border-current"
                        : "border-[#2E3D52] text-slate-500 hover:text-slate-300 bg-[#1A2332]")
                    }
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                Formato *
              </label>
              <select
                value={formatId}
                onChange={(e) => setFormatId(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="">Selecciona formato</option>
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-slate-600 mt-1">
                En que formato vas a leer este libro (fisico, digital, audiolibro...).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                  Páginas *
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalPagesInput}
                  onChange={(e) => setTotalPagesInput(e.target.value)}
                  placeholder="Ej. 432"
                  className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                  Capítulos *
                </label>
                <input
                  type="number"
                  min={1}
                  value={totalChaptersInput}
                  onChange={(e) => setTotalChaptersInput(e.target.value)}
                  placeholder="Ej. 20"
                  className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
                />
              </div>
            </div>

            <p className="text-[9px] text-slate-600 -mt-2">
              Estos datos se usan en la sesión de lectura para permitir sumar páginas y capítulos.
            </p>

            {!selectedBook && (
              <>
                <div>
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                    Titulo *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    type="text"
                    placeholder="Ej. Cien anos de soledad"
                    className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
                  />
                </div>

                <div className="relative">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                    Autor
                  </label>
                  <input
                    value={selectedAuthor ? selectedAuthor.name : authorSearch}
                    onChange={(e) => {
                      setAuthorSearch(e.target.value);
                      setSelectedAuthor(null);
                    }}
                    type="text"
                    placeholder="Escribe el nombre (si no existe, se crea)"
                    className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
                  />

                  {!selectedAuthor && authorSearch.trim().length > 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-[#111827] border border-[#2E3D52] rounded-xl max-h-48 overflow-y-auto shadow-xl">
                      {authors
                        .filter((a) => a.name.toLowerCase().indexOf(authorSearch.toLowerCase()) !== -1)
                        .slice(0, 10)
                        .map((a) => (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => {
                              setSelectedAuthor(a);
                              setAuthorSearch("");
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1A2332] hover:text-white transition-colors"
                          >
                            {a.name}
                          </button>
                        ))}
                      <div className="px-4 py-2.5 text-[10px] text-slate-600 border-t border-[#1A2332]">
                        Si no aparece en la lista, se creara un autor nuevo con ese nombre.
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                    Género
                  </label>
                  <input
                    value={selectedGenre ? selectedGenre.name : genreSearch}
                    onChange={(e) => {
                      setGenreSearch(e.target.value);
                      setSelectedGenre(null);
                      setGenreId("");
                    }}
                    type="text"
                    placeholder="Escribe el género (si no existe, se crea)"
                    className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40 transition-all"
                  />

                  {!selectedGenre && genreSearch.trim().length > 0 && (
                    <div className="absolute z-30 mt-1 w-full bg-[#111827] border border-[#2E3D52] rounded-xl max-h-48 overflow-y-auto shadow-xl">
                      {genres
                        .filter((g) => g.name.toLowerCase().indexOf(genreSearch.toLowerCase()) !== -1)
                        .slice(0, 10)
                        .map((g) => (
                          <button
                            type="button"
                            key={g.id}
                            onClick={() => {
                              setSelectedGenre(g);
                              setGenreSearch("");
                              setGenreId(g.id);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-[#1A2332] hover:text-white transition-colors"
                          >
                            {g.name}
                          </button>
                        ))}

                      {genres.filter((g) => g.name.toLowerCase().indexOf(genreSearch.toLowerCase()) !== -1)
                        .length === 0 && (
                        <div className="px-4 py-2.5 text-sm text-amber-400">
                          Crear nuevo género: {genreSearch.trim()}
                        </div>
                      )}

                      <div className="px-4 py-2.5 text-[10px] text-slate-600 border-t border-[#1A2332]">
                        Si no aparece en la lista, se creará un género nuevo con ese nombre.
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {error && <p className="text-red-400 text-xs mb-2">{error}</p>}

            <button
              disabled={
                (!selectedBook && !title.trim()) ||
                !formatId ||
                !totalPagesInput ||
                !totalChaptersInput ||
                adding
              }
              onClick={() => void handleSave()}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl transition-all hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/30"
            >
              {adding ? "Guardando..." : "Continuar ->"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [formats, setFormats] = useState<CatalogItem[]>([]);
  const [statusId, setStatusId] = useState<number>(1);
  const [formatId, setFormatId] = useState<number | "">(book.formatId ?? "");
  const [titleInput, setTitleInput] = useState(book.title);
  const [totalPagesInput, setTotalPagesInput] = useState(String(book.totalPages ?? ""));
  const [totalChaptersInput, setTotalChaptersInput] = useState(String(book.totalChapters ?? ""));
  const [isFavorite, setIsFavorite] = useState(!!book.isFavorite);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        const [statusPage, formatPage] = await Promise.all([
          api.readingStatus.getAll({ page: 0, size: 50 }).catch(() => ({ content: FALLBACK_STATUSES })),
          api.formats.getAll({ page: 0, size: 50 }).catch(() => ({ content: [] as CatalogItem[] })),
        ]);

        const statusContent =
          statusPage.content && statusPage.content.length ? statusPage.content : FALLBACK_STATUSES;
        const formatContent = formatPage.content || [];

        const matchedFormat =
          book.formatId ||
          formatContent.find((format) => format.name.toLowerCase() === (book.format || "").toLowerCase())?.id ||
          formatContent[0]?.id;

        setStatuses(statusContent);
        setFormats(formatContent);
        setStatusId(statusIdFromName(statusContent, book.status));
        setFormatId((current) => (current === "" && matchedFormat ? matchedFormat : current));
      } catch {
        setStatuses(FALLBACK_STATUSES);
        setStatusId(statusIdFromName(FALLBACK_STATUSES, book.status));
        setFormats([]);
      }
    };

    void loadCatalogs();
  }, [book.status]);

  const handleSave = async () => {
    if (saving) return;

    setError(null);

    const cleanTitle = titleInput.trim();
    const totalPages = Number(totalPagesInput);
    const totalChapters = Number(totalChaptersInput);

    if (!cleanTitle) {
      setError("El título es obligatorio.");
      return;
    }

    if (!formatId) {
      setError("Selecciona un formato.");
      return;
    }

    if (!Number.isFinite(totalPages) || totalPages <= 0) {
      setError("Ingresa cuántas páginas tiene el libro.");
      return;
    }

    if (!Number.isFinite(totalChapters) || totalChapters <= 0) {
      setError("Ingresa cuántos capítulos tiene el libro.");
      return;
    }

    const normalizedTotalPages = Math.trunc(totalPages);
    const normalizedTotalChapters = Math.trunc(totalChapters);

    setSaving(true);

    try {
      await api.library.updateProgress(book.id, {
        readingStatusId: Number(statusId),
        formatId: Number(formatId),
        totalPage: normalizedTotalPages,
        totalChapter: normalizedTotalChapters,
        currentChapter: Math.min(book.currentChapter || 1, normalizedTotalChapters),
        currentPage: Math.min(book.currentPage || 1, normalizedTotalPages),
        isFavorite,
      } as any);

      if (typeof (api.library as any).customize === "function") {
        await (api.library as any).customize(book.id, {
          customTitle: cleanTitle,
          customChapters: normalizedTotalChapters,
          customPages: normalizedTotalPages,
          customCoverType: book.cover && isImageCover(book.cover) ? "URL" : "COLOR",
          customCoverValue: book.cover || "#334155",
        });
      }

      await Swal.fire({
        icon: "success",
        title: "Libro actualizado",
        text: "Se actualizaron título, páginas, capítulos, formato y estado.",
      });

      onSaved?.();
      onClose();
    } catch (err: any) {
      setError((err && err.message) || "No se pudo editar el libro.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl max-w-md w-full border border-[#2E3D52] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#1A2332]">
          <div>
            <h3 className="font-bold text-white">Editar libro</h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Actualiza título, páginas, capítulos, formato y estado
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#1A2332] flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-3">
            <CoverThumb cover={book.cover} className="w-12 h-16 rounded-lg flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-white font-semibold truncate">{book.title}</div>
              <div className="text-xs text-slate-500 truncate">{book.author}</div>
              <div className="text-[10px] text-slate-600 truncate">
                {[book.genre, book.format].filter(Boolean).join(" - ")}
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
              Título
            </label>
            <input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              type="text"
              className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                Páginas
              </label>
              <input
                value={totalPagesInput}
                onChange={(e) => setTotalPagesInput(e.target.value)}
                type="number"
                min={1}
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                Capítulos
              </label>
              <input
                value={totalChaptersInput}
                onChange={(e) => setTotalChaptersInput(e.target.value)}
                type="number"
                min={1}
                className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
              Formato
            </label>
            <select
              value={formatId}
              onChange={(e) => setFormatId(e.target.value ? Number(e.target.value) : "")}
              className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/40"
            >
              <option value="">Selecciona formato</option>
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">Estado</div>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => setStatusId(s.id)}
                  className={
                    "py-2 text-xs font-medium rounded-xl border transition-all " +
                    (statusId === s.id
                      ? statusClass(s.name) + " border-current"
                      : "border-[#2E3D52] text-slate-500 hover:text-slate-300 bg-[#1A2332]")
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFavorite((v) => !v)}
            className={
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all " +
              (isFavorite
                ? "bg-pink-500/15 text-pink-300 border-pink-500/30"
                : "border-[#2E3D52] text-slate-500 hover:text-slate-300 bg-[#1A2332]")
            }
          >
            <Heart size={14} fill={isFavorite ? "currentColor" : "none"} />
            {isFavorite ? "Marcado como favorito" : "Marcar como favorito"}
          </button>

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

function BookDetailModal({ book, onClose }: { book: Book; onClose: () => void }) {
  const [notes, setNotes] = useState<BookNote[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);

  useEffect(() => {
    let active = true;

    const loadNotes = async () => {
      try {
        setLoadingNotes(true);

        const response = await api.library.getNotes(book.id);
        if (!active) return;

        const normalized = Array.isArray(response)
          ? response.map(normalizeBookNote).filter((note) => note.content.trim())
          : [];

        setNotes(normalized);
      } catch (error) {
        console.warn("No se pudieron cargar notas/acotaciones del libro:", error);
        if (active) setNotes([]);
      } finally {
        if (active) setLoadingNotes(false);
      }
    };

    void loadNotes();

    return () => {
      active = false;
    };
  }, [book.id]);

  const annotations = notes.filter(isAnnotationNote);
  const generalNotes = notes.filter((note) => !isAnnotationNote(note));

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#111827] rounded-2xl max-w-sm w-full overflow-hidden border border-[#2E3D52] max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-44">
          <CoverThumb cover={book.cover} className="w-full h-full absolute inset-0" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
          >
            <X size={13} />
          </button>
          <div className="absolute bottom-3 left-3">
            <span
              className={
                "text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider " +
                statusClass(book.status)
              }
            >
              {book.status}
            </span>
          </div>
        </div>

        <div className="p-5">
          <h2
            className="text-xl font-bold text-white leading-tight"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {book.title}
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">{book.author}</p>

          {(book.genre || book.format) && (
            <span className="mt-2 inline-block text-xs text-amber-400 bg-amber-600/10 border border-amber-600/20 rounded-full px-2.5 py-0.5">
              {[book.genre, book.format].filter(Boolean).join(" - ")}
            </span>
          )}

          <div className="mt-4 bg-[#1A2332] rounded-xl p-3.5 border border-[#2E3D52] space-y-2">
            <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Detalles</div>
            {[
              ["Género", book.genre],
              ["Formato", book.format],
              ["Capítulo actual", book.currentChapter ? String(book.currentChapter) : undefined],
              ["Página actual", book.currentPage ? String(book.currentPage) : undefined],
              ["Capítulos totales", book.totalChapters ? String(book.totalChapters) : undefined],
              ["Páginas totales", book.totalPages ? String(book.totalPages) : undefined],
              ["Estado", book.status],
            ].map(
              (pair) =>
                pair[1] && (
                  <div key={pair[0]} className="flex justify-between text-sm gap-3">
                    <span className="text-slate-500">{pair[0]}</span>
                    <span className="text-white text-right">{pair[1]}</span>
                  </div>
                ),
            )}
          </div>

          <div className="mt-4 bg-[#1A2332] rounded-xl p-3.5 border border-[#2E3D52]">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                  Notas y acotaciones
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Se cargan desde Sesión de lectura
                </p>
              </div>
              <span className="text-[10px] text-amber-400 font-semibold">
                {notes.length}
              </span>
            </div>

            {loadingNotes ? (
              <p className="text-xs text-slate-500">Cargando notas...</p>
            ) : notes.length === 0 ? (
              <p className="text-xs text-slate-500 leading-relaxed">
                Este libro todavía no tiene notas ni acotaciones guardadas.
              </p>
            ) : (
              <div className="space-y-4">
                {annotations.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">
                      Acotaciones
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {annotations.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-xl bg-[#111827] border border-[#2E3D52] px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] text-amber-400 font-semibold">
                              Pág. {note.page} · Cap. {note.chapter}
                            </span>
                            {formatNoteDate(note.createdAt) && (
                              <span className="text-[9px] text-slate-600">
                                {formatNoteDate(note.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generalNotes.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">
                      Notas generales
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {generalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="rounded-xl bg-[#111827] border border-[#2E3D52] px-3 py-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[10px] text-blue-400 font-semibold">
                              Nota general
                            </span>
                            {formatNoteDate(note.createdAt) && (
                              <span className="text-[9px] text-slate-600">
                                {formatNoteDate(note.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{note.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-3 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

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

  const [recommendations, setRecommendations] = useState<BookResponse[]>([]);
  const [recDismissed, setRecDismissed] = useState(false);
  const [addingRec, setAddingRec] = useState(false);
  const [defaultFormatId, setDefaultFormatId] = useState<number | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<number | null>(null);

  const loadLibrary = async () => {
    setLoading(true);
    try {
      const page = await api.library.getAll({ page: 0, size: 100 });
      const content = Array.isArray(page) ? page : page.content || [];
      const mapped = content.map((item: any) => {
        const totalPages = getBookPagesFromResponse(item) ?? getBookPagesFromResponse(item.book);
        const totalChapters = getBookChaptersFromResponse(item) ?? getBookChaptersFromResponse(item.book);

        return {
          id: item.id,
          bookId: item.book?.id,
          title: item.customTitle || item.book?.title || "Sin titulo",
          author:
            (item.book?.authors && item.book.authors.map((a: any) => a.name).join(", ")) ||
            item.book?.origin ||
            "Autor desconocido",
          cover: item.customCoverValue || item.book?.cover || item.book?.coverValue,
          status: item.readingStatusName || item.readingStatus?.name || "Por Leer",
          format: item.formatName || item.format?.name || item.book?.format?.name,
          formatId: item.formatId || item.format?.id || item.book?.format?.id,
          genre: item.book?.genres && item.book.genres[0] ? item.book.genres[0].name : undefined,
          totalPages,
          totalChapters,
          currentChapter: item.currentChapter,
          currentPage: item.currentPage,
          isFavorite: item.isFavorite ?? item.favorite,
        } as Book;
      });
      setBooks(mapped);
    } catch {
      setBooks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recs = await api.preferences.getRecommendations();
      setRecommendations(Array.isArray(recs) ? recs : []);
    } catch {
      setRecommendations([]);
    }
  };
  const loadDefaults = async () => {
    try {
      const [formatPage, statusPage] = await Promise.all([
        api.formats.getAll({ page: 0, size: 1 }),
        api.readingStatus.getAll({ page: 0, size: 50 }),
      ]);
      if (formatPage.content && formatPage.content[0]) setDefaultFormatId(formatPage.content[0].id);
      const statuses = statusPage.content && statusPage.content.length ? statusPage.content : FALLBACK_STATUSES;
      setDefaultStatusId(statusIdFromName(statuses, "Por Leer"));
    } catch {
      setDefaultFormatId(null);
      setDefaultStatusId(null);
    }
  };

  useEffect(() => {
    void loadLibrary();
    void loadRecommendations();
    void loadDefaults();
  }, []);

  const featuredRecommendation = useMemo(() => {
    if (recDismissed || recommendations.length === 0) return null;
    const ownedBookIds: Record<string, boolean> = {};
    books.forEach((b) => {
      if (b.bookId) ownedBookIds[b.bookId] = true;
    });
    for (let i = 0; i < recommendations.length; i++) {
      if (!ownedBookIds[recommendations[i].id]) return recommendations[i];
    }
    return null;
  }, [recommendations, books, recDismissed]);

  const handleAddRecommendation = async () => {
    if (!featuredRecommendation) return;
    if (!defaultFormatId || !defaultStatusId) {
      await Swal.fire({
        icon: "info",
        title: "Configura un formato primero",
        text: "Usa 'Agregar libro' para elegir el formato con el que quieres leer este libro.",
      });
      return;
    }
    let recommendationPages = getBookPagesFromResponse(featuredRecommendation);
    let recommendationChapters = getBookChaptersFromResponse(featuredRecommendation) || 1;

    if (!recommendationPages) {
      const pagesResult = await Swal.fire({
        title: "Páginas del libro",
        text: "Para usarlo en sesión de lectura, indica cuántas páginas tiene.",
        input: "number",
        inputAttributes: { min: "1" },
        inputPlaceholder: "Ej. 320",
        showCancelButton: true,
        confirmButtonText: "Continuar",
        cancelButtonText: "Cancelar",
      });

      if (!pagesResult.isConfirmed) return;
      recommendationPages = Number(pagesResult.value);
    }

    if (!Number.isFinite(recommendationPages) || Number(recommendationPages) <= 0) {
      await Swal.fire({ icon: "warning", title: "Páginas inválidas" });
      return;
    }

    const chaptersResult = await Swal.fire({
      title: "Capítulos del libro",
      input: "number",
      inputValue: String(recommendationChapters),
      inputAttributes: { min: "1" },
      showCancelButton: true,
      confirmButtonText: "Agregar",
      cancelButtonText: "Cancelar",
    });

    if (!chaptersResult.isConfirmed) return;
    recommendationChapters = Number(chaptersResult.value);

    if (!Number.isFinite(recommendationChapters) || Number(recommendationChapters) <= 0) {
      await Swal.fire({ icon: "warning", title: "Capítulos inválidos" });
      return;
    }

    const normalizedPages = Math.trunc(Number(recommendationPages));
    const normalizedChapters = Math.trunc(Number(recommendationChapters));

    setAddingRec(true);
    try {
      const baseLibraryPayload = {
        readingStatusId: defaultStatusId,
        formatId: defaultFormatId,
        currentChapter: 1,
        currentPage: 1,
        isFavorite: false,
      };

      if (featuredRecommendation.id) {
        await api.library.add({
          bookId: featuredRecommendation.id,
          totalPage: normalizedPages,
          totalChapter: normalizedChapters,
          ...baseLibraryPayload,
        } as any);
      } else {
        await api.library.add({
          newBook: {
            title: featuredRecommendation.title,
            authors:
              featuredRecommendation.authors?.length
                ? featuredRecommendation.authors.map((author) =>
                    author.id ? { id: author.id } : { name: author.name },
                  )
                : [],
            genres:
              featuredRecommendation.genres?.length
                ? featuredRecommendation.genres.map((genre) =>
                    genre.id ? { id: genre.id } : { name: genre.name },
                  )
                : [],
            cover: featuredRecommendation.cover,
            totalPage: normalizedPages,
            totalChapter: normalizedChapters,
            defaultPages: normalizedPages,
            defaultChapters: normalizedChapters,
            pages: normalizedPages,
            chapters: normalizedChapters,
          } as any,
          totalPage: normalizedPages,
          totalChapter: normalizedChapters,
          ...baseLibraryPayload,
        } as any);
      }

      await Swal.fire({
        icon: "success",
        title: "Libro agregado",
        text: "Se agrego a tu biblioteca desde tus recomendaciones.",
      });
      const addedId = featuredRecommendation.id;
      setRecommendations((current) =>
        current.filter((r) => (addedId ? r.id !== addedId : r.title !== featuredRecommendation.title)),
      );
      await loadLibrary();
    } catch (err: any) {
      await Swal.fire({
        icon: "error",
        title: "No se pudo agregar",
        text: (err && err.message) || "Intenta de nuevo en unos segundos.",
      });
    } finally {
      setAddingRec(false);
    }
  };

  const filtered = books.filter((b) => {
    const matchFilter = filter === "Todos" || b.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.title.toLowerCase().indexOf(q) !== -1 ||
      b.author.toLowerCase().indexOf(q) !== -1 ||
      (b.genre || "").toLowerCase().indexOf(q) !== -1 ||
      (b.format || "").toLowerCase().indexOf(q) !== -1;
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
          <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "Georgia, serif" }}>
            Mi Biblioteca
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {loading ? "Cargando..." : books.length + " libros en tu coleccion"}
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-amber-900/30 hover:from-amber-400 hover:to-amber-600 transition-all"
        >
          <Plus size={15} /> Agregar libro
        </button>
      </div>

      {featuredRecommendation && (
        <RecommendedBookCard
          book={featuredRecommendation}
          adding={addingRec}
          onAdd={() => void handleAddRecommendation()}
          onDismiss={() => setRecDismissed(true)}
        />
      )}

      <div className="bg-[#111827] border border-[#1A2332] rounded-2xl p-4 mb-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-700/20 flex items-center justify-center flex-shrink-0">
          <span className="text-base">Dato</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-amber-500 font-bold uppercase tracking-widest mb-1">
            Dato curioso
          </div>
          <p className="text-sm text-slate-300 leading-snug">{FACTS[factIdx].text}</p>
          <p className="text-xs text-slate-600 mt-1">{"- " + FACTS[factIdx].source}</p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setFactIdx((i) => (i - 1 + FACTS.length) % FACTS.length)}
            className="w-6 h-6 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={11} />
          </button>
          <button
            onClick={() => setFactIdx((i) => (i + 1) % FACTS.length)}
            className="w-6 h-6 rounded-full bg-[#1A2332] border border-[#2E3D52] text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <ChevronRight size={11} />
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Buscar por titulo, autor, genero o formato..."
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
              className={
                "whitespace-nowrap px-3 py-2 rounded-xl text-sm font-medium transition-all " +
                (filter === f
                  ? "bg-amber-700/25 text-amber-400 border border-amber-700/30"
                  : "text-slate-400 hover:text-white bg-[#111827] border border-[#1A2332]")
              }
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
            No hay libros que coincidan con tu busqueda.
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
      {editBook && (
        <EditBookModal
          book={editBook}
          onClose={() => setEditBook(null)}
          onSaved={() => void loadLibrary()}
        />
      )}

      {deleteBook && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4"
          onClick={() => setDeleteBook(null)}
        >
          <div
            className="bg-[#111827] rounded-2xl max-w-xs w-full p-6 border border-[#2E3D52] text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={20} className="text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Eliminar libro?</h3>
            <p className="text-slate-400 text-sm mb-1">{deleteBook.title}</p>
            <p className="text-slate-600 text-xs mb-6">Esta accion no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteBook(null)}
                className="flex-1 py-2.5 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  try {
                    await api.library.remove(deleteBook.id);
                    setBooks((current) => current.filter((b) => b.id !== deleteBook.id));
                    setDeleteBook(null);
                    await Swal.fire({
                      icon: "success",
                      title: "Eliminado",
                      text: "El libro se elimino de tu biblioteca.",
                    });
                  } catch (err: any) {
                    await Swal.fire({
                      icon: "error",
                      title: "Error",
                      text: (err && err.message) || "No se pudo eliminar el libro.",
                    });
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
