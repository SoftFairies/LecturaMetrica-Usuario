"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Square,
  Minus,
  Plus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "@/data/api";
import Swal from "sweetalert2";

const SELECTED_READING_BOOK_KEY = "lecturametrica_selected_reading_book";

type LibraryItem = {
  id: string;
  readingStatusName?: string;
  formatName?: string;
  currentPage?: number;
  currentChapter?: number;
  totalPage?: number;
  totalChapter?: number;
  totalPages?: number;
  totalChapters?: number;
  isFavorite?: boolean;
  book?: {
    id?: string;
    title?: string;
    cover?: string;
    coverValue?: string;
    defaultPages?: number;
    defaultChapters?: number;
    totalPage?: number;
    totalChapter?: number;
    totalPages?: number;
    totalChapters?: number;
    authors?: Array<{ name?: string }>;
    origin?: string;
  };
};

type ReadingNote = {
  id: string;
  page?: number;
  chapter?: number;
  text: string;
  createdAt: string;
};

type Annotation = ReadingNote;

function clampValue(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function todayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}


function readPositiveInt(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);

    if (Number.isFinite(numberValue) && numberValue > 0) {
      return Math.trunc(numberValue);
    }
  }

  return null;
}

function getTotalPagesFromLibraryItem(item: LibraryItem) {
  return readPositiveInt(
    item.totalPage,
    item.totalPages,
    item.book?.totalPage,
    item.book?.totalPages,
    item.book?.defaultPages,
  );
}

function getTotalChaptersFromLibraryItem(item: LibraryItem) {
  return readPositiveInt(
    item.totalChapter,
    item.totalChapters,
    item.book?.totalChapter,
    item.book?.totalChapters,
    item.book?.defaultChapters,
  );
}


async function createReadingSessionByLibraryId(
  libraryId: string,
  payload: {
    secondsRead: number;
    pagesRead: number;
    chaptersRead: number;
  },
) {
  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("token") ||
        window.localStorage.getItem("authToken") ||
        window.localStorage.getItem("accessToken") ||
        window.localStorage.getItem("lecturametrica_token")
      : null;

  const response = await fetch(`/api/v1/reading-sessions/${libraryId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "No se pudo guardar la sesión.";

    try {
      const errorBody = await response.json();
      message = errorBody?.message || message;
    } catch {
    }

    throw new Error(message);
  }

  if (response.status === 204) return null;

  return response.json();
}



async function updateLibraryProgressById(
  libraryId: string,
  payload: {
    currentPage: number;
    currentChapter: number;
  },
) {
  try {
    return await api.library.updateProgress(libraryId, payload);
  } catch (apiError) {
    console.warn("api.library.updateProgress falló, intentando PATCH directo:", apiError);
  }

  const token =
    typeof window !== "undefined"
      ? window.localStorage.getItem("token") ||
        window.localStorage.getItem("authToken") ||
        window.localStorage.getItem("accessToken") ||
        window.localStorage.getItem("lecturametrica_token")
      : null;

  const response = await fetch(`/api/v1/library/${libraryId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let message = "La sesión se guardó, pero no se pudo actualizar el progreso del libro.";

    try {
      const errorBody = await response.json();
      message = errorBody?.message || message;
    } catch {
    }

    throw new Error(message);
  }

  return null;
}


function isAnnotation(note: Annotation) {
  return Boolean(note.page && note.chapter);
}

async function loadNotesFromApi(libraryId: string) {
  try {
    const notes = await api.library.getNotes(libraryId);

    return (notes || []).map((note: any) => {
      const page = Number(note.page);
      const chapter = Number(note.chapter);

      return {
        id: String(note.id ?? crypto.randomUUID?.() ?? Date.now()),
        page: Number.isFinite(page) && page > 0 ? page : undefined,
        chapter: Number.isFinite(chapter) && chapter > 0 ? chapter : undefined,
        text: String(note.content ?? ""),
        createdAt: String(note.createdAt ?? note.updatedAt ?? new Date().toISOString()),
      };
    }) as Annotation[];
  } catch (error) {
    console.warn("No se pudieron cargar las notas desde la API:", error);
    return [];
  }
}

export default function LecturaPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentChapter, setCurrentChapter] = useState(1);

  const [pagesRead, setPagesRead] = useState(0);
  const [chaptersRead, setChaptersRead] = useState(0);

  const [running, setRunning] = useState(false);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState(30);
  const [showManual, setShowManual] = useState(false);

  const [personalNotes, setPersonalNotes] = useState("");
  const [annotationPage, setAnnotationPage] = useState(1);
  const [annotationChapter, setAnnotationChapter] = useState(1);
  const [annotationText, setAnnotationText] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [bookTitle, setBookTitle] = useState<string | null>(null);
  const [bookAuthor, setBookAuthor] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [totalChapters, setTotalChapters] = useState(0);
  const [bookStatus, setBookStatus] = useState<string | null>(null);
  const [coverValue, setCoverValue] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [selectedLibraryId, setSelectedLibraryId] = useState<string>("");

  const [loadingBook, setLoadingBook] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const maxPages = totalPages > 0 ? totalPages : Math.max(currentPage, 1);
  const maxChapters = totalChapters > 0 ? totalChapters : Math.max(currentChapter, 1);

  const safeCurrentPage = clampValue(currentPage, 1, maxPages);
  const safeCurrentChapter = clampValue(currentChapter, 1, maxChapters);

  const safePagesRead = clampValue(pagesRead, 0, Math.max(0, maxPages - safeCurrentPage));
  const safeChaptersRead = clampValue(chaptersRead, 0, Math.max(0, maxChapters - safeCurrentChapter));

  const finalPage = clampValue(safeCurrentPage + safePagesRead, 1, maxPages);
  const finalChapter = clampValue(safeCurrentChapter + safeChaptersRead, 1, maxChapters);

  const safeAnnotationPage = clampValue(annotationPage, 1, maxPages);
  const safeAnnotationChapter = clampValue(annotationChapter, 1, maxChapters);

  const progress = totalPages > 0 ? Math.min(100, Math.round((finalPage / totalPages) * 100)) : 0;

  const coverBackground = coverValue?.startsWith("#")
    ? `linear-gradient(160deg, ${coverValue}, #7c2d12)`
    : "linear-gradient(160deg,#c2410c,#7c2d12)";
  const coverImage = coverValue && /^https?:\/\//i.test(coverValue) ? coverValue : null;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSessionSeconds((seconds) => seconds + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running]);

  const applyLibraryItem = async (item: LibraryItem) => {
    const pages = getTotalPagesFromLibraryItem(item);
    const chapters = getTotalChaptersFromLibraryItem(item);

    const currentApiPage = readPositiveInt(item.currentPage) ?? 1;
    const currentApiChapter = readPositiveInt(item.currentChapter) ?? 1;

    const maxBookPages = pages ?? Math.max(currentApiPage, 1);
    const maxBookChapters = chapters ?? Math.max(currentApiChapter, 1);

    const loadedPage = clampValue(currentApiPage, 1, maxBookPages);
    const loadedChapter = clampValue(currentApiChapter, 1, maxBookChapters);

    const apiNotes = await loadNotesFromApi(item.id);

    setEnrollmentId(item.id);
    setSelectedLibraryId(item.id);
    setBookTitle(item.book?.title ?? "Libro sin título");
    setBookAuthor(
      item.book?.authors
        ?.map((author) => author.name)
        .filter(Boolean)
        .join(", ") ||
        item.book?.origin ||
        "Autor desconocido",
    );
    setBookStatus(item.readingStatusName ?? "Leyendo");
    setCoverValue(item.book?.cover ?? item.book?.coverValue ?? null);

    setCurrentPage(loadedPage);
    setCurrentChapter(loadedChapter);
    setPagesRead(0);
    setChaptersRead(0);
    setRunning(false);
    setSessionSeconds(0);

    setAnnotationPage(loadedPage);
    setAnnotationChapter(loadedChapter);
    setTotalPages(maxBookPages);
    setTotalChapters(maxBookChapters);

    setPersonalNotes("");
    setAnnotationText("");
    setAnnotations(apiNotes);
  };

  const clearReadingSelection = () => {
    setEnrollmentId(null);
    setSelectedLibraryId("");
    setBookTitle(null);
    setBookAuthor(null);
    setBookStatus(null);
    setCoverValue(null);

    setCurrentPage(1);
    setCurrentChapter(1);
    setPagesRead(0);
    setChaptersRead(0);
    setRunning(false);
    setSessionSeconds(0);

    setAnnotationPage(1);
    setAnnotationChapter(1);
    setTotalPages(0);
    setTotalChapters(0);

    setPersonalNotes("");
    setAnnotationText("");
    setAnnotations([]);
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoadingBook(true);

        const libraryPage = await api.library.getAll({ page: 0, size: 100 });
        if (!active) return;

        try {
          const streak = await api.streaks.getMine();
          if (active) {
            setCurrentStreak(Number(streak.currentStreak ?? 0));
            setMaxStreak(Number(streak.maxStreak ?? 0));
          }
        } catch {
          if (active) {
            setCurrentStreak(0);
            setMaxStreak(0);
          }
        }

        const safeLibs: LibraryItem[] = Array.isArray(libraryPage)
          ? libraryPage
          : libraryPage.content || [];

        setLibraryItems(safeLibs);

        if (safeLibs.length === 0) {
          clearReadingSelection();
          return;
        }

        const storedSelectedId =
          typeof window !== "undefined"
            ? window.localStorage.getItem(SELECTED_READING_BOOK_KEY)
            : null;

        const selectedBook =
          safeLibs.find((item) => item.id === storedSelectedId) ||
          safeLibs.find((item) => item.readingStatusName?.toLowerCase() === "leyendo") ||
          safeLibs[0];

        await applyLibraryItem(selectedBook);
      } catch (error) {
        console.error("Error cargando libro de lectura:", error);

        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cargar tu biblioteca para iniciar la sesión.",
        });
      } finally {
        if (active) setLoadingBook(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const handleSelectLibraryBook = (id: string) => {
    const selected = libraryItems.find((item) => item.id === id);
    if (!selected) return;

    void applyLibraryItem(selected);

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(SELECTED_READING_BOOK_KEY, id);
      }
    } catch {
    }
  };

  const handlePagesReadInput = (value: string) => {
    if (value.trim() === "") {
      setPagesRead(0);
      return;
    }

    setPagesRead(clampValue(Number(value), 0, Math.max(0, maxPages - safeCurrentPage)));
  };

  const handleChaptersReadInput = (value: string) => {
    if (value.trim() === "") {
      setChaptersRead(0);
      return;
    }

    setChaptersRead(clampValue(Number(value), 0, Math.max(0, maxChapters - safeCurrentChapter)));
  };

  const addAnnotation = async () => {
    if (!enrollmentId) {
      await Swal.fire({
        icon: "info",
        title: "Sin libro seleccionado",
        text: "Selecciona un libro antes de guardar una acotación.",
      });
      return;
    }

    if (!annotationText.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Acotación vacía",
        text: "Escribe una acotación antes de guardarla.",
      });
      return;
    }

    try {
      const savedNote = await api.library.addNote(enrollmentId, {
        content: annotationText.trim(),
        page: safeAnnotationPage,
        chapter: safeAnnotationChapter,
      });

      const newAnnotation: Annotation = {
        id: String((savedNote as any)?.id ?? crypto.randomUUID?.() ?? Date.now()),
        page: Number((savedNote as any)?.page ?? safeAnnotationPage),
        chapter: Number((savedNote as any)?.chapter ?? safeAnnotationChapter),
        text: String((savedNote as any)?.content ?? annotationText.trim()),
        createdAt: String((savedNote as any)?.createdAt ?? new Date().toISOString()),
      };

      setAnnotations((current) => [newAnnotation, ...current]);
      setAnnotationText("");

      await Swal.fire({
        icon: "success",
        title: "Acotación guardada",
        text: "La acotación se guardó en la API.",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error: any) {
      console.error("Error guardando nota:", error);

      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: error?.message || "La API no guardó la información. Intenta nuevamente.",
      });
    }
  };

  const saveSession = async (manualSeconds = 0) => {
    if (saving) return;

    if (!enrollmentId) {
      await Swal.fire({
        icon: "info",
        title: "Sin libro seleccionado",
        text: "No se encontró una entrada de biblioteca para actualizar.",
      });
      return;
    }

    const secondsRead = sessionSeconds + manualSeconds;

    if (safePagesRead === 0 && safeChaptersRead === 0 && secondsRead === 0 && !personalNotes.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "Sesión vacía",
        text: "Agrega páginas leídas, capítulos leídos, tiempo o una nota antes de guardar.",
      });
      return;
    }

    setSaving(true);

    try {
      const readingSessionPayload = {
        secondsRead: Math.max(1, Math.trunc(secondsRead)),
        pagesRead: Math.trunc(safePagesRead),
        chaptersRead: Math.trunc(safeChaptersRead),
      };

      console.log(`POST /api/v1/reading-sessions/${enrollmentId}:`, readingSessionPayload);
      await createReadingSessionByLibraryId(enrollmentId, readingSessionPayload);

      const progressPayload = {
        currentPage: finalPage,
        currentChapter: finalChapter,
      };

      console.log("PATCH /api/v1/library/" + enrollmentId + ":", progressPayload);
      await updateLibraryProgressById(enrollmentId, progressPayload);

      let savedPersonalNote: Annotation | null = null;

      if (personalNotes.trim()) {
        const savedNote = await api.library.addNote(enrollmentId, {
          content: personalNotes.trim(),
        });

        savedPersonalNote = {
          id: String((savedNote as any)?.id ?? crypto.randomUUID?.() ?? Date.now()),
          page: undefined,
          chapter: undefined,
          text: String((savedNote as any)?.content ?? personalNotes.trim()),
          createdAt: String((savedNote as any)?.createdAt ?? new Date().toISOString()),
        };
      }

      setLibraryItems((items) =>
        items.map((item) =>
          item.id === enrollmentId
            ? {
                ...item,
                currentPage: finalPage,
                currentChapter: finalChapter,
                totalPage: maxPages,
                totalChapter: maxChapters,
              }
            : item,
        ),
      );

      setCurrentPage(finalPage);
      setCurrentChapter(finalChapter);
      setPagesRead(0);
      setChaptersRead(0);
      setRunning(false);
      setSessionSeconds(0);
      setAnnotationPage(finalPage);
      setAnnotationChapter(finalChapter);

      try {
        const refreshedLibraryPage = await api.library.getAll({ page: 0, size: 100 });
        const refreshedLibs: LibraryItem[] = Array.isArray(refreshedLibraryPage)
          ? refreshedLibraryPage
          : refreshedLibraryPage.content || [];

        setLibraryItems(refreshedLibs);

        const refreshedSelected = refreshedLibs.find((item) => item.id === enrollmentId);
        if (refreshedSelected) {
          setCurrentPage(readPositiveInt(refreshedSelected.currentPage) ?? finalPage);
          setCurrentChapter(readPositiveInt(refreshedSelected.currentChapter) ?? finalChapter);
        }
      } catch (refreshError) {
        console.warn("No se pudo refrescar biblioteca después de guardar progreso:", refreshError);
      }

      if (savedPersonalNote) {
        setAnnotations((current) => [savedPersonalNote, ...current]);
      }

      setPersonalNotes("");

      try {
        const streak = await api.streaks.getMine();
        setCurrentStreak(Number(streak.currentStreak ?? 0));
        setMaxStreak(Number(streak.maxStreak ?? 0));
      } catch {
      }

      await Swal.fire({
        icon: "success",
        title: "Sesión guardada",
        text: "Se guardó la sesión y se actualizó el avance del libro.",
      });
    } catch (err: any) {
      console.error("Error guardando sesión:", err);

      await Swal.fire({
        icon: "error",
        title: "No se pudo guardar",
        text: err?.message || "No se pudo guardar la sesión o actualizar el progreso del libro.",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveManualSession = async () => {
    await saveSession(Math.max(1, manualMinutes) * 60);
    setShowManual(false);
  };

  return (
    <div className="p-5 lg:p-7 pb-24 md:pb-8">
      <div className="mb-6">
        <h1
          className="text-2xl font-bold text-white"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Sesión de lectura
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Registra tiempo, progreso, acotaciones y notas
        </p>

        <div className="mt-4 max-w-xl">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">
            Selecciona el libro que vas a leer
          </label>
          <select
            value={selectedLibraryId}
            onChange={(event) => handleSelectLibraryBook(event.target.value)}
            disabled={loadingBook || libraryItems.length === 0 || saving}
            className="w-full bg-[#111827] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 disabled:opacity-40"
          >
            {libraryItems.length === 0 ? (
              <option value="">No tienes libros en biblioteca</option>
            ) : (
              libraryItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.book?.title ?? "Libro sin título"} {item.readingStatusName ? `— ${item.readingStatusName}` : ""}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-[#111827] rounded-2xl border border-[#1A2332] overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-[#1A2332]">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              Leyendo ahora
            </span>
          </div>

          <div className="p-5">
            <div className="flex gap-4 mb-6 pb-5 border-b border-[#1A2332]">
              <div
                className="w-16 rounded-xl flex-shrink-0 shadow-lg bg-cover bg-center"
                style={{
                  background: coverImage ? `url(${coverImage}) center / cover` : coverBackground,
                  height: "88px",
                }}
              />

              <div className="min-w-0 flex-1">
                <h2
                  className="text-base font-bold text-white leading-snug"
                  style={{ fontFamily: "Georgia, serif" }}
                >
                  {loadingBook ? "Cargando libro..." : bookTitle ?? "Libro no encontrado"}
                </h2>

                <p className="text-slate-400 text-sm mt-0.5">
                  {bookAuthor ?? "Autor desconocido"}
                </p>

                {bookStatus && (
                  <span className="inline-flex mt-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-400 font-semibold">
                    {bookStatus}
                  </span>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">Progreso al guardar</span>
                    <span className="font-bold text-amber-400">{progress}%</span>
                  </div>

                  <div className="w-full h-1.5 bg-[#2E3D52] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <p className="text-[10px] text-slate-600 mt-1">
                    Página {safeCurrentPage} → {finalPage} / {totalPages || "?"}
                  </p>
                  <p className="text-[10px] text-slate-600">
                    Capítulo {safeCurrentChapter} → {finalChapter} / {totalChapters || "?"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                Páginas leídas
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setPagesRead((value) => Math.max(0, value - 1))}
                  disabled={!enrollmentId || saving}
                  className="w-10 h-10 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>

                <div className="flex-1 bg-[#1A2332] border border-[#2E3D52] rounded-xl py-2.5 text-center">
                  <input
                    type="number"
                    value={safePagesRead}
                    onChange={(event) => handlePagesReadInput(event.target.value)}
                    className="bg-transparent text-xl font-bold text-amber-400 text-center w-full focus:outline-none"
                    min={0}
                    max={Math.max(0, maxPages - safeCurrentPage)}
                    disabled={!enrollmentId || saving}
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setPagesRead((value) => Math.min(Math.max(0, maxPages - safeCurrentPage), value + 1))
                  }
                  disabled={!enrollmentId || saving}
                  className="w-10 h-10 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>

                <div className="text-slate-500 text-sm pl-1">
                  de {maxPages} totales
                </div>
              </div>
            </div>

            <div className="mb-5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">
                Capítulos leídos
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setChaptersRead((value) => Math.max(0, value - 1))}
                  disabled={!enrollmentId || saving}
                  className="w-10 h-10 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Minus size={14} />
                </button>

                <div className="flex-1 bg-[#1A2332] border border-[#2E3D52] rounded-xl py-2.5 text-center">
                  <input
                    type="number"
                    value={safeChaptersRead}
                    onChange={(event) => handleChaptersReadInput(event.target.value)}
                    className="bg-transparent text-xl font-bold text-amber-400 text-center w-full focus:outline-none"
                    min={0}
                    max={Math.max(0, maxChapters - safeCurrentChapter)}
                    disabled={!enrollmentId || saving}
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setChaptersRead((value) =>
                      Math.min(Math.max(0, maxChapters - safeCurrentChapter), value + 1),
                    )
                  }
                  disabled={!enrollmentId || saving}
                  className="w-10 h-10 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus size={14} />
                </button>

                <div className="text-slate-500 text-sm pl-1">
                  de {maxChapters} totales
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Acotaciones y notas
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                      Página
                    </label>
                    <input
                      type="number"
                      value={safeAnnotationPage}
                      min={1}
                      max={maxPages}
                      onChange={(event) =>
                        setAnnotationPage(clampValue(Number(event.target.value), 1, maxPages))
                      }
                      className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1.5">
                      Capítulo
                    </label>
                    <input
                      type="number"
                      value={safeAnnotationChapter}
                      min={1}
                      max={maxChapters}
                      onChange={(event) =>
                        setAnnotationChapter(clampValue(Number(event.target.value), 1, maxChapters))
                      }
                      className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                <textarea
                  value={annotationText}
                  onChange={(event) => setAnnotationText(event.target.value)}
                  placeholder="Escribe una acotación ligada a esta página y capítulo…"
                  rows={3}
                  className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
                />

                <button
                  type="button"
                  onClick={() => void addAnnotation()}
                  disabled={!enrollmentId || saving}
                  className="mt-2 w-full py-2.5 border border-amber-700/40 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-700/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Guardar acotación
                </button>

                {annotations.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
                    {annotations.map((annotation) => (
                      <div
                        key={annotation.id}
                        className="bg-[#1A2332] border border-[#2E3D52] rounded-xl px-3 py-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] text-amber-400 font-semibold">
                            {isAnnotation(annotation)
                              ? `Acotación · Pág. ${annotation.page} · Cap. ${annotation.chapter}`
                              : "Nota general"}
                          </span>
                          <span className="text-[9px] text-slate-600">
                            {new Date(annotation.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{annotation.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                  Nota general
                </div>

                <textarea
                  value={personalNotes}
                  onChange={(event) => setPersonalNotes(event.target.value)}
                  placeholder="Escribe una nota general de esta sesión…"
                  rows={4}
                  className="w-full bg-[#1A2332] border border-[#2E3D52] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-none transition-all"
                />

                <p className="text-[10px] text-slate-600 mt-1.5">
                  Esta nota se guarda sin página ni capítulo, como nota general.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111827] rounded-2xl border border-[#1A2332] overflow-hidden">
          <div className="px-5 pt-4 pb-2 border-b border-[#1A2332]">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
              Cronómetro
            </span>
          </div>

          <div className="p-5">
            <div className="bg-[#1A2332] border border-[#2E3D52] rounded-2xl p-6 mb-5 text-center">
              <div className="text-5xl font-bold text-white font-mono tabular-nums">
                {formatTime(sessionSeconds)}
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Tiempo de lectura registrado en esta sesión
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  type="button"
                  onClick={() => setRunning((current) => !current)}
                  disabled={!enrollmentId || saving}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {running ? <Pause size={15} /> : <Play size={15} />}
                  {running ? "Pausar" : "Iniciar"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRunning(false);
                    setSessionSeconds(0);
                  }}
                  disabled={saving}
                  className="w-12 h-12 bg-[#111827] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white hover:border-[#3A4D66] flex items-center justify-center transition-all disabled:opacity-40"
                >
                  <Square size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#1A2332] border border-[#2E3D52] rounded-2xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Páginas
                </div>
                <div className="text-3xl font-bold text-amber-400">+{safePagesRead}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Quedarás en pág. {finalPage}
                </div>
              </div>

              <div className="bg-[#1A2332] border border-[#2E3D52] rounded-2xl p-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                  Capítulos
                </div>
                <div className="text-3xl font-bold text-amber-400">+{safeChaptersRead}</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Quedarás en cap. {finalChapter}
                </div>
              </div>
            </div>

            <div className="bg-[#1A2332] border border-[#2E3D52] rounded-2xl p-4 mb-5">
              <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
                Racha actual
              </div>

              <div
                className={`text-2xl font-bold ${
                  currentStreak >= 3 ? "text-amber-400" : "text-slate-400"
                }`}
              >
                {currentStreak >= 3 ? `🔥 ${currentStreak}` : currentStreak} día
                {currentStreak === 1 ? "" : "s"}
              </div>

              <div className="text-[10px] text-slate-500 mt-1">
                Récord: {maxStreak}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void saveSession()}
              disabled={saving || !enrollmentId}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Guardando..." : "Guardar sesión"}
            </button>

            <div className="mt-4 bg-[#1A2332] border border-[#2E3D52] rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setShowManual((current) => !current)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-400 hover:text-white transition-colors"
              >
                <span>¿No usaste el cronómetro?</span>
                {showManual ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showManual && (
                <div className="px-4 pb-4 border-t border-[#2E3D52]">
                  <p className="text-xs text-slate-500 py-3">
                    Registra el tiempo leído manualmente.
                  </p>

                  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-2">
                    Minutos leídos
                  </div>

                  <div className="flex items-center gap-2.5 mb-3">
                    <button
                      type="button"
                      onClick={() => setManualMinutes((minutes) => Math.max(1, minutes - 5))}
                      disabled={saving}
                      className="w-9 h-9 bg-[#111827] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white flex items-center justify-center disabled:opacity-40"
                    >
                      <Minus size={12} />
                    </button>

                    <input
                      type="number"
                      value={manualMinutes}
                      onChange={(event) =>
                        setManualMinutes(Math.max(1, Math.trunc(Number(event.target.value) || 1)))
                      }
                      min={1}
                      className="flex-1 bg-[#111827] border border-[#2E3D52] rounded-xl px-4 py-2.5 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-amber-500/30"
                    />

                    <button
                      type="button"
                      onClick={() => setManualMinutes((minutes) => minutes + 5)}
                      disabled={saving}
                      className="w-9 h-9 bg-[#111827] border border-[#2E3D52] rounded-xl text-slate-400 hover:text-white flex items-center justify-center disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void saveManualSession()}
                    disabled={saving || !enrollmentId}
                    className="w-full py-2.5 border border-amber-700/40 text-amber-400 text-sm font-semibold rounded-xl hover:bg-amber-700/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Guardar sesión manual
                  </button>
                </div>
              )}
            </div>
</div>
        </div>
      </div>
    </div>
  );
}
