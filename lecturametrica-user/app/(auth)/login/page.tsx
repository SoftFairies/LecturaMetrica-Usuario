"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/biblioteca");
  };

  return (
    <AuthLayout>
      {/* Tabs */}
      <div className="flex rounded-xl bg-[#1A2332] p-1 mb-8">
        <Link href="/login" className="flex-1 py-2.5 text-center text-sm font-semibold text-amber-400 bg-amber-700/40 rounded-lg transition-all">
          Iniciar sesión
        </Link>
        <Link href="/register" className="flex-1 py-2.5 text-center text-sm font-medium text-slate-400 hover:text-white transition-all">
          Registrarse
        </Link>
      </div>

      <div className="space-y-2 mb-8">
        <h1 className="text-3xl font-bold text-white font-serif">Bienvenido de vuelta</h1>
        <p className="text-slate-400 text-sm">Continúa donde lo dejaste</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          rightLabel={
            <Link href="/forgot-password" className="text-amber-400 hover:text-amber-300 text-xs">
              ¿Olvidaste tu contraseña?
            </Link>
          }
        />
        <Button variant="primary" size="lg" fullWidth type="submit">
          Entrar a mi biblioteca →
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿No tienes cuenta?{" "}
        <Link href="/register" className="text-amber-400 font-semibold hover:text-amber-300">
          Regístrate gratis
        </Link>
      </p>
    </AuthLayout>
  );
}
