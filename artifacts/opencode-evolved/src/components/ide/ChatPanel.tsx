import React, { useState, useRef, useEffect } from 'react';
import { useIde } from '@/contexts/IdeContext';
import { useListMessages, useSendMessage, getListMessagesQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export function ChatPanel() {
  const { activeProjectId } = useIde();
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], isLoading } = useListMessages(activeProjectId || 0, { 
    query: { enabled: !!activeProjectId, refetchInterval: 3000 } // Poll for updates as simple fallback to WS
  });

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(activeProjectId || 0) });
        setInput('');
      }
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || !activeProjectId) return;
    
    sendMessageMutation.mutate({
      projectId: activeProjectId,
      data: { content: input }
    });
  };

  if (!activeProjectId) return null;

  return (
    <div className="h-full bg-ide-panel border-t border-ide-border flex flex-col relative">
      <div className="h-10 border-b border-ide-border flex items-center px-4 shrink-0 bg-ide-panel/50 backdrop-blur">
        <div className="flex items-center gap-2 text-primary font-medium text-sm">
          <Sparkles className="w-4 h-4" />
          <span>OpenCode AI</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-60">
            <Bot className="w-12 h-12 mb-4 text-primary" />
            <h3 className="text-lg font-semibold text-foreground mb-2">How can I help?</h3>
            <p className="text-sm text-muted-foreground">
              I can help you write code, debug issues, explain complex logic, or set up new files in this project.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={cn(
                "flex gap-3 text-sm",
                msg.role === 'user' ? "flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-accent/20 text-accent border border-accent/30"
              )}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-black/30 border border-white/5 text-foreground rounded-tl-sm whitespace-pre-wrap font-mono text-xs leading-relaxed"
              )}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sendMessageMutation.isPending && (
          <div className="flex gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center justify-center shrink-0">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-black/30 border border-white/5 text-muted-foreground rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <span className="animate-pulse">Thinking</span>
              <span className="flex gap-1">
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-ide-bg border-t border-ide-border">
        <form onSubmit={handleSend} className="relative flex items-center">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask OpenCode anything... (Press Enter to send)"
            className="w-full bg-black/40 border border-ide-border rounded-xl pl-4 pr-12 py-3 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all resize-none h-[44px] max-h-[120px] hide-scrollbar"
            rows={1}
          />
          <Button 
            type="submit" 
            size="icon" 
            variant="ghost"
            disabled={!input.trim() || sendMessageMutation.isPending}
            className="absolute right-1.5 h-8 w-8 text-primary hover:text-primary hover:bg-primary/20"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
