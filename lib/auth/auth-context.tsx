"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, LoginCredentials, RegisterCredentials } from "./auth.types";
import {
  login as loginService,
  register as registerService,
  logout as logoutService,
  restoreSession,
} from "./auth.service";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ ok: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const restored = await restoreSession();
        if (!cancelled) {
          setUser(restored);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const result = await loginService(credentials);
      if (result.ok) {
        setUser(result.data);
        router.push("/dashboard");
        return { ok: true };
      }
      return { ok: false, error: result.error };
    },
    [router]
  );

  const register = useCallback(
    async (credentials: RegisterCredentials) => {
      const result = await registerService(credentials);
      if (result.ok) {
        setUser(result.data);
        router.push("/dashboard");
        return { ok: true };
      }
      return { ok: false, error: result.error };
    },
    [router]
  );

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
