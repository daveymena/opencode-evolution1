import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { ProjectFile } from '@workspace/api-client-react';

interface IdeState {
  activeProjectId: number | null;
  setActiveProjectId: (id: number | null) => void;
  openFiles: ProjectFile[];
  activeFileId: number | null;
  openFile: (file: ProjectFile) => void;
  closeFile: (fileId: number) => void;
  setActiveFileId: (id: number | null) => void;
  updateFileContent: (fileId: number, content: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  isPreviewOpen: boolean;
  setIsPreviewOpen: (open: boolean) => void;
}

const IdeContext = createContext<IdeState | undefined>(undefined);

export function IdeProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const openFile = useCallback((file: ProjectFile) => {
    setOpenFiles((prev) => {
      if (!prev.find((f) => f.id === file.id)) {
        return [...prev, file];
      }
      return prev;
    });
    setActiveFileId(file.id);
  }, []);

  const closeFile = useCallback((fileId: number) => {
    setOpenFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== fileId);
      if (activeFileId === fileId) {
        setActiveFileId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  }, [activeFileId]);

  const updateFileContent = useCallback((fileId: number, content: string) => {
    setOpenFiles((prev) => 
      prev.map((f) => f.id === fileId ? { ...f, content } : f)
    );
  }, []);

  return (
    <IdeContext.Provider
      value={{
        activeProjectId,
        setActiveProjectId,
        openFiles,
        activeFileId,
        openFile,
        closeFile,
        setActiveFileId,
        updateFileContent,
        isChatOpen,
        setIsChatOpen,
        isPreviewOpen,
        setIsPreviewOpen,
      }}
    >
      {children}
    </IdeContext.Provider>
  );
}

export function useIde() {
  const context = useContext(IdeContext);
  if (context === undefined) {
    throw new Error('useIde must be used within an IdeProvider');
  }
  return context;
}
