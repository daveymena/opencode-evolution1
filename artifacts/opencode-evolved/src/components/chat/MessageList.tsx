import React, { useEffect, useRef } from 'react';
import { Terminal, User, Sparkles, Copy, Check } from 'lucide-react';
import { Message } from '@workspace/api-client-react';
import { motion } from 'framer-motion';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

const CodeBlock = ({ code, language = 'Code' }: { code: string, language?: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-5 rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/10 shadow-xl group">
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/5 border-b border-white/5">
        <div className="flex items-center text-xs font-medium text-gray-400">
          <Terminal className="w-3.5 h-3.5 mr-2 text-indigo-400" />
          {language}
        </div>
        <button 
          onClick={handleCopy}
          className="text-gray-500 hover:text-white transition-colors p-1.5 rounded-md hover:bg-white/10 opacity-0 group-hover:opacity-100"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-[13px] leading-relaxed font-mono text-gray-300">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const renderContent = (content: string) => {
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/^```(\w+)?\n([\s\S]*?)```$/);
      const language = match && match[1] ? match[1] : 'text';
      const code = match ? match[2] : part.slice(3, -3);
      return <CodeBlock key={index} code={code.trim()} language={language} />;
    }
    
    if (!part.trim()) return null;

    return (
      <span key={index} className="whitespace-pre-wrap">
        {part}
      </span>
    );
  });
};

export function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full flex flex-col scroll-smooth">
      <div className="w-full max-w-4xl mx-auto flex flex-col space-y-8">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          return (
            <motion.div 
              key={msg.id || idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex gap-5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-lg
                ${isUser 
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' 
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20'}`}
              >
                {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
              </div>
              
              <div className={`max-w-[85%] ${isUser ? 'bg-indigo-500/10 border border-indigo-500/20 px-6 py-4 rounded-3xl rounded-tr-sm text-gray-100' : 'text-gray-200 mt-2'}`}>
                <div className="leading-relaxed prose prose-invert prose-p:leading-relaxed prose-pre:my-0 max-w-none text-[15px]">
                  {renderContent(msg.content)}
                </div>
              </div>
            </motion.div>
          );
        })}
        
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-5 flex-row"
          >
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-1 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-2 h-12 px-4 mt-1 bg-white/5 rounded-2xl rounded-tl-sm border border-white/10 w-fit">
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 rounded-full bg-indigo-400"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 rounded-full bg-indigo-400"></motion.div>
              <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 rounded-full bg-indigo-400"></motion.div>
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
