import React, { useState } from 'react';
import { useIde } from '@/contexts/IdeContext';
import { useListFiles, useCreateFile, getListFilesQueryKey, useDeleteFile } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { File, FileText, FileCode2, FileJson, Plus, Folder, Search, Trash2, Edit2 } from 'lucide-react';
import { getFileIcon, cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function Sidebar() {
  const { activeProjectId, openFile, activeFileId } = useIde();
  const queryClient = useQueryClient();
  const { data: files = [], isLoading } = useListFiles(activeProjectId || 0, { query: { enabled: !!activeProjectId } });
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const createFileMutation = useCreateFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(activeProjectId || 0) });
        setIsCreateModalOpen(false);
        setNewFileName('');
      }
    }
  });

  const deleteFileMutation = useDeleteFile({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListFilesQueryKey(activeProjectId || 0) });
      }
    }
  });

  const handleCreateFile = () => {
    if (!activeProjectId || !newFileName.trim()) return;
    createFileMutation.mutate({
      projectId: activeProjectId,
      data: {
        name: newFileName,
        path: `/${newFileName}`,
        content: `// New file: ${newFileName}\n`,
      }
    });
  };

  const getIconComponent = (type: string) => {
    switch(type) {
      case 'code': return <FileCode2 className="w-4 h-4 text-primary" />;
      case 'layout': return <File className="w-4 h-4 text-orange-400" />;
      case 'database': return <FileJson className="w-4 h-4 text-green-400" />;
      case 'file-text': return <FileText className="w-4 h-4 text-blue-400" />;
      default: return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (!activeProjectId) {
    return (
      <div className="h-full bg-ide-panel flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <Folder className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-sm">No project selected</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-ide-panel flex flex-col border-r border-ide-border">
      <div className="p-3 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <span>Explorer</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-3.5 h-3.5" />
        </Button>
      </div>
      
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search files..." 
            className="w-full bg-black/20 border border-border rounded-md pl-7 pr-2 py-1 text-xs text-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-4 py-2 text-xs text-muted-foreground">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="px-4 py-6 text-center text-xs text-muted-foreground">
            No files yet. Click + to create one.
          </div>
        ) : (
          <div className="flex flex-col space-y-0.5 px-1">
            {files.map((file) => (
              <div 
                key={file.id}
                className={cn(
                  "group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer text-sm transition-colors",
                  activeFileId === file.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
                onClick={() => openFile(file)}
              >
                <div className="flex items-center gap-2 truncate">
                  {getIconComponent(getFileIcon(file.name))}
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="p-1 hover:bg-white/10 rounded text-muted-foreground hover:text-destructive transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if(confirm(`Delete ${file.name}?`)) {
                        deleteFileMutation.mutate({ projectId: activeProjectId, fileId: file.id });
                      }
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New File</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input 
              autoFocus
              placeholder="e.g. index.html, utils.ts, styles.css" 
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') handleCreateFile();
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleCreateFile} 
              disabled={!newFileName.trim() || createFileMutation.isPending}
            >
              {createFileMutation.isPending ? 'Creating...' : 'Create File'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
