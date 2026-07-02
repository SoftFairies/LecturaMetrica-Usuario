"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/data/api";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ name, lastname: lastName, email, password });
      router.push("/onboarding");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message || "No se pudo crear la cuenta");
      } else {
        setError("No se pudo conectar con el servidor");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Tabs */}
      <div className="flex rounded-xl bg-[#1A2332] p-1 mb-8">
        <Link
          href="/login"
          className="flex-1 py-2.5 text-center text-sm font-medium text-slate-400 hover:text-white transition-all"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/register"
          className="flex-1 py-2.5 text-center text-sm font-semibold text-amber-400 bg-amber-700/40 rounded-lg transition-all"
        >
          Registrarse
        </Link>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-white font-serif">Crea tu cuenta</h1>
        <p className="text-slate-400 text-sm">Únete a la comunidad lectora</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Nombre"
          type="text"
          placeholder="María"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Input
          label="Apellido"
          type="text"
          placeholder="García"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-red-400 text-sm" role="alert">
            {error}
          </p>
        )}

        <Button variant="primary" size="lg" fullWidth type="submit" disabled={submitting}>
          {submitting ? "Creando cuenta..." : "Continuar →"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="text-amber-400 font-semibold hover:text-amber-300">
          Inicia sesión
        </Link>
      </p>
    </AuthLayout>
  );
}
