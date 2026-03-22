import React, { useState, useMemo, useRef } from 'react';
import { useIde } from '@/contexts/IdeContext';
import { Globe, ExternalLink, RefreshCw, ArrowLeft, ArrowRight, X, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Preview() {
  const { openFiles, activeFileId } = useIde();
  const [refreshKey, setRefreshKey] = useState(0);
  const [urlInput, setUrlInput] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeFile = openFiles.find(f => f.id === activeFileId);
  const isWebFile = activeFile?.name.match(/\.(html|css|js)$/i);

  const previewHtml = useMemo(() => {
    if (!activeFile?.name.endsWith('.html')) return '';
    if (activeFile.content.includes('</body>')) return activeFile.content;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><style>body{font-family:system-ui,sans-serif;color:#fff;background:#000;padding:1.5rem}</style></head><body>${activeFile.content}</body></html>`;
  }, [activeFile?.content, activeFile?.name, refreshKey]);

  const navigateTo = (url: string) => {
    let normalized = url.trim();
    if (!normalized) return;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }
    setCurrentUrl(normalized);
    setUrlInput(normalized);
    setHistory(prev => {
      const next = prev.slice(0, historyIndex + 1);
      next.push(normalized);
      setHistoryIndex(next.length - 1);
      return next;
    });
    setRefreshKey(k => k + 1);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setCurrentUrl(history[idx]);
      setUrlInput(history[idx]);
      setRefreshKey(k => k + 1);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setCurrentUrl(history[idx]);
      setUrlInput(history[idx]);
      setRefreshKey(k => k + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') navigateTo(urlInput);
    if (e.key === 'Escape') setUrlInput(currentUrl);
  };

  const isHttps = currentUrl.startsWith('https://');
  const showIframe = currentUrl || (activeFile && isWebFile);

  return (
    <div className="h-full bg-[#0A0A0A] flex flex-col border-l border-white/5 relative overflow-hidden">
      {/* Browser toolbar */}
      <div className="h-12 bg-[#050505]/90 backdrop-blur-md border-b border-white/5 flex items-center gap-2 px-3 z-10 shrink-0">
        {/* Nav buttons */}
        <div className="flex gap-0.5">
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30"
            onClick={goBack}
            disabled={historyIndex <= 0}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-30"
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10 rounded-md"
            onClick={() => setRefreshKey(k => k + 1)}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 h-8 focus-within:border-indigo-500/50 focus-within:bg-white/8 transition-all">
          {currentUrl ? (
            isHttps
              ? <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              : <Globe className="w-3 h-3 text-gray-500 shrink-0" />
          ) : (
            <Globe className="w-3 h-3 text-gray-500 shrink-0" />
          )}
          <input
            type="text"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={e => e.target.select()}
            placeholder="Escribe una URL o abre un archivo HTML..."
            className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 outline-none font-mono"
          />
          {urlInput && (
            <button onClick={() => { setUrlInput(''); setCurrentUrl(''); }} className="text-gray-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Open external */}
        {currentUrl && (
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 text-gray-500 hover:text-white hover:bg-white/10 rounded-md"
            onClick={() => window.open(currentUrl, '_blank')}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {currentUrl ? (
          <iframe
            key={`url-${refreshKey}`}
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-none"
            title="Browser Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        ) : activeFile && isWebFile ? (
          <iframe
            key={`file-${refreshKey}`}
            srcDoc={previewHtml}
            className="w-full h-full border-none"
            title="File Preview"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="h-full bg-[#0A0A0A] flex flex-col items-center justify-center text-gray-500 p-6 text-center">
            <Globe className="w-12 h-12 mb-4 opacity-20 text-indigo-400" />
            <p className="font-medium text-sm text-gray-400">Navegador integrado</p>
            <p className="text-xs text-gray-600 mt-2 max-w-xs">
              Escribe una URL arriba para navegar, o abre un archivo HTML para previsualizarlo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
