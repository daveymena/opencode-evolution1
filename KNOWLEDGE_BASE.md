# ============================================================
# OpenCode Evolution - Base de Conocimiento Completa
# Documento maestro del sistema
# ============================================================

## 1. ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                     OpenCode Evolution                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌───────────────────┐         ┌───────────────────┐           │
│  │   FRONTEND        │◄───────►│   BACKEND         │           │
│  │   (SolidJS/Vite)  │  HTTP   │   (Express)       │           │
│  └───────────────────┘         └───────────────────┘           │
│          │                              │                       │
│          │ WebSocket                    │ REST API              │
│          ▼                              ▼                       │
│  ┌───────────────────┐         ┌───────────────────┐           │
│  │   Live Preview    │         │   Sandbox Engine  │           │
│  │   WebView         │         │   Compiler        │           │
│  │   Hot Reload      │         │   File Watcher    │           │
│  └───────────────────┘         └───────────────────┘           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 2. FRONTEND - artifacts/opencode-ui/

### Stack Tecnológico
- **Framework**: SolidJS (Reactivo, performante)
- **Build Tool**: Vite
- **Estilos**: CSS Modules
- **Package Manager**: pnpm

### Componentes Principales

#### WebView (`src/components/WebView/`)
**Propósito**: Navegador integrado tipo Chrome DevTools
**Props**:
- `src`: URL inicial
- `htmlContent`: HTML directo
- `files`: Archivos a compilar
- `viewport`: 'mobile' | 'tablet' | 'desktop' | 'fullscreen'
- `onMessage`: Callback para mensajes del iframe
- `onUrlChange`: Callback cambio de URL

**Features**:
- Iframe sandboxed con `allow-scripts allow-same-origin`
- Múltiples viewports con tamaños predefinidos
- Barra de navegación con refresh/URL
- Panel de console integrado
- Comunicación postMessage bidireccional

#### LivePreview (`src/components/LivePreview/`)
**Propósito**: Preview con compilación en tiempo real
**Props**:
- `projectId`: ID único del proyecto
- `initialFiles`: Archivos iniciales
- `template`: 'vanilla' | 'react' | 'vue' | 'svelte' | 'html'
- `onError`: Callback errores
- `onReady`: Callback cuando está listo

**Features**:
- WebSocket con reconexión automática
- Hot Module Replacement (HMR)
- Compilación TypeScript → JavaScript
- Compilación SCSS → CSS
- Panel de errores de compilación
- Console integrado

#### PreviewPanel (`src/components/PreviewPanel/`)
**Propósito**: Panel integrado con layout arrastrable
**Props**:
- `projectId`: ID del proyecto
- `files`: Archivos del proyecto
- `position`: 'right' | 'bottom'
- `size`: Porcentaje del tamaño (20-80)
- `mode`: 'live' | 'webview'
- `visible`: Boolean
- `onSizeChange`: Callback
- `onClose`: Callback

**Features**:
- Split view arrastrable (resize handle)
- Toggle posición (derecha/abajo)
- Switch modo Live/WebView
- Persistencia de preferencias

### Hooks Personalizados

#### useWebSocket (`src/hooks/useWebSocket.ts`)
**Función**: Conexión WebSocket robusta
**Features**:
- Reconexión automática cada 3 segundos
- Reconexión al volver a la pestaña
- Múltiples listeners
- Estado de conexión

### Estructura de Carpetas
```
src/
├── components/
│   ├── WebView/
│   ├── LivePreview/
│   ├── PreviewPanel/
│   └── index.ts
├── hooks/
│   ├── useWebSocket.ts
│   └── index.ts
├── services/
│   └── api.ts
├── styles/
│   └── global.css
└── App.tsx
```

## 3. BACKEND - artifacts/api-server/

### Stack Tecnológico
- **Runtime**: Node.js 20+
- **Framework**: Express 5
- **WebSockets**: Socket.io
- **Compilación**: Esbuild (recomendado) o transpilación custom
- **File System**: fs/promises

### Rutas API (`src/routes/sandbox.ts`)

#### POST /api/sandbox/compile
**Descripción**: Compila archivos y devuelve HTML
**Body**:
```json
{
  "files": {
    "index.html": "<h1>Hola</h1>",
    "style.css": "h1 { color: blue; }",
    "app.ts": "console.log('hola')"
  },
  "template": "vanilla"
}
```
**Response**:
```json
{
  "success": true,
  "html": "<!DOCTYPE html>...",
  "files": [{"path": "app.js", "content": "..."}],
  "errors": []
}
```

#### POST /api/sandbox/create
**Descripción**: Crea un sandbox persistente con servidor Vite
**Body**:
```json
{
  "files": {...},
  "template": "react",
  "install": ["react", "react-dom"]
}
```
**Response**:
```json
{
  "success": true,
  "sandboxId": "uuid",
  "url": "http://localhost:3001",
  "port": 3001
}
```

#### GET /api/sandbox/:sandboxId/url
**Descripción**: Obtiene URL de un sandbox activo

#### DELETE /api/sandbox/:sandboxId
**Descripción**: Elimina un sandbox y limpia recursos

#### GET /api/sandbox
**Descripción**: Lista todos los sandboxes activos

### Servicios (`src/services/sandbox/`)

#### WebSocketServer.ts
**Clase**: `SandboxWebSocketServer`
**Métodos**:
- `broadcast(projectId, event, data)`: Envía mensaje a todos los clientes
- `close()`: Cierra servidor y watchers

**Eventos WebSocket**:
- `join`: Unirse a proyecto
- `file:change`: Cambio de archivo
- `compile:all`: Compilación completa
- `compile:start`: Inicia compilación
- `compile:success`: Compilación exitosa
- `compile:error`: Error de compilación
- `console`: Logs del iframe

#### iframe-inject.js
**Propósito**: Script inyectado automáticamente en cada iframe
**Features**:
- Intercepta console.log/error/warn/info/debug
- Captura window.onerror
- Captura unhandled promise rejections
- Hot Module Replacement (HMR)
- Actualización de CSS sin refresh
- API global `window.sandbox`

### Compiladores Implementados

#### TypeScript → JavaScript
```typescript
// Remueve anotaciones de tipo
.replace(/:\s*(string|number|boolean|any|void|never)\b/g, '')
// Remueve interfaces
.replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
// Remueve type aliases
.replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
// Remueve generics
.replace(/<[^;\(\)\{\}]*?>/g, '')
// Remueve 'as' assertions
.replace(/\s+as\s+\w+/g, '')
```

#### SCSS/SASS → CSS
- (Placeholder para integración con sass/dart-sass)

#### JSX → JavaScript
- (Placeholder para transformación completa)

### Seguridad
- Iframes sandboxed
- CORS configurado
- Limpieza periódica (1 hora)
- Aislamiento por projectId
- Path sanitization

## 4. SISTEMA DE PLANTILLAS

### vanilla
- HTML + CSS + JS puro
- Sin dependencias
- Ideal para prototipos rápidos

### react
- React + ReactDOM
- JSX support
- Componentes funcionales

### vue
- Vue 3
- SFC support
- Composition API

### svelte
- Svelte compiler
- Reactive statements

### html
- HTML estático
- Sin JavaScript

## 5. INTEGRACIONES EXTERNAS

### APIs de IA (Configurables)
```
ANTHROPIC_API_KEY      → Claude models
OPENAI_API_KEY         → GPT models
GROQ_API_KEY           → Llama/Mixtral (rápido)
OPENROUTER_API_KEY     → Multi-model
CEREBRAS_API_KEY       → Modelos propios
TOGETHER_AI_API_KEY    → Open source
GOOGLE_GENERATIVE_AI_API_KEY → Gemini
MISTRAL_API_KEY        → Mistral models
XAI_API_KEY            → Grok
```

### Base de Datos
```
DATABASE_URL           → PostgreSQL (Supabase)
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### Ollama (Local)
```
OLLAMA_HOST            → http://localhost:11434
```

## 6. FLUJOS DE TRABAJO

### Flujo 1: Preview Instantáneo
1. Usuario escribe código en editor
2. Evento `code:change` se dispara
3. Frontend envía vía WebSocket `file:change`
4. Backend compila el archivo
5. Backend emite `compile:success` con archivos
6. Frontend inyecta actualización vía HMR
7. Iframe actualiza sin perder estado

### Flujo 2: Sandbox Persistente
1. Usuario solicita preview persistente
2. POST `/api/sandbox/create`
3. Backend crea directorio temporal
4. Escribe archivos
5. Ejecuta `vite --port X`
6. Devuelve URL al frontend
7. Frontend muestra en WebView
8. Backend mantiene watcher de archivos

### Flujo 3: Compilación Manual
1. Usuario presiona "Compile"
2. POST `/api/sandbox/compile`
3. Backend procesa todos los archivos
4. Genera HTML final
5. Devuelve HTML + archivos compilados
6. Frontend muestra en iframe con data URI

## 7. VARIABLES DE ENTORNO

### Requeridas
```
PORT=3000
NODE_ENV=production
```

### Base de Datos
```
DATABASE_URL=postgresql://...
```

### APIs (Al menos una recomendada)
```
GROQ_API_KEY=...
OPENROUTER_API_KEY=...
```

### Opcionales
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
OLLAMA_HOST=...
SANDBOX_DIR=/tmp/opencode-sandbox
```

## 8. COMANDOS ÚTILES

### Desarrollo
```bash
# Instalar dependencias
pnpm install

# Iniciar dev server
pnpm run dev

# Construir
pnpm run build

# Iniciar producción
pnpm run start
```

### Sandbox
```bash
# Limpiar sandboxes antiguos
rm -rf /tmp/opencode-sandbox/*

# Ver procesos Vite activos
ps aux | grep vite

# Matar todos los procesos Vite
pkill -f vite
```

## 9. DEBUGGING

### Frontend
- Revisar consola del navegador
- Network tab para WebSocket
- SolidJS DevTools
- React DevTools (compatibilidad)

### Backend
- Logs de console en terminal
- Revisar `/tmp/opencode-sandbox/`
- Probar endpoints con curl
- WebSocket events en Network tab

### Iframe
- DevTools del iframe (click derecho → Inspect)
- Console del iframe (aislada)
- Network del iframe

## 10. EXTENSIBILIDAD

### Agregar Nuevo Compilador
1. Crear función en `sandbox.ts`
2. Agregar caso al switch de `compileFile`
3. Instalar dependencia si es necesaria
4. Agregar tests

### Agregar Nueva Plantilla
1. Crear directorio en `templates/`
2. Definir archivos base
3. Agregar a enum en types
4. Actualizar documentación

### Agregar Nuevo Viewport
1. Agregar a `VIEWPORT_SIZES` en WebView.tsx
2. Actualizar selector en toolbar
3. Testear responsive

## 11. CAPACIDADES DEL SISTEMA

### ✅ Lo que PUEDE hacer

#### Frontend
- Renderizar iframes sandboxed
- Compilar TypeScript en tiempo real
- Compilar SCSS/SASS
- Hot Module Replacement
- Múltiples viewports (mobile/tablet/desktop)
- Capturar console del iframe
- WebSockets bidireccionales
- Split view arrastrable
- Dark/Light themes

#### Backend
- Compilar TypeScript/SCSS/JSX
- Crear servidores Vite temporales
- Gestionar múltiples sandboxes
- File watchers en tiempo real
- Instalar dependencias npm
- Limpieza automática
- WebSocket broadcasting
- APIs RESTful

#### Integración
- Conectar con múltiples APIs de IA
- Persistencia en PostgreSQL/Supabase
- Modelos locales con Ollama
- Autenticación (via tokens)
- Multi-proyecto

### ❌ Limitaciones Conocidas

- No ejecuta código del servidor (Node.js en backend solo)
- Sandbox es client-side only
- No acceso a filesystem real del usuario
- Dependencias npm se instalan en cada sandbox nuevo
- Memoria limitada por contenedor

## 12. CASOS DE USO

### Desarrollo Web
- HTML/CSS/JS en tiempo real
- React/Vue/Svelte sin configuración
- Preview responsive
- Debugging integrado

### Educación
- Enseñar código con preview instantáneo
- Ejemplos interactivos
- Ejercicios con validación automática

### Prototipado Rápido
- Ideas a código en segundos
- Shareable URLs
- Sin configuración local

### Code Reviews
- Ver cambios en tiempo real
- Comparar versiones
- Comentarios inline

## 13. ROADMAP FUTURO

### Corto Plazo
- [ ] Integrar esbuild completo
- [ ] Soporte para imports npm en browser
- [ ] Autocompletado en editor
- [ ] Linting integrado

### Mediano Plazo
- [ ] Soporte para múltiples archivos de forma visual
- [ ] File explorer integrado
- [ ] Git integration
- [ ] Deploy a Vercel/Netlify

### Largo Plazo
- [ ] VS Code extension
- [ ] Mobile app
- [ ] Real-time collaboration
- [ ] AI-powered code generation

---

**Última actualización**: 2026-04-02
**Versión**: OpenCode Evolution 2.0
**Mantenido por**: @daveymena
