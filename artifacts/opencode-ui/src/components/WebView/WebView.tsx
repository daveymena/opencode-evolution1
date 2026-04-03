// ============================================================
// OpenCode Evolution - WebView Component
// Componente de previsualización integrada tipo Replit
// ============================================================

import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import type { Component } from 'solid-js';
import styles from './WebView.module.css';

interface WebViewProps {
  // URL del sandbox (ej: http://localhost:3001/sandbox/project-id)
  src?: string;
  // Contenido HTML directo (para preview en tiempo real)
  htmlContent?: string;
  // Archivos del proyecto para compilar
  files?: Record<string, string>;
  // Callback cuando cambia la URL
  onUrlChange?: (url: string) => void;
  // Callback para mensajes del iframe
  onMessage?: (message: any) => void;
  // Tamaño del viewport (mobile, tablet, desktop)
  viewport?: 'mobile' | 'tablet' | 'desktop' | 'fullscreen';
  // Escalar el preview (zoom)
  scale?: number;
}

const VIEWPORT_SIZES = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 720 },
  fullscreen: { width: '100%', height: '100%' }
};

export const WebView: Component<WebViewProps> = (props) => {
  const [url, setUrl] = createSignal(props.src || 'about:blank');
  const [isLoading, setIsLoading] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [consoleLogs, setConsoleLogs] = createSignal<Array<{type: string, message: string, timestamp: Date}>>([]);
  const [showConsole, setShowConsole] = createSignal(false);
  const [refreshKey, setRefreshKey] = createSignal(0);

  let iframeRef: HTMLIFrameElement | undefined;

  // Efecto para actualizar cuando cambia el src
  createEffect(() => {
    if (props.src && props.src !== url()) {
      setUrl(props.src);
      setIsLoading(true);
      setError(null);
    }
  });

  // Efecto para enviar contenido HTML directo
  createEffect(() => {
    if (props.htmlContent && iframeRef) {
      const doc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(props.htmlContent);
        doc.close();
      }
    }
  });

  // Efecto para compilar archivos y actualizar
  createEffect(() => {
    if (props.files && Object.keys(props.files).length > 0) {
      compileAndPreview(props.files);
    }
  });

  // Listener para mensajes del iframe (console logs, errores)
  const handleMessage = (event: MessageEvent) => {
    if (event.source !== iframeRef?.contentWindow) return;

    const { data } = event;

    if (data.type === 'console') {
      setConsoleLogs(prev => [...prev, {
        type: data.level,
        message: data.args.join(' '),
        timestamp: new Date()
      }]);
    }

    if (data.type === 'error') {
      setConsoleLogs(prev => [...prev, {
        type: 'error',
        message: `${data.message} at ${data.filename}:${data.lineno}`,
        timestamp: new Date()
      }]);
    }

    if (props.onMessage) {
      props.onMessage(data);
    }
  };

  // Escuchar mensajes del iframe
  window.addEventListener('message', handleMessage);
  onCleanup(() => window.removeEventListener('message', handleMessage));

  const compileAndPreview = async (files: Record<string, string>) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/sandbox/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files })
      });

      if (!response.ok) throw new Error('Compilation failed');

      const result = await response.json();

      if (result.html) {
        // Si tenemos HTML compilado, mostrarlo directamente
        if (iframeRef) {
          const doc = iframeRef.contentDocument || iframeRef.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(result.html);
            doc.close();
          }
        }
      } else if (result.sandboxUrl) {
        // Si hay URL de sandbox, navegar ahí
        setUrl(result.sandboxUrl);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(k => k + 1);
    if (iframeRef) {
      iframeRef.src = iframeRef.src;
    }
  };

  const handleUrlSubmit = (e: Event) => {
    e.preventDefault();
    const input = (e.target as HTMLFormElement).querySelector('input');
    if (input) {
      let newUrl = input.value;
      if (!newUrl.startsWith('http')) {
        newUrl = 'https://' + newUrl;
      }
      setUrl(newUrl);
      if (props.onUrlChange) {
        props.onUrlChange(newUrl);
      }
    }
  };

  const viewportSize = () => VIEWPORT_SIZES[props.viewport || 'desktop'];

  return (
    <div class={styles.webviewContainer}>
      {/* Toolbar */}
      <div class={styles.toolbar}>
        <div class={styles.toolbarLeft}>
          <button
            class={styles.toolbarButton}
            onClick={handleRefresh}
            title="Refresh"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </button>

          <form onSubmit={handleUrlSubmit} class={styles.urlBar}>
            <input
              type="text"
              value={url()}
              onInput={(e) => setUrl(e.currentTarget.value)}
              class={styles.urlInput}
              placeholder="Enter URL..."
            />
          </form>
        </div>

        <div class={styles.toolbarRight}>
          <button
            class={styles.toolbarButton}
            classList={{ [styles.active]: showConsole() }}
            onClick={() => setShowConsole(!showConsole())}
            title="Toggle Console"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="4 17 10 11 4 5"></polyline>
              <line x1="12" y1="19" x2="20" y2="19"></line>
            </svg>
            {consoleLogs().length > 0 && (
              <span class={styles.badge}>{consoleLogs().length}</span>
            )}
          </button>

          <select
            class={styles.viewportSelect}
            onChange={(e) => {
              // Handle viewport change via parent
            }}
          >
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
            <option value="fullscreen">Fullscreen</option>
          </select>
        </div>
      </div>

      {/* Preview Area */}
      <div class={styles.previewArea}>
        <Show when={isLoading()}>
          <div class={styles.loadingOverlay}>
            <div class={styles.spinner}></div>
            <span>Compiling...</span>
          </div>
        </Show>

        <Show when={error()}>
          <div class={styles.errorOverlay}>
            <div class={styles.errorIcon}>⚠️</div>
            <div class={styles.errorMessage}>{error()}</div>
          </div>
        </Show>

        <div
          class={styles.viewport}
          style={{
            width: typeof viewportSize().width === 'number' ? `${viewportSize().width}px` : viewportSize().width,
            height: typeof viewportSize().height === 'number' ? `${viewportSize().height}px` : viewportSize().height,
            transform: props.scale && props.scale !== 1 ? `scale(${props.scale})` : undefined
          }}
        >
          <iframe
            ref={iframeRef}
            src={url()}
            class={styles.iframe}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
            allow="camera; microphone; geolocation; clipboard-read; clipboard-write"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setError('Failed to load page');
            }}
          />
        </div>
      </div>

      {/* Console Panel */}
      <Show when={showConsole()}>
        <div class={styles.consolePanel}>
          <div class={styles.consoleHeader}>
            <span>Console</span>
            <button
              class={styles.clearButton}
              onClick={() => setConsoleLogs([])}
            >
              Clear
            </button>
          </div>
          <div class={styles.consoleContent}>
            <For each={consoleLogs()}>
              {(log) => (
                <div class={`${styles.consoleLine} ${styles[log.type]}`}>
                  <span class={styles.timestamp}>
                    {log.timestamp.toLocaleTimeString()}
                  </span>
                  <span class={styles.message}>{log.message}</span>
                </div>
              )}
            </For>
            {consoleLogs().length === 0 && (
              <div class={styles.emptyConsole}>No messages</div>
            )}
          </div>
        </div>
      </Show>
    </div>
  );
};

export default WebView;
