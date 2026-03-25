import React, { useRef, useEffect } from 'react';
import { useIde } from '@/contexts/IdeContext';
import Editor, { useMonaco } from '@monaco-editor/react';
import { X, Code2, Play } from 'lucide-react';
import { cn, getFileLanguage } from '@/lib/utils';
import { useUpdateFile } from '@workspace/api-client-react';

export function EditorArea() {
  const { openFiles, activeFileId, setActiveFileId, closeFile, updateFileContent, activeProjectId } = useIde();
  const monaco = useMonaco();
  
  const updateFileMutation = useUpdateFile();
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (monaco) {
      monaco.editor.defineTheme('opencode-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: '', background: '#0A0A0A' }
        ],
        colors: {
          'editor.background': '#0A0A0A',
          'editor.lineHighlightBackground': '#ffffff08',
          'editorLineNumber.foreground': '#4b5563',
          'editorIndentGuide.background': '#ffffff05',
          'editorSuggestWidget.background': '#111827',
          'editorSuggestWidget.border': '#374151',
        }
      });
      monaco.editor.setTheme('opencode-dark');
    }
  }, [monaco]);

  const activeFile = openFiles.find(f => f.id === activeFileId);

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined || !activeFile || !activeProjectId) return;
    updateFileContent(activeFile.id, value);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateFileMutation.mutate({
        projectId: activeProjectId,
        fileId: activeFile.id,
        data: { content: value }
      });
    }, 1000);
  };

  if (openFiles.length === 0) {
    return (
      <div className="h-full w-full bg-[#0A0A0A] flex flex-col items-center justify-center text-gray-500 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none" />
        <div className="w-24 h-24 mb-6 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 shadow-[0_0_50px_rgba(255,255,255,0.02)] backdrop-blur-xl">
          <Code2 className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-200 mb-2 font-sans tracking-tight">Editor Inactivo</h2>
        <p className="text-sm max-w-sm text-center opacity-70">
          Abre un archivo desde la IA o el explorador para comenzar a editar.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#0A0A0A]">
      {/* Tab Bar */}
      <div className="flex overflow-x-auto bg-[#050505] border-b border-white/5 hide-scrollbar h-12 shrink-0 items-end px-2 gap-1 relative z-10">
        {openFiles.map(file => (
          <div
            key={file.id}
            className={cn(
              "group flex items-center justify-between gap-3 px-4 py-2.5 rounded-t-xl cursor-pointer min-w-[140px] max-w-[200px] transition-all relative border border-b-0",
              activeFileId === file.id 
                ? "bg-[#0A0A0A] text-indigo-100 border-white/10 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] z-10" 
                : "bg-transparent text-gray-500 hover:bg-white/5 hover:text-gray-300 border-transparent z-0"
            )}
            onClick={() => setActiveFileId(file.id)}
          >
            {activeFileId === file.id && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-indigo-500 rounded-b-md shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            )}
            <span className="truncate text-sm font-medium">{file.name}</span>
            <button 
              className={cn(
                "p-1 rounded-md transition-colors",
                activeFileId === file.id ? "opacity-100 hover:bg-white/10 text-gray-400" : "opacity-0 group-hover:opacity-100 hover:bg-white/10"
              )}
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.id);
              }}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 relative bg-[#0A0A0A]">
        {activeFile ? (
          <div className="absolute inset-0 pt-2">
            <Editor
              height="100%"
              language={getFileLanguage(activeFile.name)}
              value={activeFile.content}
              onChange={handleEditorChange}
              theme="opencode-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                fontLigatures: true,
                wordWrap: 'on',
                padding: { top: 16, bottom: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: 'smooth',
                renderLineHighlight: 'all',
                contextmenu: false,
                overviewRulerLanes: 0,
                hideCursorInOverviewRuler: true,
              }}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
