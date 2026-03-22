import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowUp, Paperclip, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim());
      setContent('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 250)}px`;
    }
  };

  return (
    <div className="relative flex w-full max-w-4xl mx-auto shadow-2xl shadow-indigo-500/5">
      <div className="flex w-full items-end gap-2 bg-[#1A1A1A]/80 backdrop-blur-2xl p-2.5 rounded-3xl border border-white/10 focus-within:border-indigo-500/50 focus-within:bg-[#1A1A1A] transition-all duration-300">
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-2xl mb-0.5 ml-1 transition-colors"
          disabled={disabled}
        >
          <Paperclip className="h-5 w-5" />
        </Button>

        <Textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="¿Qué quieres construir hoy?"
          className="min-h-[44px] max-h-[250px] w-full resize-none bg-transparent border-0 focus-visible:ring-0 px-2 py-3 text-[15px] leading-relaxed shadow-none text-white placeholder:text-gray-500 selection:bg-indigo-500/30"
          disabled={disabled}
          rows={1}
        />

        <AnimatePresence>
          {!content.trim() ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.15 }}
              key="mic"
            >
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-2xl mb-0.5 mr-1"
                disabled={disabled}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              key="send"
            >
              <Button 
                onClick={handleSend}
                disabled={disabled}
                size="icon"
                className="h-10 w-10 shrink-0 rounded-2xl mb-0.5 mr-1 bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all"
              >
                <ArrowUp className="h-5 w-5 stroke-[2.5px]" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
