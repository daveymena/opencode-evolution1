import React, { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
    const body = mode === "login"
      ? { email: form.email, password: form.password }
      : { email: form.email, password: form.password, name: form.name };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error desconocido");
        return;
      }
      login(data.token, data.user);
      navigate("/app");
    } catch {
      setError("No se pudo conectar al servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <button onClick={() => navigate("/")} className="text-gray-600 hover:text-gray-400 text-xs mb-4 flex items-center gap-1 mx-auto transition-colors">
            ← Volver al inicio
          </button>
          <div className="text-2xl font-bold text-white mb-1">OpenCode</div>
          <div className="text-sm text-gray-500">Tu entorno de desarrollo con IA</div>
        </div>

        <div className="bg-[#141414] border border-white/[0.08] rounded-xl p-6">
          {/* Tabs */}
          <div className="flex mb-6 bg-white/[0.04] rounded-lg p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === "login" ? "bg-white/[0.08] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
                mode === "register" ? "bg-white/[0.08] text-white" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Tu nombre"
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@email.com"
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {loading ? "Cargando..." : mode === "login" ? "Entrar" : "Crear cuenta"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
