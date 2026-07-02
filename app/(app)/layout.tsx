"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import AppSidebar from "@/components/AppSidebar";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0D1117] text-slate-400 text-sm">
        Cargando...
      </div>
    );
  }

  if (!isAuthenticated) {
    // Evita parpadeo de contenido mientras router.replace navega a /login
    return null;
  }

  return (
    <div className="flex min-h-screen bg-[#0D1117]">
      <AppSidebar />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
