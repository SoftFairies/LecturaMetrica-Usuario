"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import Swal from "sweetalert2";

import Button from "@/components/ui/Button";
import { api } from "@/data/api";

export default function OnboardingPage() {
  const router = useRouter();

  const [selected, setSelected] = useState<string[]>([]);
  const [goal, setGoal] = useState(24);

  const [availableGenres, setAvailableGenres] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    let active = true;

    const loadGenres = async () => {
      try {
        const response = await api.genders.getAll({ size: 100 });

        if (!active) return;

        setAvailableGenres(response.content);

        console.log("Géneros:", response.content);
      } catch (error) {
        console.error("Error cargando géneros", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar los géneros.",
        });
      }
    };

    loadGenres();

    return () => {
      active = false;
    };
  }, []);

  const toggle = (genre: string) => {
    setSelected((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const savePreferences = async () => {
    const genreIds = availableGenres
      .filter((genre) => selected.includes(genre.name))
      .map((genre) => genre.id);

    if (genreIds.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona al menos un género",
      });

      return;
    }

    try {
      await api.preferences.update({
        genreIds,
      });

      await Swal.fire({
        icon: "success",
        title: "Preferencias guardadas",
        text: "Ya puedes comenzar a leer.",
      });

      router.push("/biblioteca");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "No se pudieron guardar",
        text: err.message ?? "Intenta nuevamente.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">

        {/* Step */}
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center">
            <Sparkles
              size={14}
              className="text-amber-500"
            />
          </div>

          <div className="flex gap-2 items-center">
            <div className="h-1 w-8 rounded-full bg-[#2E3D52]" />
            <div className="h-1 w-12 rounded-full bg-amber-500" />
          </div>

          <span className="text-slate-400 text-sm font-medium">
            Paso 2 / 2
          </span>
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-white font-serif">
            Tus preferencias literarias
          </h1>

          <p className="text-slate-400 text-sm">
            Cuéntanos qué te gusta leer
          </p>
        </div>

        {/* Géneros */}
        <div className="mb-8">
          <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-3">
            Géneros favoritos

            <span className="text-amber-500 normal-case font-normal">
              {" "}
              ({selected.length} seleccionados)
            </span>
          </label>

          <div className="flex flex-wrap gap-2">

            {availableGenres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => toggle(genre.name)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selected.includes(genre.name)
                    ? "bg-amber-700/50 text-amber-300 border border-amber-600/60"
                    : "bg-[#1A2332] text-slate-400 border border-[#2E3D52] hover:border-slate-500"
                }`}
              >
                {genre.name}
              </button>
            ))}

          </div>
        </div>

        {/* Meta */}
        <div className="mb-8">
          <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-3">
            Meta de lectura anual
          </label>

          <div className="bg-[#1A2332] rounded-2xl p-5 border border-[#2E3D52]">

            <div className="flex items-start gap-4 mb-4">

              <div className="bg-amber-600/20 rounded-xl p-3 text-center min-w-[60px]">
                <div className="text-3xl font-bold text-amber-400">
                  {goal}
                </div>
              </div>

              <div className="pt-1">
                <div className="text-white font-medium">
                  libros en 2025
                </div>

                <div className="text-slate-500 text-xs mt-0.5">
                  ≈ {(goal / 52).toFixed(1)} libros por semana
                </div>
              </div>

            </div>

            <input
              type="range"
              min={1}
              max={100}
              value={goal}
              onChange={(e) => setGoal(Number(e.target.value))}
              className="w-full"
            />

          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={savePreferences}
        >
          Comenzar a leer →
        </Button>

      </div>
    </div>
  );
}