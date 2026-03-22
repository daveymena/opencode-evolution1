import React from 'react';
import { useIde } from '@/contexts/IdeContext';
import { Button } from '@/components/ui/Button';
import { useGetProject, useGetOpenCodeStatus } from '@workspace/api-client-react';
import { Terminal, LayoutPanelLeft, Play, Settings, Bot, Eye, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

export function Toolbar() {
  const { activeProjectId, activeFileId, isChatOpen, setIsChatOpen, isPreviewOpen, setIsPreviewOpen } = useIde();
  const { data: project } = useGetProject(activeProjectId || 0, { query: { enabled: !!activeProjectId } });
  const { data: opencodeStatus } = useGetOpenCodeStatus({ query: { refetchInterval: 10000 } });

  return (
    <div className="h-12 border-b border-ide-border bg-ide-panel flex items-center justify-between px-4 shrink-0 shadow-sm z-10 relative">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-primary hover:text-primary/80 transition-colors">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
              <Terminal className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="font-bold text-sm tracking-wide hidden sm:inline-block">OPENCODE</span>
          </div>
        </Link>

        {project && (
          <>
            <div className="h-4 w-px bg-border mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{project.name}</span>
              {project.language && (
                <span className="text-xs px-1.5 py-0.5 rounded-sm bg-muted text-muted-foreground border border-border">
                  {project.language}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* OpenCode Status */}
        <div className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-black/20 border border-border mr-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            opencodeStatus?.available ? "bg-green-500 animate-pulse" : "bg-red-500"
          )} />
          <span className="text-muted-foreground hidden sm:inline-block">
            {opencodeStatus?.available ? 'AI Ready' : 'AI Offline'}
          </span>
        </div>

        {activeFileId && (
          <Button variant="ghost" size="sm" className="gap-2 h-8" title="Save File (Ctrl+S)">
            <Save className="w-4 h-4" />
            <span className="hidden md:inline-block">Save</span>
          </Button>
        )}

        <Button 
          variant="glow" 
          size="sm" 
          className="gap-2 h-8 mx-2"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden md:inline-block">Run</span>
        </Button>

        <div className="h-4 w-px bg-border mx-1" />

        <Button 
          variant={isChatOpen ? "secondary" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setIsChatOpen(!isChatOpen)}
          title="Toggle AI Chat"
        >
          <Bot className="w-4 h-4" />
        </Button>
        
        <Button 
          variant={isPreviewOpen ? "secondary" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
          onClick={() => setIsPreviewOpen(!isPreviewOpen)}
          title="Toggle Preview"
        >
          <Eye className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8 ml-2">
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
