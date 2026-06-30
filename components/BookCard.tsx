"use client";

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
}

interface BookCardProps {
  book: Book;
  onClick: () => void;
  onDelete: () => void;
}

const STATUS_COLORS = {
  Leyendo: "bg-blue-600/20 text-blue-400 border-blue-600/30",
  Completado: "bg-green-600/20 text-green-400 border-green-600/30",
  Pendiente: "bg-slate-600/20 text-slate-400 border-slate-600/30",
};

export default function BookCard({ book, onClick, onDelete }: BookCardProps) {
  return (
    <div
      className="relative bg-[#111827] rounded-2xl overflow-hidden cursor-pointer group border border-[#1E2A3A] hover:border-[#2E3D52] transition-all"
      onClick={onClick}
    >
      {/* Cover */}
      <div
        className="w-full h-40"
        style={{ background: book.color }}
      />
      {/* Status badge */}
      <div className="absolute top-3 left-3">
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase tracking-wide ${STATUS_COLORS[book.status]}`}
        >
          {book.status}
        </span>
      </div>
      {/* Delete button - top right */}
      {book.status !== "Pendiente" && (
        <button
          className="absolute top-2 right-2 w-6 h-6 bg-amber-600/20 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-amber-500 text-xs hover:bg-amber-600/40"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          ⊞
        </button>
      )}

      {/* Info */}
      <div className="p-3">
        <div className="font-semibold text-white text-sm leading-tight">{book.title}</div>
        <div className="text-slate-500 text-xs mt-0.5">{book.author}</div>

        {/* Stars */}
        {book.rating !== undefined && (
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} className={`text-xs ${s <= (book.rating ?? 0) ? "text-amber-400" : "text-slate-700"}`}>★</span>
            ))}
          </div>
        )}

        {book.status !== "Pendiente" && book.progress !== undefined ? (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-slate-500">Progreso</span>
              <span className="text-[10px] font-semibold text-amber-400">{book.progress}%</span>
            </div>
            <div className="w-full h-1 bg-[#2E3D52] rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${book.progress}%` }}
              />
            </div>
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

export type { Book };
