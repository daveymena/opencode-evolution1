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
import { Sparkles, Zap, Brain, Globe } from 'lucide-react';

interface ModelSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const models = [
  { id: 'mi-mo', name: 'MiMo (Zen)', icon: Zap, category: 'Zen (Gratis)', description: 'Rápido y eficiente' },
  { id: 'nemotron', name: 'Nemotron (Zen)', icon: Brain, category: 'Zen (Gratis)', description: 'Lógica y código' },
  { id: 'minimax', name: 'MiniMax (Zen)', icon: Globe, category: 'Zen (Gratis)', description: 'Creatividad' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', icon: Sparkles, category: 'Premium', description: 'Máximo poder' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', icon: Sparkles, category: 'Premium', description: 'Razonamiento humano' },
];

export function ModelSelector({ value, onValueChange }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 ml-1">
        Modelo de IA
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white focus:ring-indigo-500 focus:border-indigo-500/50 rounded-xl">
          <SelectValue placeholder="Selecciona un modelo" />
        </SelectTrigger>
        <SelectContent className="bg-[#0A0A0A] border-white/10 text-white rounded-2xl shadow-2xl backdrop-blur-3xl">
          <SelectGroup>
            <SelectLabel className="text-gray-500 text-[10px] uppercase tracking-widest px-2 py-2">Zen (Nativos Gratuitos)</SelectLabel>
            {models.filter(m => m.category === 'Zen (Gratis)').map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className="focus:bg-indigo-500/10 focus:text-indigo-400 rounded-lg m-1 transition-colors"
              >
                <div className="flex items-center gap-3 py-1">
                  <model.icon className="w-4 h-4 text-indigo-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{model.name}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{model.description}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="text-gray-500 text-[10px] uppercase tracking-widest px-2 py-3 border-t border-white/5 mt-2">Premium (Requiere API Key)</SelectLabel>
            {models.filter(m => m.category === 'Premium').map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className="focus:bg-purple-500/10 focus:text-purple-400 rounded-lg m-1 transition-colors"
              >
                <div className="flex items-center gap-3 py-1">
                  <model.icon className="w-4 h-4 text-purple-400" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{model.name}</span>
                    <span className="text-[10px] text-gray-500 font-normal">{model.description}</span>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
