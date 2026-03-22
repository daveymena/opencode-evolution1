import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Sparkles, Zap, Brain, Globe, Star, Cpu } from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const models = [
  // Gratuitos / Zen
  { id: 'mi-mo',           name: 'MiMo',              icon: Zap,      category: 'free', description: 'Rápido y eficiente' },
  { id: 'nemotron',        name: 'Nemotron',           icon: Brain,    category: 'free', description: 'Lógica y código' },
  { id: 'minimax',         name: 'MiniMax',            icon: Globe,    category: 'free', description: 'Creatividad' },
  { id: 'llama-3.1-8b',   name: 'Llama 3.1 8B',      icon: Brain,    category: 'free', description: 'Versátil y libre' },
  { id: 'qwen-2.5-72b',   name: 'Qwen 2.5 72B',      icon: Zap,      category: 'free', description: 'Potente y preciso' },
  { id: 'gemini-1.5-flash',name: 'Gemini 1.5 Flash',  icon: Sparkles, category: 'free', description: 'Multimodal rápido' },

  // OpenAI
  { id: 'openai/gpt-4o',              name: 'GPT-4o',              icon: Sparkles, category: 'openai',    description: 'Máximo poder multimodal' },
  { id: 'openai/gpt-4o-mini',         name: 'GPT-4o Mini',         icon: Zap,      category: 'openai',    description: 'Rápido y económico' },
  { id: 'openai/o1',                  name: 'o1',                  icon: Brain,    category: 'openai',    description: 'Razonamiento profundo' },
  { id: 'openai/o3-mini',             name: 'o3 Mini',             icon: Zap,      category: 'openai',    description: 'Razonamiento eficiente' },

  // Anthropic
  { id: 'anthropic/claude-opus-4-5',      name: 'Claude Opus 4.5',      icon: Star,     category: 'anthropic', description: 'El más potente de Anthropic' },
  { id: 'anthropic/claude-sonnet-4-5',    name: 'Claude Sonnet 4.5',    icon: Sparkles, category: 'anthropic', description: 'Balance perfecto' },
  { id: 'anthropic/claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', icon: Sparkles, category: 'anthropic', description: 'Razonamiento humano' },
  { id: 'anthropic/claude-3-5-haiku-20241022',  name: 'Claude 3.5 Haiku',  icon: Zap,      category: 'anthropic', description: 'Rápido y preciso' },

  // Google
  { id: 'google/gemini-2.5-pro',      name: 'Gemini 2.5 Pro',      icon: Sparkles, category: 'google',    description: 'Multimodal avanzado' },
  { id: 'google/gemini-2.5-flash',    name: 'Gemini 2.5 Flash',    icon: Zap,      category: 'google',    description: 'Ultra rápido' },
  { id: 'google/gemini-1.5-pro',      name: 'Gemini 1.5 Pro',      icon: Brain,    category: 'google',    description: 'Contexto largo' },

  // xAI
  { id: 'xai/grok-3',                 name: 'Grok 3',              icon: Brain,    category: 'xai',       description: 'Razonamiento avanzado' },
  { id: 'xai/grok-3-mini',            name: 'Grok 3 Mini',         icon: Zap,      category: 'xai',       description: 'Rápido y eficiente' },

  // DeepSeek
  { id: 'deepseek/deepseek-r1',       name: 'DeepSeek R1',         icon: Brain,    category: 'deepseek',  description: 'Razonamiento open-source' },
  { id: 'deepseek/deepseek-chat',     name: 'DeepSeek Chat',       icon: Cpu,      category: 'deepseek',  description: 'Chat general potente' },

  // Mistral
  { id: 'mistral/mistral-large-latest', name: 'Mistral Large',     icon: Brain,    category: 'mistral',   description: 'Potente y europeo' },
  { id: 'mistral/codestral-latest',     name: 'Codestral',         icon: Cpu,      category: 'mistral',   description: 'Especializado en código' },
];

const groups = [
  { key: 'free',      label: 'Zen — Gratuitos',        color: 'text-emerald-400' },
  { key: 'openai',    label: 'OpenAI',                  color: 'text-green-400' },
  { key: 'anthropic', label: 'Anthropic',               color: 'text-orange-400' },
  { key: 'google',    label: 'Google',                  color: 'text-blue-400' },
  { key: 'xai',       label: 'xAI (Grok)',              color: 'text-gray-300' },
  { key: 'deepseek',  label: 'DeepSeek',                color: 'text-cyan-400' },
  { key: 'mistral',   label: 'Mistral',                 color: 'text-purple-400' },
];

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  const selected = models.find(m => m.id === value);

  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 ml-1">
        Modelo de IA
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white focus:ring-indigo-500 focus:border-indigo-500/50 rounded-xl">
          <SelectValue placeholder="Selecciona un modelo">
            {selected && (
              <div className="flex items-center gap-2">
                <selected.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{selected.name}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#0A0A0A] border-white/10 text-white rounded-2xl shadow-2xl max-h-[420px] overflow-y-auto">
          {groups.map((group, i) => (
            <SelectGroup key={group.key}>
              <SelectLabel className={`text-[10px] uppercase tracking-widest px-2 py-2 ${i > 0 ? 'border-t border-white/5 mt-1 pt-3' : ''} ${group.color}`}>
                {group.label}
              </SelectLabel>
              {models.filter(m => m.category === group.key).map((model) => (
                <SelectItem
                  key={model.id}
                  value={model.id}
                  className="focus:bg-indigo-500/10 focus:text-indigo-400 rounded-lg m-1 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 py-0.5">
                    <model.icon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{model.name}</span>
                      <span className="text-[10px] text-gray-500 font-normal">{model.description}</span>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
