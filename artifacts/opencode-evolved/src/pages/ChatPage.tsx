import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { 
  useGetProject, 
  useListMessages, 
  useSendMessage, 
  useGetOpenCodeStatus,
  getListMessagesQueryKey 
} from '@workspace/api-client-react';
import { ProjectSidebar } from '@/components/chat/ProjectSidebar';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';
import { WelcomeScreen } from '@/components/chat/WelcomeScreen';
import { EditorArea } from '@/components/ide/EditorArea';
import { Preview } from '@/components/ide/Preview';
import { useIde } from '@/contexts/IdeContext';
import { Circle, Settings, Bell, HelpCircle, Columns, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ChatPage() {
  const [activeProjectId, setActiveProjectId] = useState<number | undefined>();
  const queryClient = useQueryClient();
  const { openFiles } = useIde();

  const { data: project } = useGetProject(activeProjectId as number, { 
    query: { enabled: !!activeProjectId, queryKey: ['/api/projects', activeProjectId] } 
  });
  
  const { data: messages = [] } = useListMessages(activeProjectId as number, {
    query: { enabled: !!activeProjectId, queryKey: getListMessagesQueryKey(activeProjectId as number) }
  });

  const { data: status } = useGetOpenCodeStatus();

  const sendMessageMutation = useSendMessage({
    mutation: {
      onSuccess: () => {
        if (activeProjectId) {
          queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(activeProjectId) });
        }
      }
    }
  });

  const handleSendMessage = (content: string) => {
    if (!activeProjectId) return;
    sendMessageMutation.mutate({ 
      projectId: activeProjectId, 
      data: { content } 
    });
  };

  const isIDEActive = openFiles.length > 0;

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden selection:bg-indigo-500/30 text-gray-200 font-sans">
      <ProjectSidebar 
        activeProjectId={activeProjectId} 
        onSelectProject={(id) => setActiveProjectId(id === 0 ? undefined : id)} 
      />

      <main className="flex-1 flex flex-col h-full bg-[#0A0A0A] relative z-0">
        
        {/* Subtle grid background for the chat area ONLY if IDE is inactive */}
        {!isIDEActive && (
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
        )}

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 shrink-0 bg-[#0A0A0A]/90 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4 border-r border-white/5 pr-4">
            <h1 className="font-semibold text-white tracking-tight text-lg">
              {project ? project.name : 'Inicio'}
            </h1>
            {status && (
              <div className="flex items-center gap-2 text-[11px] font-medium text-gray-400 bg-white/5 border border-white/5 px-3 py-1.5 rounded-full shadow-sm">
                <Circle className={`w-2 h-2 fill-current ${status.available ? 'text-emerald-400' : 'text-red-400'} animate-pulse`} />
                {status.available ? 'IA Conectada' : 'IA Desconectada'}
                {project?.model && (
                  <>
                    <div className="w-px h-3 bg-white/10 mx-1" />
                    <span className="text-indigo-400 uppercase tracking-tighter">{project.model}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 pl-4">
            {isIDEActive && (
              <>
                <button className="flex items-center gap-2 p-2 px-3 text-indigo-400 hover:text-indigo-300 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors border border-indigo-500/20 mr-2">
                  <Columns className="w-4 h-4" />
                  <span className="text-xs font-semibold">Workspace</span>
                </button>
                <div className="w-px h-6 bg-white/10 mx-2" />
              </>
            )}
             <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
               <HelpCircle className="w-5 h-5" />
             </button>
             <button className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
               <Settings className="w-5 h-5" />
             </button>
          </div>
        </header>

        {/* Workspace Layout */}
        <div className="flex-1 flex relative z-10 overflow-hidden">
          
          {/* Chat Panel */}
          <motion.div 
            layout
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={`flex flex-col h-full bg-transparent transition-all duration-300 ${isIDEActive ? 'w-[45%] border-r border-[#1a1a1a] shadow-2xl' : 'w-full'}`}
          >
            <AnimatePresence mode="wait">
              {!activeProjectId ? (
                <motion.div 
                  key="welcome"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex"
                >
                  <WelcomeScreen onExampleClick={(text) => {
                    alert("Primero crea un proyecto en la barra lateral izquierda para comenzar.");
                  }} />
                </motion.div>
              ) : (
                <motion.div 
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  className="flex-1 flex flex-col h-full"
                >
                  {messages.length === 0 ? (
                    <WelcomeScreen onExampleClick={handleSendMessage} />
                  ) : (
                    <MessageList 
                      messages={messages} 
                      isLoading={sendMessageMutation.isPending} 
                    />
                  )}
                  
                  <div className={`p-4 md:pb-8 md:pt-4 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A] to-transparent w-full ${isIDEActive ? 'px-6' : 'md:px-8'}`}>
                    <MessageInput 
                      onSend={handleSendMessage} 
                      disabled={sendMessageMutation.isPending || !status?.available} 
                    />
                    <div className="text-center mt-3 text-[11px] font-medium text-gray-600 tracking-wide">
                      La IA escribe, el IDE renderiza. Magia de nivel Dios.
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* IDE Panels (Editor + Preview) */}
          <AnimatePresence>
            {isIDEActive && (
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex-1 flex h-full"
              >
                <div className="flex-1 flex flex-col h-full shadow-[inset_0_0_50px_rgba(0,0,0,0.5)] bg-[#050505]">
                   <EditorArea />
                </div>
                {/* We can show preview side-by-side or stacked. A simplistic approach is splitting the right half itself. */}
                <div className="flex-1 flex items-center justify-center border-l border-[#1a1a1a] bg-[#0A0A0A]">
                  <Preview />
                </div>
              </motion.div>
            )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
