// ============================================================
// OpenCode Evolution - LivePreview Component
// Preview con actualización en tiempo real (Hot Reload)
// ============================================================

import { createSignal, createEffect, onMount, onCleanup, Show, batch } from 'solid-js';
import type { Component } from 'solid-js';
import { createWebSocket } from '../../hooks/useWebSocket';
import styles from './LivePreview.module.css';

interface LivePreviewProps {
  // ID del proyecto/workspace
  projectId: string;
  // Archivos iniciales
  initialFiles?: Record<string, string>;
  // Template del proyecto
  template?: 'vanilla' | 'react' | 'vue' | 'svelte' | 'html';
  // Callback cuando hay errores
  onError?: (errors: string[]) => void;
  // Callback cuando está listo
  onReady?: () => void;
}

interface PreviewMessage {
  type: 'connected' | 'file:change' | 'compile:start' | 'compile:success' | 'compile:error' | 'console' | 'error';
  data?: any;
  timestamp: number;
}

export const LivePreview: Component<LivePreviewProps> = (props) => {
  const [isConnected, setIsConnected] = createSignal(false);
  const [isCompiling, setIsCompiling] = createSignal(false);
  const [errors, setErrors] = createSignal<string[]>([]);
  const [iframeUrl, setIframeUrl] = createSignal('about:blank');
  const [showPreview, setShowPreview] = createSignal(true);
  const [consoleLogs, setConsoleLogs] = createSignal<Array<{ type: string; message: string; timestamp: Date }>>([]);

  let iframeRef: HTMLIFrameElement | undefined;

  // Crear conexión WebSocket
  const ws = createWebSocket(`ws://localhost:3001/sandbox/${props.projectId}/ws`);

  onMount(() => {
    // Inicializar sandbox
    initializeSandbox();

    // Escuchar mensajes del WebSocket
    ws.onMessage((msg: PreviewMessage) => {
      handleMessage(msg);
    });

    ws.onConnect(() => {
      setIsConnected(true);
      console.log('🔗 Connected to sandbox');
    });

    ws.onDisconnect(() => {
      setIsConnected(false);
      console.log('🔌 Disconnected from sandbox');
    });

    ws.onError((err) => {
      console.error('WebSocket error:', err);
      setErrors(prev => [...prev, 'Connection error']);
    });

    // Escuchar cambios de archivos locales
    window.addEventListener('code:change', handleLocalFileChange);
  });

  onCleanup(() => {
    ws.close();
    window.removeEventListener('code:change', handleLocalFileChange);
  });

  const initializeSandbox = async () => {
    try {
      setIsCompiling(true);

      const response = await fetch('/api/sandbox/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: props.projectId,
          files: props.initialFiles || {},
          template: props.template || 'vanilla'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create sandbox');
      }

      const data = await response.json();

      batch(() => {
        setIframeUrl(data.url);
        setErrors([]);
      });

      if (props.onReady) {
        props.onReady();
      }

    } catch (err) {
      console.error('Sandbox init error:', err);
      setErrors([err instanceof Error ? err.message : 'Failed to initialize preview']);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleMessage = (msg: PreviewMessage) => {
    switch (msg.type) {
      case 'compile:start':
        setIsCompiling(true);
        break;

      case 'compile:success':
        batch(() => {
          setIsCompiling(false);
          setErrors([]);
        });

        // Refrescar iframe sin perder estado si es posible
        if (iframeRef && msg.data?.preserveState) {
          injectUpdate(msg.data.files);
        } else if (iframeRef) {
          iframeRef.src = iframeRef.src;
        }
        break;

      case 'compile:error':
        batch(() => {
          setIsCompiling(false);
          setErrors(msg.data?.errors || ['Compilation failed']);
        });

        if (props.onError) {
          props.onError(msg.data?.errors || ['Compilation failed']);
        }
        break;

      case 'console':
        setConsoleLogs(prev => [...prev, {
          type: msg.data.level,
          message: msg.data.message,
          timestamp: new Date()
        }]);
        break;

      case 'error':
        setConsoleLogs(prev => [...prev, {
          type: 'error',
          message: msg.data.message,
          timestamp: new Date()
        })];
        break;
    }
  };

  const handleLocalFileChange = async (event: CustomEvent) => {
    const { path, content } = event.detail;

    if (!isConnected()) return;

    // Enviar cambio al servidor
    ws.send({
      type: 'file:change',
      data: { path, content }
    });
  };

  // Inyección de código sin recargar (HMR-style)
  const injectUpdate = (files: Record<string, string>) => {
    if (!iframeRef?.contentWindow) return;

    const message = {
      type: 'HMR_UPDATE',
      files
    };

    iframeRef.contentWindow.postMessage(message, '*');
  };

  const handleRefresh = () => {
    if (iframeRef) {
      iframeRef.src = iframeRef.src;
    }
  };

  const handleOpenInNewTab = () => {
    window.open(iframeUrl(), '_blank');
  };

  return (
    <div class={styles.livePreviewContainer}>
      {/* Header con controles */}
      <div class={styles.header}>
        <div class={styles.headerLeft}>
          <span class={styles.title}>Live Preview</span>
          <div class={styles.status}>
            <Show when={isConnected()}>
              <span class={styles.statusDot} style={{ background: '#10b981' }}></span>
              <span class={styles.statusText}>Connected</span>
            </Show>
            <Show when={!isConnected()}>
              <span class={styles.statusDot} style={{ background: '#ef4444' }}></span>
              <span class={styles.statusText}>Disconnected</span>
            </Show>
          </div>
        </div>

        <div class={styles.headerRight}>
          <button
            class={styles.controlButton}
            onClick={handleRefresh}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>

          <button
            class={styles.controlButton}
            onClick={handleOpenInNewTab}
            title="Open in new tab"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </button>

          <button
            class={styles.controlButton}
            classList={{ [styles.active]: showPreview() }}
            onClick={() => setShowPreview(!showPreview())}
            title="Toggle Preview"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>

      {/* Área de preview */}
      <Show when={showPreview()}>
        <div class={styles.previewArea}>
          <Show when={isCompiling()}>
            <div class={styles.compilingOverlay}>
              <div class={styles.spinner}></div>
              <span>Compiling...</span>
            </div>
          </Show>

          <Show when={errors().length > 0}>
            <div class={styles.errorsPanel}>
              <div class={styles.errorsHeader}>
                <span>⚠️ Compilation Errors</span>
                <button
                  class={styles.dismissButton}
                  onClick={() => setErrors([])}
                >
                  Dismiss
                </button>
              </div>
              <div class={styles.errorsList}>
                {errors().map((error, i) => (
                  <div key={i} class={styles.errorItem}>{error}</div>
                ))}
              </div>
            </div>
          </Show>

          <iframe
            ref={iframeRef}
            src={iframeUrl()}
            class={styles.iframe}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            allow="camera; microphone; geolocation; clipboard-read; clipboard-write"
          />
        </div>
      </Show>

      {/* Console output */}
      <div class={styles.consolePanel}>
        <div class={styles.consoleHeader}>
          <span>Console ({consoleLogs().length})</span>
          <button
            class={styles.clearButton}
            onClick={() => setConsoleLogs([])}
          >
            Clear
          </button>
        </div>
        <div class={styles.consoleContent}>
          {consoleLogs().map((log, i) => (
            <div key={i} class={`${styles.consoleLine} ${styles[log.type]}`}>
              <span class={styles.timestamp}>{log.timestamp.toLocaleTimeString()}</span>
              <span class={styles.message}>{log.message}</span>
            </div>
          ))}
          {consoleLogs().length === 0 && (
            <div class={styles.emptyConsole}>No messages</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LivePreview;
