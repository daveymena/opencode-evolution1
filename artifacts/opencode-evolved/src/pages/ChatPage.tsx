import React, { useState, useRef, useCallback } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import ApiKeysPage from '@/pages/ApiKeysPage';
import {
  Circle, Settings, HelpCircle, Code2, Globe,
  MessageSquare, PanelLeftClose, PanelLeftOpen, ChevronRight,
  LogOut, Key, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type RightTab = 'editor' | 'preview';

export default function ChatPage() {
  const [activeProjectId, setActiveProjectId] = useState<number | undefined>();
  const [rightTab, setRightTab] = useState<RightTab>('preview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // Resizable panels
  const [leftWidth, setLeftWidth] = useState(42); // % of main area
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const queryClient = useQueryClient();
  const { openFiles } = useIde();
  const { user, logout } = useAuth();

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
    sendMessageMutation.mutate({ projectId: activeProjectId, data: { content } });
  };

  // Drag to resize
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    const onMove = (ev: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftWidth(Math.min(Math.max(pct, 25), 70));
    };
    const onUp = () => { isDragging.current = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  const showRight = !!activeProjectId;

  return (
    <div className="flex h-screen bg-[#0d0d0d] overflow-hidden text-gray-200 font-sans select-none">

      {showApiKeys && <ApiKeysPage onClose={() => setShowApiKeys(false)} />}

      {/* ── Project Sidebar ── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="shrink-0 overflow-hidden"
          >
            <ProjectSidebar
              activeProjectId={activeProjectId}
              onSelectProject={(id) => setActiveProjectId(id === 0 ? undefined : id)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="h-11 flex items-center justify-between px-4 border-b border-white/[0.06] bg-[#0d0d0d] shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(v => !v)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {project && (
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-gray-500">Proyectos</span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-white font-medium">{project.name}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {status && (
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
                <Circle className={`w-1.5 h-1.5 fill-current ${status.available ? 'text-emerald-400' : 'text-red-400'}`} />
                {status.available ? 'IA lista' : 'IA offline'}
                {project?.model && <span className="text-indigo-400 ml-1 uppercase text-[10px]">{project.model}</span>}
              </div>
            )}
            {/* Usuario actual */}
            {user && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full">
                <User className="w-3 h-3" />
                <span>{user.name}</span>
              </div>
            )}
            <button
              onClick={() => setShowApiKeys(true)}
              title="API Keys"
              className="p-1.5 text-gray-600 hover:text-white hover:bg-white/5 rounded-md transition-colors"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              title="Cerrar sesión"
              className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-white/5 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Workspace */}
        <div ref={containerRef} className="flex-1 flex overflow-hidden relative">

          {/* ── LEFT: Chat panel ── */}
          <div
            style={{ width: showRight ? `${leftWidth}%` : '100%' }}
            className="flex flex-col h-full min-w-0 bg-[#0d0d0d] transition-none"
          >
            <AnimatePresence mode="wait">
              {!activeProjectId ? (
                <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex">
                  <WelcomeScreen onExampleClick={() => alert('Crea un proyecto primero.')} />
                </motion.div>
              ) : (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col h-full overflow-hidden">
                  {messages.length === 0 ? (
                    <WelcomeScreen onExampleClick={handleSendMessage} />
                  ) : (
                    <MessageList messages={messages} isLoading={sendMessageMutation.isPending} />
                  )}
                  <div className="px-4 pb-6 pt-3 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/90 to-transparent shrink-0">
                    <MessageInput onSend={handleSendMessage} disabled={sendMessageMutation.isPending || !status?.available} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── DIVIDER (drag to resize) ── */}
          {showRight && (
            <div
              onMouseDown={onMouseDown}
              className="w-1 shrink-0 bg-white/[0.04] hover:bg-indigo-500/40 cursor-col-resize transition-colors active:bg-indigo-500/60 z-10"
            />
          )}

          {/* ── RIGHT: Editor + Preview ── */}
          {showRight && (
            <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">

              {/* Tab bar */}
              <div className="h-10 flex items-center border-b border-white/[0.06] bg-[#0a0a0a] shrink-0 px-2 gap-1">
                <button
                  onClick={() => setRightTab('editor')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightTab === 'editor'
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  Editor
                  {openFiles.length > 0 && (
                    <span className="ml-1 bg-indigo-500/20 text-indigo-400 text-[10px] px-1.5 py-0.5 rounded-full">
                      {openFiles.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setRightTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    rightTab === 'preview'
                      ? 'bg-white/[0.08] text-white'
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  Preview
                </button>

                {/* Split view button */}
                <button
                  onClick={() => setRightTab(rightTab === 'editor' ? 'preview' : 'editor')}
                  className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-gray-600 hover:text-gray-300 hover:bg-white/[0.04] transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Alternar
                </button>
              </div>

              {/* Panel content */}
              <div className="flex-1 overflow-hidden">
                {rightTab === 'editor' ? <EditorArea /> : <Preview />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
