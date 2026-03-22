import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Key, Trash2, Plus, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const PROVIDERS = [
  { id: "openai", label: "OpenAI", placeholder: "sk-..." },
  { id: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
  { id: "google", label: "Google AI", placeholder: "AIza..." },
  { id: "xai", label: "xAI (Grok)", placeholder: "xai-..." },
  { id: "deepseek", label: "DeepSeek", placeholder: "sk-..." },
  { id: "mistral", label: "Mistral", placeholder: "..." },
  { id: "groq", label: "Groq", placeholder: "gsk_..." },
  { id: "openrouter", label: "OpenRouter", placeholder: "sk-or-..." },
];

interface ApiKey { id: number; provider: string; keyMasked: string; createdAt: string; }

export default function ApiKeysPage({ onClose }: { onClose: () => void }) {
  const { token } = useAuth();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [keyValue, setKeyValue] = useState("");
  const [loading, setLoading] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchKeys = async () => {
    const res = await fetch(`${API_BASE}/user/api-keys`, { headers });
    if (res.ok) setKeys(await res.json());
  };

  useEffect(() => { fetchKeys(); }, []);

  const saveKey = async (provider: string) => {
    if (!keyValue.trim()) return;
    setLoading(true);
    await fetch(`${API_BASE}/user/api-keys`, {
      method: "POST",
      headers,
      body: JSON.stringify({ provider, key: keyValue.trim() }),
    });
    setAdding(null);
    setKeyValue("");
    await fetchKeys();
    setLoading(false);
  };

  const deleteKey = async (provider: string) => {
    await fetch(`${API_BASE}/user/api-keys/${provider}`, { method: "DELETE", headers });
    await fetchKeys();
  };

  const keyMap = Object.fromEntries(keys.map(k => [k.provider, k]));

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#141414] border border-white/[0.08] rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-medium text-white">Mis API Keys</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {PROVIDERS.map(p => {
            const existing = keyMap[p.id];
            const isAdding = adding === p.id;

            return (
              <div key={p.id} className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">{p.label}</div>
                    {existing && (
                      <div className="text-xs text-gray-500 mt-0.5">{existing.keyMasked}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {existing ? (
                      <>
                        <button
                          onClick={() => { setAdding(p.id); setKeyValue(""); }}
                          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          Cambiar
                        </button>
                        <button
                          onClick={() => deleteKey(p.id)}
                          className="text-gray-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setAdding(p.id); setKeyValue(""); }}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-white transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Agregar
                      </button>
                    )}
                  </div>
                </div>

                {isAdding && (
                  <div className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      type="password"
                      value={keyValue}
                      onChange={e => setKeyValue(e.target.value)}
                      placeholder={p.placeholder}
                      className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
                      onKeyDown={e => e.key === "Enter" && saveKey(p.id)}
                    />
                    <button
                      onClick={() => saveKey(p.id)}
                      disabled={loading}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setAdding(null)}
                      className="text-gray-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/[0.06]">
          <p className="text-xs text-gray-600">Las API keys se almacenan encriptadas y son privadas para tu cuenta.</p>
        </div>
      </div>
    </div>
  );
}
