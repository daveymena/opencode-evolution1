import React, { useState } from 'react';
import { useListProjects, useCreateProject, getListProjectsQueryKey, useDeleteProject } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare, Trash2, Hexagon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ModelSelector } from './ModelSelector';

interface ProjectSidebarProps {
  activeProjectId?: number;
  onSelectProject: (id: number) => void;
}

export function ProjectSidebar({ activeProjectId, onSelectProject }: ProjectSidebarProps) {
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useListProjects();
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedModel, setSelectedModel] = useState('mi-mo');

  const createProjectMutation = useCreateProject({
    mutation: {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsNewProjectModalOpen(false);
        setNewProjectName('');
        setSelectedModel('mi-mo');
        onSelectProject(data.id);
      }
    }
  });

  const deleteProjectMutation = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        if (activeProjectId) {
          onSelectProject(0);
        }
      }
    }
  });

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    createProjectMutation.mutate({ 
      data: { 
        name: newProjectName,
        model: selectedModel
      } 
    });
  };

  return (
    <div className="w-[280px] flex-shrink-0 bg-[#050505] border-r border-white/5 flex flex-col h-screen text-gray-300">
      <div className="h-16 px-6 flex items-center gap-3 text-white font-semibold border-b border-white/5 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Hexagon className="w-4 h-4 text-white" />
        </div>
        <span className="tracking-tight text-lg">OpenCode <span className="text-indigo-400">Evo</span></span>
      </div>
      
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-3 h-11 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-gray-300 hover:text-white transition-all rounded-xl shadow-none"
          onClick={() => setIsNewProjectModalOpen(true)}
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium">Nuevo Proyecto</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1 no-scrollbar">
        <div className="text-xs font-semibold tracking-wider text-gray-500 mb-4 px-2 uppercase">Proyectos</div>
        
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-sm text-gray-500 px-2 py-8 text-center bg-white/[0.02] rounded-xl border border-white/5">
            Comienza tu primer proyecto
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id}
              className={`group flex items-center justify-between w-full p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                activeProjectId === project.id 
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                  : 'hover:bg-white/[0.04] text-gray-300 border border-transparent'
              }`}
              onClick={() => onSelectProject(project.id)}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`p-1.5 rounded-md ${activeProjectId === project.id ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-gray-400'}`}>
                   <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className={`text-[13px] font-medium truncate ${activeProjectId === project.id ? 'text-indigo-100' : 'text-gray-200'}`}>
                    {project.name}
                  </span>
                  <span className="text-[11px] text-gray-500 truncate mt-0.5 font-medium">
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true, locale: es })}
                  </span>
                </div>
              </div>
              <button
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`¿Eliminar proyecto ${project.name}?`)) {
                    deleteProjectMutation.mutate({ id: project.id });
                  }
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0A0A0A] border-white/10 text-white pb-6 pt-8 px-8 rounded-3xl backdrop-blur-3xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-semibold tracking-tight">Nuevo Proyecto</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input 
              autoFocus
              placeholder="¿Cómo se llama tu proyecto?" 
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
              }}
              className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:border-indigo-500/50 rounded-xl text-[15px]"
            />
          </div>
          <div className="py-2 mb-2">
            <ModelSelector value={selectedModel} onValueChange={setSelectedModel} />
          </div>
          <DialogFooter className="mt-6 flex gap-3">
            <Button variant="ghost" className="hover:bg-white/5 text-gray-400 hover:text-white rounded-xl h-11" onClick={() => setIsNewProjectModalOpen(false)}>Cancelar</Button>
            <Button 
              onClick={handleCreate} 
              disabled={!newProjectName.trim() || createProjectMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl h-11 px-6 shadow-lg shadow-indigo-500/20"
            >
              {createProjectMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Crear Proyecto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
