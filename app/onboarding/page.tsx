"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import Swal from "sweetalert2";

import Button from "@/components/ui/Button";
import { api } from "@/data/api";

export default function OnboardingPage() {
  const router = useRouter();

  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<number[]>([]);
  const [goal, setGoal] = useState(24);
  const [saving, setSaving] = useState(false);

  const [availableGenres, setAvailableGenres] = useState<{ id: number; name: string }[]>([]);
  const [availableFormats, setAvailableFormats] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const savedGoal = localStorage.getItem("lecturametrica_annual_goal");
    if (savedGoal) setGoal(Number(savedGoal));
  }, []);

  useEffect(() => {
    let active = true;

    const loadCatalogs = async () => {
      try {
        const [genresResponse, formatsResponse] = await Promise.all([
          api.genders.getAll({ size: 100 }),
          api.formats.getAll({ size: 100 }),
        ]);

        if (!active) return;

        setAvailableGenres(genresResponse.content || []);
        setAvailableFormats(formatsResponse.content || []);

        if (formatsResponse.content?.[0]?.id) {
          setSelectedFormats([formatsResponse.content[0].id]);
        }
      } catch {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudieron cargar las preferencias.",
        });
      }
    };

    loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  const toggleGenre = (id: number) => {
    setSelectedGenres((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const toggleFormat = (id: number) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const savePreferences = async () => {
    if (saving) return;

    if (selectedGenres.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona al menos un género",
      });
      return;
    }

    if (selectedFormats.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Selecciona al menos un formato",
      });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        genreIds: selectedGenres,
        formatIds: selectedFormats,
      };

      try {
        await api.preferences.create(payload);
      } catch (createErr: any) {
        if (createErr?.status === 409 || createErr?.status === 400 || createErr?.status === 500) {
          await api.preferences.update(payload);
        } else {
          throw createErr;
        }
      }

      localStorage.setItem("lecturametrica_annual_goal", String(goal));

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
        text: err?.message ?? "Intenta nuevamente.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0D1117] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-8 h-8 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center">
            <Sparkles size={14} className="text-amber-500" />
          </div>

          <div className="flex gap-2 items-center">
            <div className="h-1 w-8 rounded-full bg-[#2E3D52]" />
            <div className="h-1 w-12 rounded-full bg-amber-500" />
          </div>

          <span className="text-slate-400 text-sm font-medium">Paso 2 / 2</span>
        </div>

        <div className="space-y-2 mb-8">
          <h1 className="text-3xl font-bold text-white font-serif">
            Tus preferencias literarias
          </h1>
          <p className="text-slate-400 text-sm">Cuéntanos qué te gusta leer</p>
        </div>

        <div className="mb-8">
          <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-3">
            Géneros favoritos{" "}
            <span className="text-amber-500 normal-case font-normal">
              ({selectedGenres.length} seleccionados)
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {availableGenres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                onClick={() => toggleGenre(genre.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGenres.includes(genre.id)
                    ? "bg-amber-700/50 text-amber-300 border border-amber-600/60"
                    : "bg-[#1A2332] text-slate-400 border border-[#2E3D52] hover:border-slate-500"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-3">
            Formatos favoritos{" "}
            <span className="text-amber-500 normal-case font-normal">
              ({selectedFormats.length} seleccionados)
            </span>
          </label>

          <div className="flex flex-wrap gap-2">
            {availableFormats.map((format) => (
              <button
                key={format.id}
                type="button"
                onClick={() => toggleFormat(format.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedFormats.includes(format.id)
                    ? "bg-amber-700/50 text-amber-300 border border-amber-600/60"
                    : "bg-[#1A2332] text-slate-400 border border-[#2E3D52] hover:border-slate-500"
                }`}
              >
                {format.name}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-3">
            Meta de lectura anual
          </label>

          <div className="bg-[#1A2332] rounded-2xl p-5 border border-[#2E3D52]">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-amber-600/20 rounded-xl p-3 text-center min-w-[60px]">
                <div className="text-3xl font-bold text-amber-400">{goal}</div>
              </div>

              <div className="pt-1">
                <div className="text-white font-medium">libros en 2026</div>
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
          disabled={saving}
        >
          {saving ? "Guardando..." : "Comenzar a leer →"}
        </Button>
      </div>
    </div>
  );
}