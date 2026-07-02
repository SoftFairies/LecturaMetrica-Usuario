"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { api, tokenStorage, ApiError, UserResponse, LoginRequest, RegisterRequest } from "@/data/api";

interface AuthContextValue {
  user: UserResponse | null;
  /** true mientras se verifica el token guardado al cargar la app */
  loading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get();
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const me = await api.users.getMe();
      setUser(me);
    } catch (err) {
      // Token inválido o expirado
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    const res = await api.auth.login(data);
    tokenStorage.set(res.token);
    await refreshUser();
  }, [refreshUser]);

  const register = useCallback(async (data: RegisterRequest) => {
    const res = await api.auth.register(data);
    tokenStorage.set(res.token);
    await refreshUser();
  }, [refreshUser]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated: !!user, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

export { ApiError };
