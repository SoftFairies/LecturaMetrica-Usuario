"use client";

import { useEffect, useState } from "react";
import {
  Mail,
  ThumbsUp,
  ThumbsDown,
  Send,
  BookPlus,
  ChevronRight,
} from "lucide-react";
import ProfileModal from "@/components/ProfileModal";
import { api } from "@/data/api";
import Swal from "sweetalert2";

const LAST_SENT_KEY = "lecturametrica_last_mailbox_sent";

const PREV_LETTERS = [
  { book: "El Cementerio de los Libros Olvidados", author: "Carlos Ruiz Zafón", when: "ayer" },
  { book: "1984", author: "George Orwell", when: "hace 2 días" },
  { book: "Rayuela", author: "Julio Cortázar", when: "hace 4 días" },
];

export default function BuzonPage() {
  const [showProfile, setShowProfile] = useState(false);
  const [opened, setOpened] = useState(true);
  const [liked, setLiked] = useState<boolean | null>(null);

  const [message, setMessage] = useState("");
  const [bookId, setBookId] = useState("");

  const [books, setBooks] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [receivedLetters, setReceivedLetters] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);

  useEffect(() => {
    const lastSent = localStorage.getItem(LAST_SENT_KEY);

    if (lastSent) {
      const diff = Date.now() - Number(lastSent);
      const hours = diff / (1000 * 60 * 60);

      if (hours < 24) {
        setHoursLeft(Math.ceil(24 - hours));
      }
    }

    const loadData = async () => {
      try {
        const booksResponse = await api.books.getAll({ page: 0, size: 50 });
        setBooks(booksResponse.content || []);
      } catch (error) {
        console.error("Error cargando libros:", error);
      }

      try {
        const recs = await api.preferences.getRecommendations();
        setRecommendations(recs || []);
      } catch (error) {
        console.error("Error cargando recomendaciones:", error);
      }

      try {
        const received = await api.mailbox.getReceived();
        setReceivedLetters(received || []);
      } catch (error) {
        console.error("Error cargando buzón:", error);
        setReceivedLetters([]);
      }
    };

    loadData();
  }, []);

  const defaultLetter = {
    book: PREV_LETTERS[0].book,
    author: PREV_LETTERS[0].author,
    when: PREV_LETTERS[0].when,
    message:
      "Una historia que te atrapa desde la primera página. La obra tejió algo único — el Cementerio de los Libros Olvidados es uno de los lugares más memorables de la literatura contemporánea en español.",
  };

  const activeRecommendation = recommendations[0];

  const currentLetter = activeRecommendation
    ? {
        book: activeRecommendation.title,
        author:
          activeRecommendation.authors?.map((a: any) => a.name).join(", ") ||
          activeRecommendation.origin ||
          "Autor desconocido",
        when: "recomendado para ti",
        message: `Una lectura recomendada basada en tus preferencias: ${activeRecommendation.title}. ¡No te la pierdas!`,
      }
    : defaultLetter;

  const previousLetters =
    receivedLetters.length > 0
      ? receivedLetters.map((letter) => ({
          book: "Carta recibida",
          author:
            letter.content?.length > 45
              ? `${letter.content.slice(0, 45)}…`
              : letter.content,
          when: letter.sentAt ? new Date(letter.sentAt).toLocaleDateString() : "reciente",
        }))
      : PREV_LETTERS;

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

    const lastSent = localStorage.getItem(LAST_SENT_KEY);

    if (lastSent) {
      const diff = Date.now() - Number(lastSent);
      const hours = diff / (1000 * 60 * 60);

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

    setLoading(true);

    try {
      await api.mailbox.send({
        bookId,
        content: trimmed,
      });

      localStorage.setItem(LAST_SENT_KEY, String(Date.now()));
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

  return (
    <div className="min-h-screen bg-[#050816] text-white px-4 py-6 sm:px-6 md:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {opened && (
          <div className="bg-[#111827] border border-[#1E2A3A] rounded-[2rem] p-5 shadow-xl shadow-black/40">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-3xl bg-[#1E2332] border border-[#2E3D52] text-amber-400 text-xl font-bold">
                M
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-xs text-slate-400 uppercase tracking-[0.24em]">
                    Carta anónima
                  </div>
                  <span className="text-[10px]">👤</span>
                </div>

                <span className="text-xs text-amber-500 font-semibold">
                  {currentLetter.author}
                </span>

                <p className="text-sm text-slate-300 italic leading-relaxed mt-3">
                  {currentLetter.message}
                </p>
              </div>
            </div>

            <div className="mt-5 border-t border-[#1E2A3A] pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-slate-500">
                  ¿Te gustó esta recomendación?
                </span>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLiked(true)}
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                      liked === true
                        ? "bg-green-600/20 border-green-600/40 text-green-400"
                        : "bg-[#1A2332] border-[#2E3D52] text-slate-500 hover:text-green-400"
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
                        : "bg-[#1A2332] border-[#2E3D52] text-slate-500 hover:text-red-400"
                    }`}
                  >
                    <ThumbsDown size={13} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (activeRecommendation?.id) {
                        await api.library.add({ bookId: activeRecommendation.id });
                      }

                      await Swal.fire({
                        icon: "success",
                        title: "Agregado",
                        text: "Libro agregado a tu biblioteca.",
                      });
                    } catch (e: any) {
                      await Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: e?.message || "No se pudo agregar el libro.",
                      });
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-700 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-600 transition-all shadow-lg shadow-amber-900/30"
                >
                  <BookPlus size={14} />
                  Agregar a mi lista
                </button>

                <button
                  type="button"
                  onClick={() => setOpened(false)}
                  className="px-5 py-3 bg-[#1A2332] border border-[#2E3D52] text-white text-sm font-medium rounded-xl hover:bg-[#243044] transition-colors"
                >
                  Pasar
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-xs text-slate-600">
          Abre tu carta diaria — una recomendación anónima de otro lector
        </p>

        <div className="max-w-lg mx-auto mb-8">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
            Cartas anteriores
          </div>

          <div className="space-y-2">
            {previousLetters.map((l, index) => (
              <button
                key={`${l.book}-${index}`}
                type="button"
                className="w-full flex items-center justify-between bg-[#111827] border border-[#1E2A3A] hover:border-[#2E3D52] rounded-xl px-4 py-3.5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#1A2332] border border-[#2E3D52] flex items-center justify-center">
                    <Mail size={13} className="text-slate-500" />
                  </div>

                  <div className="text-left">
                    <div className="text-sm text-white font-medium">{l.book}</div>
                    <div className="text-xs text-slate-500">{l.author}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-600 group-hover:text-slate-400 transition-colors">
                  <span className="text-xs">{l.when}</span>
                  <ChevronRight size={13} />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
            Enviar una carta
          </div>

          <p className="text-xs text-slate-600 mb-3">
            Comparte una recomendación literaria anónima. Solo puedes enviar una carta cada 24 horas.
          </p>

          {hoursLeft !== null && (
            <div className="mb-3 rounded-xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-xs text-amber-300">
              Ya enviaste una carta. Podrás enviar otra en aproximadamente {hoursLeft} horas.
            </div>
          )}

          <select
            value={bookId}
            onChange={(e) => setBookId(e.target.value)}
            disabled={hoursLeft !== null}
            className="w-full bg-[#111827] border border-[#1E2A3A] rounded-xl px-4 py-3 text-sm text-white mb-3 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 disabled:opacity-40"
          >
            <option value="">Selecciona un libro</option>
            {books.map((book) => (
              <option key={book.id} value={book.id}>
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
            className="w-full bg-[#111827] border border-[#1E2A3A] rounded-2xl px-5 py-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-amber-600/30 resize-none mb-3 transition-all disabled:opacity-40"
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

          <p className="text-center text-xs text-slate-600 mt-2">
            Mínimo 10 caracteres · completamente anónimo
          </p>
        </div>
      </div>

      <div className="fixed bottom-20 md:bottom-6 right-5 md:right-6 z-30">
        <button
          type="button"
          onClick={() => setShowProfile(true)}
          className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 text-white font-bold shadow-lg shadow-amber-900/40 hover:scale-105 transition-transform"
        >
          M
        </button>
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}