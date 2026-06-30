"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ArrowLeft } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/verify-code");
  };

  return (
    <AuthLayout>
      <Link href="/login" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft size={14} />
        Volver al inicio de sesión
      </Link>

      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-700/30 border border-amber-600/30 flex items-center justify-center">
          <BookOpen size={24} className="text-amber-500" />
        </div>
      </div>

      <div className="space-y-2 mb-8 text-center">
        <h1 className="text-2xl font-bold text-white font-serif">¿Olvidaste tu contraseña?</h1>
        <p className="text-slate-400 text-sm">
          Ingresa tu correo y te enviaremos un código de verificación.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input
          label="Correo electrónico"
          type="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button variant="primary" size="lg" fullWidth type="submit">
          Enviar código →
        </Button>
      </form>
    </AuthLayout>
  );
}
