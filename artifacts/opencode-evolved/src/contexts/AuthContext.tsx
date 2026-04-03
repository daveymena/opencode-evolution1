import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

interface AuthUser {
  id: number;
  email: string;
  name: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";
const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    
    if (savedToken && savedUser) {
      // Verificar que el token sigue siendo válido
      fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${savedToken}` },
      })
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data) {
            setToken(savedToken);
            setUser(data);
          } else {
            // Si el token falló pero el usuario quiere entrar directo, usamos un usuario default
            setToken("default_token");
            setUser({ id: 1, email: "daveymen16@gmail.com", name: "Duvier Mena" });
          }
        })
        .catch(() => {
          // Bypass error y usar usuario default
          setToken("default_token");
          setUser({ id: 1, email: "daveymen16@gmail.com", name: "Duvier Mena" });
        })
        .finally(() => setIsLoading(false));
    } else {
      // AUTO-LOGIN: Si no hay sesión, creamos una de invitado automáticamente
      setToken("guest_token");
      setUser({ id: 1, email: "daveymen16@gmail.com", name: "Duvier Mena" });
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
