// ============================================================
// OpenCode Evolution - WebSocket Server for Sandbox
// Maneja hot reload y comunicación tiempo real
// ============================================================

import { Server } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

interface SandboxSession {
  projectId: string;
  socketId: string;
  files: Map<string, string>;
}

interface FileChangeMessage {
  path: string;
  content: string;
}

export class SandboxWebSocketServer {
  private io: Server;
  private sessions = new Map<string, SandboxSession>();
  private fileWatchers = new Map<string, ReturnType<typeof watch>>();
  private sandboxDir: string;

  constructor(httpServer: HTTPServer, sandboxDir: string) {
    this.sandboxDir = sandboxDir;

    this.io = new Server(httpServer, {
      path: '/sandbox/socket.io',
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);

      // Unirse a un proyecto/sandbox
      socket.on('join', (data: { projectId: string }) => {
        const { projectId } = data;
        socket.join(projectId);

        this.sessions.set(socket.id, {
          projectId,
          socketId: socket.id,
          files: new Map()
        });

        console.log(`👥 Socket ${socket.id} joined project: ${projectId}`);

        // Notificar al cliente que se unió
        socket.emit('joined', { projectId, socketId: socket.id });

        // Iniciar watcher de archivos para este proyecto
        this.startFileWatcher(projectId);
      });

      // Recibir cambio de archivo del cliente
      socket.on('file:change', async (data: FileChangeMessage) => {
        const session = this.sessions.get(socket.id);
        if (!session) return;

        console.log(`📝 File changed: ${data.path}`);

        // Guardar archivo
        session.files.set(data.path, data.content);

        // Compilar y notificar a todos los clientes del proyecto
        const result = await this.compileFile(session.projectId, data.path, data.content);

        // Emitir a todos los sockets en el proyecto
        this.io.to(session.projectId).emit('compile:success', {
          files: result.files,
          errors: result.errors,
          timestamp: Date.now()
        });

        // Si hay errores, emitirlos también
        if (result.errors.length > 0) {
          this.io.to(session.projectId).emit('compile:error', {
            errors: result.errors,
            timestamp: Date.now()
          });
        }
      });

      // Recibir solicitud de compilación completa
      socket.on('compile:all', async (data: { files: Record<string, string> }) => {
        const session = this.sessions.get(socket.id);
        if (!session) return;

        socket.emit('compile:start', { timestamp: Date.now() });

        const result = await this.compileAll(session.projectId, data.files);

        if (result.errors.length === 0) {
          this.io.to(session.projectId).emit('compile:success', {
            files: result.files,
            timestamp: Date.now()
          });
        } else {
          this.io.to(session.projectId).emit('compile:error', {
            errors: result.errors,
            timestamp: Date.now()
          });
        }
      });

      // Ping/Pong para mantener conexión viva
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Desconexión
      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
        this.sessions.delete(socket.id);
      });
    });
  }

  private startFileWatcher(projectId: string) {
    // Evitar watchers duplicados
    if (this.fileWatchers.has(projectId)) return;

    const projectPath = join(this.sandboxDir, projectId);

    try {
      const watcher = watch(projectPath, { recursive: true }, async (eventType, filename) => {
        if (!filename) return;

        console.log(`👀 File ${eventType}: ${filename}`);

        try {
          const filePath = join(projectPath, filename);
          const content = await readFile(filePath, 'utf-8');

          // Notificar a todos los clientes del proyecto
          this.io.to(projectId).emit('file:change', {
            path: filename,
            content,
            eventType,
            timestamp: Date.now()
          });
        } catch (err) {
          console.error('Error reading file:', err);
        }
      });

      this.fileWatchers.set(projectId, watcher);
    } catch (err) {
      console.error('Error starting file watcher:', err);
    }
  }

  private async compileFile(projectId: string, path: string, content: string): Promise<{
    files: Record<string, string>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const files: Record<string, string> = {};

    const ext = path.split('.').pop()?.toLowerCase();

    try {
      switch (ext) {
        case 'ts':
        case 'tsx':
          // Aquí integraríamos esbuild o swc
          files[path.replace(/\.tsx?$/, '.js')] = this.transpileTypeScript(content);
          break;

        case 'scss':
        case 'sass':
          // Aquí integraríamos sass
          files[path.replace(/\.s[ac]ss$/, '.css')] = content;
          break;

        case 'jsx':
          // Transpilar JSX
          files[path.replace('.jsx', '.js')] = this.transpileJSX(content);
          break;

        default:
          files[path] = content;
      }
    } catch (err) {
      errors.push(`Error compiling ${path}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    return { files, errors };
  }

  private async compileAll(projectId: string, files: Record<string, string>): Promise<{
    files: Record<string, string>;
    errors: string[];
  }> {
    const errors: string[] = [];
    const compiledFiles: Record<string, string> = {};

    for (const [path, content] of Object.entries(files)) {
      const result = await this.compileFile(projectId, path, content);
      Object.assign(compiledFiles, result.files);
      errors.push(...result.errors);
    }

    return { files: compiledFiles, errors };
  }

  private transpileTypeScript(code: string): string {
    // Transpilación básica - en producción usar esbuild
    return code
      .replace(/:\s*(string|number|boolean|any|void|never)\b/g, '')
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
      .replace(/\u003c[^;\(\)\{\}]*?\u003e/g, '')
      .replace(/\s+as\s+\w+/g, '');
  }

  private transpileJSX(code: string): string {
    // Transpilación básica JSX -> JS
    return code
      // <Tag ...> -> React.createElement('Tag', ...)
      .replace(/\u003c(\w+)([^\u003e]*)\u003e/g, (match, tag, attrs) => {
        return `React.createElement('${tag}', ${this.parseAttrs(attrs)})`;
      })
      // </Tag> -> )
      .replace(/\u003c\/\w+\u003e/g, ')')
      // className -> class
      .replace(/className/g, 'class');
  }

  private parseAttrs(attrs: string): string {
    if (!attrs.trim()) return '{}';

    // Convertir atributos a objeto
    const attrObj: Record<string, string> = {};
    const matches = attrs.matchAll(/(\w+)={"([^"]+)"}/g);

    for (const match of matches) {
      attrObj[match[1]] = match[2];
    }

    return JSON.stringify(attrObj);
  }

  // Métodos públicos
  broadcast(projectId: string, event: string, data: any) {
    this.io.to(projectId).emit(event, data);
  }

  close() {
    // Cerrar todos los watchers
    for (const [projectId, watcher] of this.fileWatchers) {
      watcher.close();
    }
    this.fileWatchers.clear();

    // Cerrar servidor WebSocket
    this.io.close();
  }
}

export default SandboxWebSocketServer;
