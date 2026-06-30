"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import Button from "@/components/ui/Button";

export default function VerifyCodePage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newCode = [...code];
    newCode[idx] = val.slice(-1);
    setCode(newCode);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  };

  return (
    <AuthLayout>
      <Link href="/forgot-password" className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-8 transition-colors">
        <ArrowLeft size={14} />
        Volver al inicio de sesión
      </Link>

      <div className="flex items-center justify-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-700/30 border border-blue-600/30 flex items-center justify-center">
          <Mail size={24} className="text-blue-400" />
        </div>
      </div>

      <div className="space-y-2 mb-8 text-center">
        <h1 className="text-2xl font-bold text-white font-serif">Revisa tu correo</h1>
        <p className="text-slate-400 text-sm">
          Enviamos un código de 6 dígitos a<br />
          <span className="font-semibold text-white">tu@correo.com</span>
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase block mb-3">
            Código de verificación
          </label>
          <div className="flex gap-3 justify-center">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-12 h-14 bg-[#1A2332] border border-[#2E3D52] rounded-xl text-center text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-600/50 transition-all"
              />
            ))}
          </div>
        </div>

        <Button variant="primary" size="lg" fullWidth>
          Verificar código →
        </Button>

        <p className="text-center text-sm text-slate-500">
          ¿No llegó?{" "}
          <button className="text-amber-400 font-semibold hover:text-amber-300">
            Reenviar código
          </button>
        </p>
      </div>
    </AuthLayout>
  );
}
