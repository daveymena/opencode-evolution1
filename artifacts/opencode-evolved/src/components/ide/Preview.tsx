import React, { useEffect, useState, useMemo } from 'react';
import { useIde } from '@/contexts/IdeContext';
import { Globe, ExternalLink, RefreshCw, TerminalSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Preview() {
  const { openFiles, activeFileId } = useIde();
  const [refreshKey, setRefreshKey] = useState(0);
  
  const activeFile = openFiles.find(f => f.id === activeFileId);
  const isWebFile = activeFile?.name.match(/\.(html|css|js)$/i);

  const previewHtml = useMemo(() => {
    if (!activeFile) return '';
    if (activeFile.name.endsWith('.html')) {
      if (activeFile.content.includes('</body>')) return activeFile.content;
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>body { font-family: system-ui, sans-serif; color: #fff; background: #000; padding: 1.5rem; }</style>
          </head>
          <body>
            ${activeFile.content}
          </body>
        </html>
      `;
    }
    return '';
  }, [activeFile?.content, activeFile?.name, refreshKey]);

  if (!activeFile) {
    return (
      <div className="h-full bg-[#050505] border-l border-white/5 flex flex-col items-center justify-center text-gray-500 p-6 text-center shadow-inner">
        <Globe className="w-12 h-12 mb-4 opacity-20 text-indigo-400" />
        <p className="font-medium text-sm">Vista Previa Inactiva</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#0A0A0A] flex flex-col border-l border-white/5 relative overflow-hidden">
      {/* Header toolbar */}
      <div className="h-12 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
          <span className="text-[13px] font-semibold text-gray-300 tracking-wide font-mono flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-400" />
            localhost:3000
          </span>
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/5">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10 rounded-md" onClick={() => setRefreshKey(k => k + 1)}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white hover:bg-white/10 rounded-md">
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 bg-white relative">
        {isWebFile ? (
          <iframe 
            key={refreshKey}
            srcDoc={previewHtml}
            className="w-full h-full border-none bg-white"
            title="Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full bg-[#0A0A0A] text-gray-300 p-6 font-mono text-sm overflow-auto">
            <div className="flex items-center gap-3 opacity-50 mb-6 bg-white/5 p-3 rounded-lg border border-white/10">
              <TerminalSquare className="w-5 h-5" />
              <span>Terminal / Salida</span>
            </div>
            <pre className="text-emerald-400/90 leading-relaxed">
              <span className="text-indigo-400">~/project $</span> run {activeFile.name}
              {'\n\n'}
              <span className="text-gray-500 italic">La salida del código se mostrará aquí cuando se implemente la ejecución para {activeFile.language || 'este lenguaje'}.</span>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
