import React, { useState } from 'react';
import { useListProjects, useCreateProject, getListProjectsQueryKey, useDeleteProject } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Terminal, Plus, FolderGit2, Trash2, Clock, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { formatDistanceToNow } from 'date-fns';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { data: projects = [], isLoading } = useListProjects({ 
    query: { 
      queryKey: getListProjectsQueryKey() 
    } 
  });
  
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '', language: '' });

  const createProjectMutation = useCreateProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setIsNewProjectModalOpen(false);
        setNewProject({ name: '', description: '', language: '' });
      }
    }
  });

  const deleteProjectMutation = useDeleteProject({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      }
    }
  });

  const handleCreate = () => {
    if (!newProject.name.trim()) return;
    createProjectMutation.mutate({ data: newProject });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-sans selection:bg-primary/30">
      {/* Decorative Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-accent/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiIvPjwvc3ZnPg==')] opacity-50" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <header className="flex justify-between items-end mb-16">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/30">
                <Terminal className="w-6 h-6 text-black" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                OpenCode Evolved
              </h1>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Your AI-powered cloud development environment. Manage your projects and let the agent assist you in writing flawless code.
            </p>
          </div>
          
          <Button 
            size="lg" 
            variant="glow"
            className="gap-2 rounded-xl font-semibold px-6"
            onClick={() => setIsNewProjectModalOpen(true)}
          >
            <Plus className="w-5 h-5" />
            New Project
          </Button>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 px-4 border-2 border-dashed border-white/10 rounded-3xl bg-black/20 backdrop-blur-sm">
            <FolderGit2 className="w-20 h-20 text-muted-foreground mb-6 opacity-50" />
            <h3 className="text-2xl font-bold text-foreground mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-8 max-w-md text-center">
              Create your first project to start coding with the integrated AI assistant.
            </p>
            <Button size="lg" variant="glow" onClick={() => setIsNewProjectModalOpen(true)}>
              Create First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div 
                key={project.id} 
                className="group relative bg-card/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-card hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 overflow-hidden"
              >
                {/* Card Top Highlight */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <button 
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      e.preventDefault();
                      if(confirm(`Are you sure you want to delete ${project.name}?`)) {
                        deleteProjectMutation.mutate({ id: project.id });
                      }
                    }}
                    className="p-2 -mr-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-md hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <Link href={`/project/${project.id}`} className="block focus:outline-none">
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6 line-clamp-2 h-10">
                    {project.description || "No description provided."}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDistanceToNow(new Date(project.updatedAt))} ago</span>
                    </div>
                    {project.language && (
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10 font-mono">
                        {project.language}
                      </span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-2xl">Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Project Name</label>
              <Input 
                autoFocus
                placeholder="e.g. awesome-app" 
                value={newProject.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({...newProject, name: e.target.value})}
                className="bg-black/50 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Language / Framework</label>
              <Input 
                placeholder="e.g. React, Node.js, Python" 
                value={newProject.language}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProject({...newProject, language: e.target.value})}
                className="bg-black/50 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description (Optional)</label>
              <Textarea 
                placeholder="What is this project about?" 
                value={newProject.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewProject({...newProject, description: e.target.value})}
                className="bg-black/50 border-zinc-800 resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsNewProjectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="glow"
              onClick={handleCreate} 
              disabled={!newProject.name.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
