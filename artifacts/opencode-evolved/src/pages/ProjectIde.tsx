import React, { useEffect } from 'react';
import { useParams } from 'wouter';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useIde } from '@/contexts/IdeContext';
import { Sidebar } from '@/components/ide/Sidebar';
import { EditorArea } from '@/components/ide/EditorArea';
import { Preview } from '@/components/ide/Preview';
import { ChatPanel } from '@/components/ide/ChatPanel';
import { Toolbar } from '@/components/ide/Toolbar';
import { useGetProject } from '@workspace/api-client-react';

export default function ProjectIde() {
  const { id } = useParams();
  const projectId = parseInt(id || '0', 10);
  const { setActiveProjectId, isChatOpen, isPreviewOpen } = useIde();

  const { data: project, isLoading, error } = useGetProject(projectId, { 
    query: { enabled: !!projectId } 
  });

  useEffect(() => {
    if (projectId) {
      setActiveProjectId(projectId);
    }
    return () => setActiveProjectId(null);
  }, [projectId, setActiveProjectId]);

  if (isLoading) {
    return <div className="h-screen w-screen bg-ide-bg flex items-center justify-center text-primary">Loading Workspace...</div>;
  }

  if (error || !project) {
    return <div className="h-screen w-screen bg-ide-bg flex items-center justify-center text-destructive">Project not found</div>;
  }

  return (
    <div className="h-screen w-screen bg-ide-bg text-foreground flex flex-col overflow-hidden font-sans">
      <Toolbar />
      
      <div className="flex-1 flex overflow-hidden">
        <PanelGroup direction="horizontal">
          
          {/* Sidebar Panel */}
          <Panel defaultSize={20} minSize={15} maxSize={30} className="z-10">
            <Sidebar />
          </Panel>
          
          <PanelResizeHandle className="w-1 bg-ide-border hover:bg-primary/50 transition-colors z-20" />
          
          {/* Center Area (Editor + Chat) */}
          <Panel className="z-0 flex flex-col min-w-[300px]">
            {isChatOpen ? (
              <PanelGroup direction="vertical">
                <Panel defaultSize={70} minSize={30}>
                  <EditorArea />
                </Panel>
                <PanelResizeHandle className="h-1 bg-ide-border hover:bg-primary/50 transition-colors z-20" />
                <Panel defaultSize={30} minSize={20}>
                  <ChatPanel />
                </Panel>
              </PanelGroup>
            ) : (
              <EditorArea />
            )}
          </Panel>

          {/* Right Preview Panel */}
          {isPreviewOpen && (
            <>
              <PanelResizeHandle className="w-1 bg-ide-border hover:bg-primary/50 transition-colors z-20" />
              <Panel defaultSize={30} minSize={20} maxSize={50} className="z-10">
                <Preview />
              </Panel>
            </>
          )}

        </PanelGroup>
      </div>
    </div>
  );
}
