import React from 'react';
import { Sparkles, Code2, Layout, Database, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface WelcomeScreenProps {
  onExampleClick: (text: string) => void;
}

export function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  const examples = [
    { text: "Crea una app de lista de tareas en React", icon: <Layout className="w-5 h-5" /> },
    { text: "Construye un dashboard de analíticas con Tailwind", icon: <Code2 className="w-5 h-5" /> },
    { text: "Haz un formulario de login con validación", icon: <Zap className="w-5 h-5" /> },
    { text: "Crea una API con Node y PostgreSQL", icon: <Database className="w-5 h-5" /> }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full relative overflow-hidden">
      
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex flex-col items-center z-10"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(99,102,241,0.2)] border border-indigo-500/20 backdrop-blur-xl">
          <Sparkles className="w-10 h-10 text-indigo-400 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
        </div>
        
        <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
          ¿Qué vamos a construir hoy?
        </h2>
        <p className="text-gray-400 max-w-lg mb-12 text-lg leading-relaxed">
          OpenCode Evolved diseñará, escribirá y ejecutará el software por ti. Solo describe lo que imaginas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-3xl">
          {examples.map((example, i) => (
            <motion.button
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              onClick={() => onExampleClick(example.text)}
              className="p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-300 text-left group flex items-center gap-4 hover:shadow-[0_0_30px_rgba(99,102,241,0.1)] hover:-translate-y-1"
            >
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10 transition-colors">
                {example.icon}
              </div>
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors leading-snug">
                {example.text}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
