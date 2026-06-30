import { ReactNode } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - hero */}
      <div
        className="hidden lg:flex lg:w-[45%] relative flex-col justify-between p-10"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" />
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600/80 flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <span className="text-white font-semibold text-lg">LecturaMetrica</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="w-8 h-0.5 bg-amber-500 mb-6" />
            <p className="text-3xl lg:text-4xl text-white font-serif italic leading-snug">
              &ldquo;No hay amigo tan leal como un libro.&rdquo;
            </p>
            <p className="mt-4 text-amber-400 text-sm font-medium">— Ernest Hemingway</p>
          </div>

          <div className="flex gap-8">
            {[
              { value: "12k+", label: "Lectores" },
              { value: "340k", label: "Libros" },
              { value: "1.2M", label: "Páginas" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-bold text-amber-400">{stat.value}</div>
                <div className="text-xs text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 bg-[#0D1117] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
