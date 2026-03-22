import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Code2, Zap, Globe, GitBranch, Key, Users,
  ArrowRight, Terminal, Sparkles, Shield, Layers,
  ChevronRight, Star, Play
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "IA de última generación",
    desc: "Accede a GPT-4o, Claude Sonnet, Gemini y más desde una sola interfaz. Cambia de modelo en segundos.",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Code2,
    title: "Editor integrado",
    desc: "Monaco Editor con syntax highlighting, autocompletado y vista previa en tiempo real. Como VS Code, en el navegador.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: Globe,
    title: "Preview en vivo",
    desc: "Ve tu aplicación corriendo mientras la construyes. Sin configuración, sin servidores locales.",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
  {
    icon: GitBranch,
    title: "Git integrado",
    desc: "Conecta tu repositorio y mantén todo sincronizado. Cada sesión queda guardada automáticamente.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  {
    icon: Key,
    title: "Tus propias API keys",
    desc: "Usa tus claves de OpenAI, Anthropic, Google y más. Almacenadas encriptadas, privadas para tu cuenta.",
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  {
    icon: Users,
    title: "Multi-usuario",
    desc: "Cada persona tiene su propio espacio, proyectos y configuración. Perfecto para equipos y agencias.",
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/20",
  },
];

const MODELS = ["GPT-4o", "Claude Sonnet", "Gemini 2.5", "Grok", "DeepSeek", "Mistral"];

const DEMO_LINES = [
  { delay: 0,    text: "$ opencode web --port 3000", color: "text-gray-400" },
  { delay: 600,  text: "✓ Servidor iniciado en :3000", color: "text-emerald-400" },
  { delay: 1200, text: "✓ Modelos cargados: 6 providers", color: "text-emerald-400" },
  { delay: 1800, text: "✓ Workspace listo en /root/workspace", color: "text-emerald-400" },
  { delay: 2400, text: "> Crea una app de tareas con React", color: "text-white" },
  { delay: 3200, text: "◆ Generando componentes...", color: "text-indigo-400" },
  { delay: 3800, text: "◆ App lista en :5173", color: "text-indigo-400" },
];

function TerminalDemo() {
  const [visible, setVisible] = useState<number[]>([]);

  useEffect(() => {
    DEMO_LINES.forEach((line, i) => {
      setTimeout(() => setVisible(v => [...v, i]), line.delay);
    });
  }, []);

  return (
    <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-[#111]">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-2 text-xs text-gray-600 font-mono">opencode — bash</span>
      </div>
      <div className="p-5 font-mono text-sm space-y-1.5 min-h-[200px]">
        {DEMO_LINES.map((line, i) => (
          <div
            key={i}
            className={`transition-all duration-300 ${visible.includes(i) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1"} ${line.color}`}
          >
            {line.text}
            {i === DEMO_LINES.length - 1 && visible.includes(i) && (
              <span className="inline-block w-2 h-4 bg-indigo-400 ml-1 animate-pulse align-middle" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [modelIdx, setModelIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setModelIdx(i => (i + 1) % MODELS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-gray-200 overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0d0d0d]/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-white text-sm">OpenCode</span>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-medium">BETA</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              Iniciar sesión
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
            >
              Empezar gratis
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Potenciado por los mejores modelos de IA
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Tu entorno de desarrollo
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              con IA integrada
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-4">
            Escribe código, genera apps completas y despliega proyectos usando{" "}
            <span className="text-white font-medium">
              {MODELS[modelIdx]}
            </span>{" "}
            y más — todo desde el navegador.
          </p>

          <p className="text-sm text-gray-600 mb-10">
            Sin instalaciones. Sin configuración. Listo en segundos.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-xl transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
            >
              Crear cuenta gratis
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-gray-300 font-medium px-6 py-3 rounded-xl transition-colors"
            >
              <Play className="w-4 h-4" />
              Ver demo
            </button>
          </div>
        </div>
      </section>

      {/* ── Terminal demo ── */}
      <section className="pb-20 px-6">
        <div className="max-w-2xl mx-auto">
          <TerminalDemo />
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Todo lo que necesitas</h2>
            <p className="text-gray-500">Un entorno completo para construir con IA, sin salir del navegador.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className={`border rounded-xl p-5 ${f.bg} transition-all hover:scale-[1.02]`}
              >
                <f.icon className={`w-6 h-6 ${f.color} mb-3`} />
                <h3 className="text-white font-semibold text-sm mb-1.5">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Models strip ── */}
      <section className="py-14 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">Compatible con los mejores modelos</p>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { name: "OpenAI GPT-4o", color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5" },
              { name: "Claude Sonnet", color: "text-orange-400 border-orange-500/20 bg-orange-500/5" },
              { name: "Gemini 2.5", color: "text-sky-400 border-sky-500/20 bg-sky-500/5" },
              { name: "Grok (xAI)", color: "text-gray-300 border-white/10 bg-white/5" },
              { name: "DeepSeek", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
              { name: "Mistral", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
              { name: "Groq", color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5" },
              { name: "OpenRouter", color: "text-pink-400 border-pink-500/20 bg-pink-500/5" },
            ].map(m => (
              <span key={m.name} className={`text-xs font-medium px-3 py-1.5 rounded-full border ${m.color}`}>
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 border-t border-white/[0.04]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Cómo funciona</h2>
            <p className="text-gray-500">De cero a app en minutos.</p>
          </div>

          <div className="space-y-4">
            {[
              { n: "01", title: "Crea tu cuenta", desc: "Regístrate gratis. Sin tarjeta de crédito." },
              { n: "02", title: "Agrega tus API keys", desc: "Conecta OpenAI, Anthropic, Google u otros. Tus keys, tu control." },
              { n: "03", title: "Crea un proyecto", desc: "Dale un nombre y describe lo que quieres construir." },
              { n: "04", title: "Habla con la IA", desc: "Describe tu app, pide cambios, itera. La IA escribe el código por ti." },
              { n: "05", title: "Ve el resultado", desc: "Preview en vivo. Descarga o conecta a tu repositorio Git." },
            ].map((step) => (
              <div key={step.n} className="flex gap-5 items-start bg-white/[0.02] border border-white/[0.05] rounded-xl p-5">
                <span className="text-2xl font-bold text-indigo-500/40 font-mono shrink-0">{step.n}</span>
                <div>
                  <div className="text-white font-semibold text-sm mb-1">{step.title}</div>
                  <div className="text-gray-500 text-sm">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-14 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 rounded-2xl p-8 flex flex-col sm:flex-row items-center gap-6">
            <Shield className="w-12 h-12 text-indigo-400 shrink-0" />
            <div>
              <h3 className="text-white font-bold text-lg mb-2">Tus datos, seguros</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Las API keys se almacenan encriptadas con AES-256. Cada usuario tiene su propio espacio aislado.
                Nunca compartimos tus credenciales con terceros.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-2xl mx-auto text-center">
          <Layers className="w-10 h-10 text-indigo-400 mx-auto mb-5" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Empieza a construir hoy
          </h2>
          <p className="text-gray-500 mb-8">
            Únete y crea tu primer proyecto con IA en menos de 5 minutos.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all hover:scale-105 shadow-xl shadow-indigo-500/20"
          >
            Crear cuenta gratis
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.04] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Terminal className="w-4 h-4" />
            <span>OpenCode — Entorno de desarrollo con IA</span>
          </div>
          <div className="flex items-center gap-1 text-gray-700 text-xs">
            <Star className="w-3 h-3" />
            <span>Construido con OpenCode AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
