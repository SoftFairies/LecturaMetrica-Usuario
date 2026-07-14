"use client";

import { useEffect, useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  Send,
  BookPlus,
  Inbox,
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { api } from "@/data/api";
import Swal from "sweetalert2";

const LAST_SENT_KEY_PREFIX = "lecturametrica_last_mailbox_sent";

interface BookLite {
  id: string; 
  libraryId: string; 
  title: string;
  authorNames: string;
}

const getLetterBookObject = (letter: any) => {
  return (
    letter?.book ||
    letter?.recommendedBook ||
    letter?.library?.book ||
    letter?.libraryEntry?.book ||
    letter?.libraryBook?.book ||
    null
  );
};

const getLetterBookId = (letter: any): string => {
  const book = getLetterBookObject(letter);

  return String(
    letter?.bookId ||
      letter?.recommendedBookId ||
      letter?.book_id ||
      book?.id ||
      book?.bookId ||
      "",
  );
};

const getLetterBookTitle = (letter: any): string => {
  const book = getLetterBookObject(letter);

  return (
    book?.title ||
    letter?.bookTitle ||
    letter?.title ||
    letter?.recommendedBookTitle ||
    "Libro recomendado"
  );
};

const getLetterBookAuthors = (letter: any): string => {
  const book = getLetterBookObject(letter);

  if (Array.isArray(book?.authors) && book.authors.length > 0) {
    return book.authors.map((author: any) => author?.name).filter(Boolean).join(", ");
  }

  return (
    letter?.authorNames ||
    letter?.author ||
    letter?.bookAuthor ||
    "Autor desconocido"
  );
};

const getPositiveNumber = (...values: any[]) => {
  for (const value of values) {
    const parsed = Number(value);

    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.trunc(parsed);
    }
  }

  return null;
};

export default function BuzonPage() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [opened, setOpened] = useState(true);
  const [liked, setLiked] = useState<boolean | null>(null);

  const [message, setMessage] = useState("");
  const [bookId, setBookId] = useState("");

  const [userId, setUserId] = useState<string | null>(null);
  const [books, setBooks] = useState<BookLite[]>([]);
  const [receivedLetters, setReceivedLetters] = useState<any[]>([]);
  const [defaultFormatId, setDefaultFormatId] = useState<number | null>(null);
  const [defaultStatusId, setDefaultStatusId] = useState<number | null>(null);

  const [loadingLetters, setLoadingLetters] = useState(true);
  const [loading, setLoading] = useState(false);
  const [addingFeatured, setAddingFeatured] = useState(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  const cooldownKey = userId ? `${LAST_SENT_KEY_PREFIX}:${userId}` : null;

  const pageClass = isDark
    ? "min-h-screen bg-[#050816] text-white px-4 py-6 sm:px-6 md:px-8"
    : "min-h-screen bg-slate-50 text-slate-900 px-4 py-6 sm:px-6 md:px-8";

  const cardClass = isDark
    ? "bg-[#111827] border border-[#1E2A3A] rounded-[2rem] shadow-xl shadow-black/40"
    : "bg-white border border-slate-200 rounded-[2rem] shadow-xl shadow-slate-200/60";

  const softCardClass = isDark
    ? "bg-[#111827] border border-[#1E2A3A] rounded-[2rem]"
    : "bg-white border border-slate-200 rounded-[2rem] shadow-sm";

  const mutedText = isDark ? "text-slate-500" : "text-slate-500";
  const normalText = isDark ? "text-slate-300" : "text-slate-700";
  const strongText = isDark ? "text-white" : "text-slate-900";

  const fieldClass = isDark
    ? "w-full bg-[#111827] border border-[#1E2A3A] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 disabled:opacity-40"
    : "w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 disabled:opacity-40";

  const textareaClass = isDark
    ? "w-full bg-[#111827] border border-[#1E2A3A] rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 resize-none mb-3 transition-all disabled:opacity-40"
    : "w-full bg-white border border-slate-300 rounded-2xl px-5 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 resize-none mb-3 transition-all disabled:opacity-40";

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      let currentUserId: string | null = null;

      try {
        const me = await api.users.getMe();
        if (!active) return;

        currentUserId = me.id;
        setUserId(me.id);
      } catch (error) {
        console.error("Error cargando usuario:", error);
      }

      if (currentUserId) {
        const key = `${LAST_SENT_KEY_PREFIX}:${currentUserId}`;

        const lastSent = localStorage.getItem(key);
        if (lastSent) {
          const hours = (Date.now() - Number(lastSent)) / (1000 * 60 * 60);
          if (hours < 24) {
            setHoursLeft(Math.ceil(24 - hours));
          }
        }

      }

      try {
        const libraryResponse = await api.library.getAll({ page: 0, size: 100 });
        if (!active) return;

        const libraryBooks: BookLite[] = (libraryResponse.content || [])
          .filter((entry: any) => entry?.book?.id)
          .map((entry: any) => ({
            id: entry.book.id,
            libraryId: entry.id,
            title: entry.book?.title || "Libro sin título",
            authorNames:
              entry.book?.authors?.map((a: any) => a.name).filter(Boolean).join(", ") ||
              "Autor desconocido",
          }));

        setBooks(libraryBooks);
      } catch (error) {
        console.error("Error cargando biblioteca:", error);
        setBooks([]);
      }

      try {
        const [formatsPage, statusPage] = await Promise.all([
          api.formats.getAll({ page: 0, size: 1 }).catch(() => ({ content: [] })),
          api.readingStatus.getAll({ page: 0, size: 50 }).catch(() => ({ content: [] })),
        ]);

        if (!active) return;

        const firstFormat = formatsPage.content?.[0]?.id;
        const porLeer =
          statusPage.content?.find((s: any) =>
            String(s.name || "").toLowerCase().includes("por leer"),
          )?.id || 5;

        setDefaultFormatId(firstFormat || null);
        setDefaultStatusId(porLeer);
      } catch {
        if (active) {
          setDefaultFormatId(null);
          setDefaultStatusId(5);
        }
      }

      try {
        const received = await api.mailbox.getReceived();
        if (!active) return;

        const receivedList = Array.isArray(received)
          ? received
          : Array.isArray((received as any)?.content)
            ? (received as any).content
            : Array.isArray((received as any)?.letters)
              ? (received as any).letters
              : Array.isArray((received as any)?.data)
                ? (received as any).data
                : [];

        const sorted = [...receivedList].sort((a, b) => {
          const da = a?.sentAt ? new Date(a.sentAt).getTime() : 0;
          const db = b?.sentAt ? new Date(b.sentAt).getTime() : 0;
          return db - da;
        });

        setReceivedLetters(sorted);
      } catch (error) {
        console.error("Error cargando buzón:", error);
        setReceivedLetters([]);
      } finally {
        if (active) setLoadingLetters(false);
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const findBook = (id: string | undefined): BookLite | null => {
    if (!id) return null;
    return books.find((b) => b.id === id) || null;
  };

  const featuredLetter = receivedLetters[0] ?? null;

  if (featuredLetter) {
    console.log("Carta recibida completa:", featuredLetter);
  }

  const featuredBookId = featuredLetter ? getLetterBookId(featuredLetter) : "";
  const featuredBook = featuredLetter ? findBook(featuredBookId) : null;
  const featuredTitle = featuredBook?.title ?? (featuredLetter ? getLetterBookTitle(featuredLetter) : "Libro recomendado");
  const featuredAuthors =
    featuredBook?.authorNames ??
    (featuredLetter ? getLetterBookAuthors(featuredLetter) : "Autor desconocido");

  const handleSendLetter = async () => {
    const trimmed = message.trim();

    if (!bookId) {
      await Swal.fire({
        icon: "warning",
        title: "Falta seleccionar libro",
        text: "Selecciona un libro para poder enviar la carta.",
      });
      return;
    }

    if (trimmed.length < 10) {
      await Swal.fire({
        icon: "warning",
        title: "Mensaje muy corto",
        text: "La carta debe tener mínimo 10 caracteres.",
      });
      return;
    }

    if (cooldownKey) {
      const lastSent = localStorage.getItem(cooldownKey);
      if (lastSent) {
        const hours = (Date.now() - Number(lastSent)) / (1000 * 60 * 60);

        if (hours < 24) {
          const left = Math.ceil(24 - hours);
          setHoursLeft(left);

          await Swal.fire({
            icon: "warning",
            title: "Espera un poco",
            text: `Solo puedes enviar una carta cada 24 horas. Faltan ${left} horas.`,
          });

          return;
        }
      }
    }

    setLoading(true);

    try {
      await api.mailbox.send({ bookId, content: trimmed });

      if (cooldownKey) {
        localStorage.setItem(cooldownKey, String(Date.now()));
      }

      setHoursLeft(24);

      await Swal.fire({
        icon: "success",
        title: "Carta enviada",
        text: "Tu recomendación fue enviada correctamente.",
      });

      setMessage("");
      setBookId("");
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.message || "No se pudo enviar la carta.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeaturedToLibrary = async () => {
    if (!featuredLetter || addingFeatured) return;

    const recommendedBookId = getLetterBookId(featuredLetter);
    const recommendedBook = getLetterBookObject(featuredLetter);

    if (!recommendedBookId && !recommendedBook?.title && !featuredLetter?.bookTitle && !featuredLetter?.title) {
      await Swal.fire({
        icon: "warning",
        title: "Libro no disponible",
        text: "La carta no trae información suficiente del libro recomendado.",
      });
      return;
    }

    const alreadyInLibrary =
      recommendedBookId && books.some((book) => book.id === recommendedBookId);

    if (alreadyInLibrary) {
      await Swal.fire({
        icon: "info",
        title: "Ya está en tu biblioteca",
        text: "Este libro ya aparece en tu lista.",
      });
      return;
    }

    if (!defaultFormatId || !defaultStatusId) {
      await Swal.fire({
        icon: "warning",
        title: "Falta formato",
        text: "No se pudo obtener un formato por defecto para agregar este libro.",
      });
      return;
    }

    setAddingFeatured(true);

    try {
      const basePayload = {
        readingStatusId: defaultStatusId,
        formatId: defaultFormatId,
        currentChapter: 1,
        currentPage: 1,
        isFavorite: false,
      };

      const totalPages = getPositiveNumber(
        recommendedBook?.defaultPages,
        recommendedBook?.pages,
        recommendedBook?.pageCount,
        recommendedBook?.totalPages,
        featuredLetter?.defaultPages,
        featuredLetter?.pages,
        featuredLetter?.pageCount,
        featuredLetter?.totalPages,
      );

      const totalChapters = getPositiveNumber(
        recommendedBook?.defaultChapters,
        recommendedBook?.chapters,
        recommendedBook?.chapterCount,
        recommendedBook?.totalChapters,
        featuredLetter?.defaultChapters,
        featuredLetter?.chapters,
        featuredLetter?.chapterCount,
        featuredLetter?.totalChapters,
      );

      if (recommendedBookId) {
        await api.library.add({
          bookId: recommendedBookId,
          ...(totalPages ? { totalPages } : {}),
          ...(totalChapters ? { totalChapters } : {}),
          ...basePayload,
        } as any);
      } else {
        await api.library.add({
          newBook: {
            title: getLetterBookTitle(featuredLetter),
            authors:
              Array.isArray(recommendedBook?.authors) && recommendedBook.authors.length > 0
                ? recommendedBook.authors.map((author: any) =>
                    author?.id ? { id: author.id } : { name: author?.name },
                  )
                : getLetterBookAuthors(featuredLetter) !== "Autor desconocido"
                  ? [{ name: getLetterBookAuthors(featuredLetter) }]
                  : [],
            genres:
              Array.isArray(recommendedBook?.genres) && recommendedBook.genres.length > 0
                ? recommendedBook.genres.map((genre: any) =>
                    genre?.id ? { id: genre.id } : { name: genre?.name },
                  )
                : [],
            cover: recommendedBook?.cover || recommendedBook?.coverValue || "#c2410c",
            ...(totalPages ? { defaultPages: totalPages, pages: totalPages } : {}),
            ...(totalChapters ? { defaultChapters: totalChapters, chapters: totalChapters } : {}),
          },
          ...basePayload,
        } as any);
      }

      await Swal.fire({
        icon: "success",
        title: "Agregado",
        text: "Libro agregado a tu biblioteca.",
      });

      const libraryResponse = await api.library.getAll({ page: 0, size: 100 });
      const libraryBooks: BookLite[] = (libraryResponse.content || [])
        .filter((entry: any) => entry?.book?.id)
        .map((entry: any) => ({
          id: entry.book.id,
          libraryId: entry.id,
          title: entry.book?.title || "Libro sin título",
          authorNames:
            entry.book?.authors?.map((a: any) => a.name).filter(Boolean).join(", ") ||
            "Autor desconocido",
        }));

      setBooks(libraryBooks);
    } catch (e: any) {
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: e?.message || "No se pudo agregar el libro.",
      });
    } finally {
      setAddingFeatured(false);
    }
  };

  const handlePassLetter = () => {
    setOpened(false);
    setLiked(null);
  };

  return (
    <div className={pageClass}>
      <div className="max-w-3xl mx-auto space-y-8">
        {loadingLetters ? (
          <div className={`${softCardClass} p-8 text-center text-sm ${mutedText}`}>
            Cargando tu buzón…
          </div>
        ) : opened && featuredLetter ? (
          <div className={`${cardClass} p-5`}>
            <div className="flex items-start gap-4">
              <div
                className={
                  isDark
                    ? "flex items-center justify-center w-12 h-12 rounded-3xl bg-[#1E2332] border border-[#2E3D52] text-amber-400 text-xl font-bold"
                    : "flex items-center justify-center w-12 h-12 rounded-3xl bg-amber-100 border border-amber-200 text-amber-700 text-xl font-bold"
                }
              >
                M
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`text-xs ${mutedText} uppercase tracking-[0.24em]`}>
                    Carta anónima
                  </div>
                  <span className="text-[10px]">👤</span>
                </div>

                <span className="text-xs text-amber-500 font-semibold">
                  {featuredTitle}
                  {featuredAuthors && featuredAuthors !== "Autor desconocido" ? ` · ${featuredAuthors}` : ""}
                </span>

                <p className={`text-sm ${normalText} italic leading-relaxed mt-3`}>
                  {featuredLetter.content}
                </p>
              </div>
            </div>

            <div
              className={
                isDark
                  ? "mt-5 border-t border-[#1E2A3A] pt-4"
                  : "mt-5 border-t border-slate-200 pt-4"
              }
            >
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs ${mutedText}`}>
                  ¿Te gustó esta recomendación?
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLiked(true)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      liked === true
                        ? "bg-green-600/20 border-green-600/40 text-green-400"
                        : isDark
                          ? "bg-[#1A2332] border-[#2E3D52] text-slate-500 hover:text-green-400"
                          : "bg-slate-100 border-slate-300 text-slate-500 hover:text-green-600"
                    }`}
                  >
                    <ThumbsUp size={13} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setLiked(false)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      liked === false
                        ? "bg-red-600/20 border-red-600/40 text-red-400"
                        : isDark
                          ? "bg-[#1A2332] border-[#2E3D52] text-slate-500 hover:text-red-400"
                          : "bg-slate-100 border-slate-300 text-slate-500 hover:text-red-600"
                    }`}
                  >
                    <ThumbsDown size={13} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={handleAddFeaturedToLibrary}
                  disabled={addingFeatured}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <BookPlus size={14} />
                  {addingFeatured ? "Agregando..." : "Agregar a mi lista"}
                </button>

                <button
                  type="button"
                  onClick={handlePassLetter}
                  className={
                    isDark
                      ? "px-5 py-3 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors"
                      : "px-5 py-3 bg-slate-100 border border-slate-300 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors"
                  }
                >
                  Pasar
                </button>
              </div>
            </div>
          </div>
        ) : opened && !featuredLetter ? (
          <div className={`${softCardClass} p-8 text-center`}>
            <Inbox
              size={28}
              className={`mx-auto mb-3 ${isDark ? "text-slate-600" : "text-slate-400"}`}
            />
            <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
              Todavía no has recibido ninguna carta anónima.
            </p>
            <p className={`text-xs ${mutedText} mt-1`}>
              Vuelve más tarde — otros lectores podrían recomendarte algo pronto.
            </p>
          </div>
        ) : null}

        <p className={`text-center text-xs ${mutedText}`}>
          Abre tu carta diaria — una recomendación anónima de otro lector
        </p>
        
        <div className="max-w-lg mx-auto">
          <div className={`text-[10px] font-bold ${mutedText} uppercase tracking-widest mb-1`}>
            Enviar una carta
          </div>

          <p className={`text-xs ${mutedText} mb-3`}>
            Comparte una recomendación literaria anónima. Solo puedes enviar una carta cada 24 horas.
          </p>

          {hoursLeft !== null && (
            <div
              className={
                isDark
                  ? "mb-3 rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-xs text-amber-300"
                  : "mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-700"
              }
            >
              Ya enviaste una carta. Podrás enviar otra en aproximadamente {hoursLeft} horas.
            </div>
          )}

          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            disabled={hoursLeft !== null}
            className={`${fieldClass} mb-3`}
          >
            <option value="">Selecciona un libro</option>
            {books.map((book) => (
              <option key={book.libraryId} value={book.id}>
                {book.title}
              </option>
            ))}
          </select>

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={hoursLeft !== null}
            placeholder="¿Qué libro quieres recomendar hoy? Cuenta por qué te marcó…"
            rows={5}
            className={textareaClass}
          />

          <button
            type="button"
            disabled={message.trim().length < 10 || !bookId || loading || hoursLeft !== null}
            onClick={handleSendLetter}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all hover:from-amber-400 hover:to-amber-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-amber-900/20"
          >
            <Send size={14} />
            {loading ? "Enviando..." : "Enviar carta"}
          </button>

          <p className={`text-center text-xs ${mutedText} mt-2`}>
            Mínimo 10 caracteres · completamente anónimo
          </p>
        </div>
      </div>

    </div>
  );
}