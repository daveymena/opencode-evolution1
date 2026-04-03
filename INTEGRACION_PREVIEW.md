# ============================================================
# OpenCode Evolution - Integración del Preview Integrado
# ============================================================

## 📁 Archivos Creados

### Frontend (UI Components)
```
artifacts/opencode-ui/src/components/
├── WebView/
│   ├── WebView.tsx           # Componente WebView con iframe sandboxed
│   ├── WebView.module.css    # Estilos del WebView
│   └── index.ts              # Exportaciones
├── LivePreview/
│   ├── LivePreview.tsx       # Preview con hot reload via WebSocket
│   ├── LivePreview.module.css
│   └── index.ts
├── PreviewPanel/
│   ├── PreviewPanel.tsx      # Panel integrado con split view
│   ├── PreviewPanel.module.css
│   └── index.ts
└── index.ts                  # Exportaciones globales

artifacts/opencode-ui/src/hooks/
├── useWebSocket.ts           # Hook para WebSocket con reconexión
└── index.ts
```

### Backend (API Server)
```
artifacts/api-server/src/
├── routes/
│   ├── sandbox.ts             # Endpoints REST para sandbox
│   └── index.ts               # Router principal
└── services/sandbox/
    ├── iframe-inject.js       # Script inyectado en iframes
    └── WebSocketServer.ts     # Servidor WebSocket para hot reload
```

## 🚀 Cómo Usar

### 1. Agregar a las rutas del servidor

En tu archivo principal del API server (ej: `app.ts` o `server.ts`):

```typescript
import routes from './routes';
import { SandboxWebSocketServer } from './services/sandbox/WebSocketServer';

// ... tu app express
app.use('/api', routes);

// Inicializar WebSocket server (para hot reload)
const httpServer = createServer(app);
const wsServer = new SandboxWebSocketServer(httpServer, '/tmp/opencode-sandbox');

httpServer.listen(3000);
```

### 2. Usar el componente en el frontend

```tsx
import { PreviewPanel } from '@workspace/opencode-ui/components';

function EditorPage() {
  return (
    <div class="editor-layout">
      <div class="editor-pane">
        {/* Tu editor de código */}
      </div>
      
      <PreviewPanel
        projectId="mi-proyecto-123"
        files={{
          'index.html': '<h1>Hola Mundo</h1>',
          'style.css': 'h1 { color: blue; }',
          'app.js': 'console.log("Hola");'
        }}
        position="right"
        size={40}
        visible={true}
      />
    </div>
  );
}
```

### 3. Modos de Preview

#### WebView - Navegador integrado
```tsx
<WebView
  src="https://ejemplo.com"
  viewport="desktop"  // mobile | tablet | desktop | fullscreen
  onMessage={(msg) => console.log(msg)}
/>
```

#### LivePreview - Hot Reload
```tsx
<LivePreview
  projectId="proyecto-123"
  template="react"  // vanilla | react | vue | svelte
  onError={(errors) => console.error(errors)}
  onReady={() => console.log('Preview listo')}
/>
```

## 🔧 Características Implementadas

### WebView Component
- ✅ Navegador integrado con iframe sandboxed
- ✅ Múltiples viewports (mobile, tablet, desktop)
- ✅ Barra de navegación con refresh y URL
- ✅ Captura de console.log/error/warn del iframe
- ✅ Panel de console integrado
- ✅ Comunicación bidireccional postMessage

### LivePreview Component
- ✅ WebSocket con reconexión automática
- ✅ Compilación en tiempo real
- ✅ Hot Module Replacement (HMR)
- ✅ Soporte para TypeScript, SCSS, JSX
- ✅ Captura de errores de compilación
- ✅ Console integrado

### Sandbox Server
- ✅ Compilación REST API (`POST /api/sandbox/compile`)
- ✅ Servidores Vite temporales
- ✅ Instalación de dependencias npm
- ✅ Limpieza automática de sandboxes antiguos
- ✅ WebSocket para hot reload
- ✅ File watchers para cambios automáticos

## 📦 Dependencias Necesarias

### Backend
```bash
npm install socket.io esbuild sass
# o
yarn add socket.io esbuild sass
```

### Frontend (ya están en SolidJS)
- No requiere dependencias adicionales

## 🔒 Seguridad

El sandbox implementa:
- `sandbox="allow-scripts allow-same-origin..."` en iframes
- CORS configurado para WebSockets
- Limpieza automática de archivos temporales
- Aislamiento de proyectos por ID

## 🎨 Temas y Estilos

Los componentes usan CSS variables para soportar temas:
```css
:root {
  --bg-primary: #1a1a1a;
  --bg-secondary: #252525;
  --bg-tertiary: #1a1a1a;
  --text-primary: #fff;
  --text-secondary: #888;
  --accent-primary: #3b82f6;
  --error-color: #ef4444;
  --warning-color: #f59e0b;
}
```

## 🚀 Próximos Pasos

Para terminar la integración:

1. **Instalar dependencias** en el API server
2. **Agregar las rutas** al servidor Express
3. **Importar los componentes** en el editor
4. **Probar** con un proyecto de ejemplo

## 🐛 Debugging

Si el preview no funciona:
1. Revisar que el WebSocket server esté corriendo
2. Verificar que los archivos se estén enviando correctamente
3. Revisar la consola del navegador para errores
4. Verificar que el sandbox esté creando los archivos en `/tmp/opencode-sandbox`
