// ============================================================
// OpenCode Evolution - PreviewPanel
// Panel integrado con split view (editor + preview)
// ============================================================

import { createSignal, Show, createEffect, onMount, onCleanup } from 'solid-js';
import type { Component } from 'solid-js';
import { WebView } from '../WebView';
import { LivePreview } from '../LivePreview';
import styles from './PreviewPanel.module.css';

interface PreviewPanelProps {
  // ID del proyecto actual
  projectId: string;
  // Archivos del proyecto
  files: Record<string, string>;
  // Archivo actualmente activo
  activeFile?: string;
  // Modo de preview
  mode?: 'webview' | 'live';
  // Posición del panel
  position?: 'right' | 'bottom';
  // Tamaño del panel (0-100)
  size?: number;
  // Callback cuando cambia el tamaño
  onSizeChange?: (size: number) => void;
  // Si está visible
  visible?: boolean;
  // Callback al cerrar
  onClose?: () => void;
}

export const PreviewPanel: Component<PreviewPanelProps> = (props) => {
  const [size, setSize] = createSignal(props.size || 40);
  const [isDragging, setIsDragging] = createSignal(false);
  const [mode, setMode] = createSignal(props.mode || 'live');
  const [position, setPosition] = createSignal(props.position || 'right');

  let resizeHandleRef: HTMLDivElement | undefined;
  let containerRef: HTMLDivElement | undefined;

  // Actualizar tamaño cuando cambia la prop
  createEffect(() => {
    if (props.size !== undefined) {
      setSize(props.size);
    }
  });

  // Handler para redimensionar
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const startSize = size();
    const isHorizontal = position() === 'right';

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef) return;

      const rect = containerRef.getBoundingClientRect();
      let newSize: number;

      if (isHorizontal) {
        const delta = startX - e.clientX;
        newSize = startSize + (delta / rect.width) * 100;
      } else {
        const delta = startY - e.clientY;
        newSize = startSize + (delta / rect.height) * 100;
      }

      // Limitar entre 20% y 80%
      newSize = Math.max(20, Math.min(80, newSize));
      setSize(newSize);

      if (props.onSizeChange) {
        props.onSizeChange(newSize);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const togglePosition = () => {
    setPosition(prev => prev === 'right' ? 'bottom' : 'right');
  };

  const handleClose = () => {
    if (props.onClose) {
      props.onClose();
    }
  };

  return (
    <Show when={props.visible !== false}>
      <div
        ref={containerRef}
        class={styles.previewPanel}
        classList={{
          [styles.right]: position() === 'right',
          [styles.bottom]: position() === 'bottom'
        }}
        style={{
          [position() === 'right' ? 'width' : 'height']: `${size()}%`
        }}
      >
        {/* Handle de redimensionamiento */}
        <div
          ref={resizeHandleRef}
          class={styles.resizeHandle}
          classList={{
            [styles.right]: position() === 'right',
            [styles.bottom]: position() === 'bottom',
            [styles.dragging]: isDragging()
          }}
          onMouseDown={handleMouseDown}
        />

        {/* Header del panel */}
        <div class={styles.panelHeader}>
          <div class={styles.headerLeft}>
            <span class={styles.panelTitle}>
              🚀 Preview
            </span>

            <div class={styles.modeToggle}>
              <button
                class={styles.modeButton}
                classList={{ [styles.active]: mode() === 'live' }}
                onClick={() => setMode('live')}
                title="Live Preview with Hot Reload"
              >
                Live
              </button>
              <button
                class={styles.modeButton}
                classList={{ [styles.active]: mode() === 'webview' }}
                onClick={() => setMode('webview')}
                title="WebView Browser"
              >
                WebView
              </button>
            </div>
          </div>

          <div class={styles.headerRight}>
            <button
              class={styles.iconButton}
              onClick={togglePosition}
              title="Toggle Position"
            >
              <Show when={position() === 'right'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="3" x2="9" y2="21"></line>
                </svg>
              </Show>
              <Show when={position() === 'bottom'}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                </svg>
              </Show>
            </button>

            <button
              class={styles.iconButton}
              onClick={handleClose}
              title="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Contenido del panel */}
        <div class={styles.panelContent}>
          <Show when={mode() === 'live'}>
            <LivePreview
              projectId={props.projectId}
              initialFiles={props.files}
              template="vanilla"
            />
          </Show>

          <Show when={mode() === 'webview'}>
            <WebView
              viewport="desktop"
            />
          </Show>
        </div>
      </div>
    </Show>
  );
};

export default PreviewPanel;
