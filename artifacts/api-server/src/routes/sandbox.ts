// ============================================================
// OpenCode Evolution - Sandbox Server Routes
// Endpoint para compilar y servir código de preview
// ============================================================

import { Router } from 'express';
import { spawn } from 'child_process';
import { mkdir, writeFile, readFile, access, rm } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

const router = Router();

// Directorio temporal para proyectos sandbox
const SANDBOX_DIR = process.env.SANDBOX_DIR || '/tmp/opencode-sandbox';

// Mapa de servidores sandbox activos
const activeSandboxes = new Map<string, {
  process: any;
  port: number;
  url: string;
  createdAt: Date;
}>();

interface SandboxFile {
  path: string;
  content: string;
}

interface CompileRequest {
  files: Record<string, string>;
  template?: 'vanilla' | 'react' | 'vue' | 'svelte' | 'typescript';
  install?: string[]; // paquetes npm a instalar
}

// ============================================================
// Compilador de archivos
// ============================================================

class FileCompiler {
  private files: Map<string, string>;

  constructor(files: Record<string, string>) {
    this.files = new Map(Object.entries(files));
  }

  async compile(): Promise<{
    html: string;
    files: SandboxFile[];
    errors: string[];
  }> {
    const errors: string[] = [];
    const compiledFiles: SandboxFile[] = [];
    let html = '';

    // Detectar tipo de proyecto basado en archivos
    const hasPackageJson = this.files.has('package.json');
    const hasIndexHtml = this.files.has('index.html');
    const hasMainTs = this.files.has('main.ts') || this.files.has('src/main.ts');
    const hasMainJs = this.files.has('main.js') || this.files.has('src/main.js');
    const hasAppTsx = this.files.has('App.tsx') || this.files.has('src/App.tsx');

    try {
      // Compilar TypeScript si existe
      if (hasMainTs || hasAppTsx || this.hasFileWithExtension('.ts', '.tsx')) {
        const tsResult = await this.compileTypeScript();
        compiledFiles.push(...tsResult.files);
        if (tsResult.errors.length > 0) {
          errors.push(...tsResult.errors);
        }
      }

      // Compilar SCSS/SASS si existe
      if (this.hasFileWithExtension('.scss', '.sass')) {
        const scssResult = await this.compileScss();
        compiledFiles.push(...scssResult.files);
        if (scssResult.errors.length > 0) {
          errors.push(...scssResult.errors);
        }
      }

      // Generar HTML si no existe
      if (hasIndexHtml) {
        html = this.files.get('index.html') || '';
      } else {
        html = this.generateHTML(compiledFiles);
      }

      // Agregar archivos estáticos (JS, CSS no compilados)
      for (const [path, content] of this.files) {
        if (path.endsWith('.js') || path.endsWith('.css')) {
          compiledFiles.push({ path, content });
        }
      }

    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Unknown compilation error');
    }

    return { html, files: compiledFiles, errors };
  }

  private hasFileWithExtension(...exts: string[]): boolean {
    for (const [path] of this.files) {
      if (exts.some(ext => path.endsWith(ext))) return true;
    }
    return false;
  }

  private async compileTypeScript(): Promise<{ files: SandboxFile[]; errors: string[] }> {
    const files: SandboxFile[] = [];
    const errors: string[] = [];

    // Usar esbuild o tsc para compilar
    // Por ahora, transpilación simple
    for (const [path, content] of this.files) {
      if (path.endsWith('.ts') || path.endsWith('.tsx')) {
        try {
          // Aquí integraríamos esbuild
          // Por ahora, simplemente renombramos a .js
          const jsPath = path.replace(/\.tsx?$/, '.js');
          const jsContent = this.transpileTS(content);
          files.push({ path: jsPath, content: jsContent });
        } catch (err) {
          errors.push(`Error compiling ${path}: ${err}`);
        }
      }
    }

    return { files, errors };
  }

  private transpileTS(tsCode: string): string {
    // Transpilación básica TypeScript -> JavaScript
    // En producción usar esbuild o sucrase
    return tsCode
      // Remover type annotations simples
      .replace(/:\s*(string|number|boolean|any|void|never)\b/g, '')
      // Remover interfaces
      .replace(/interface\s+\w+\s*\{[^}]*\}/g, '')
      // Remover type aliases
      .replace(/type\s+\w+\s*=\s*[^;]+;/g, '')
      // Remover generics simples
      .replace(/<[^;\(\)\{\}]*?>/g, '')
      // Remover 'as' assertions
      .replace(/\s+as\s+\w+/g, '');
  }

  private async compileScss(): Promise<{ files: SandboxFile[]; errors: string[] }> {
    const files: SandboxFile[] = [];
    const errors: string[] = [];

    // Aquí integraríamos sass/dart-sass
    // Por ahora, simplemente pasamos el CSS
    for (const [path, content] of this.files) {
      if (path.endsWith('.scss') || path.endsWith('.sass')) {
        const cssPath = path.replace(/\.s[ac]ss$/, '.css');
        files.push({ path: cssPath, content });
      }
    }

    return { files, errors };
  }

  private generateHTML(compiledFiles: SandboxFile[]): string {
    const jsFiles = compiledFiles.filter(f => f.path.endsWith('.js'));
    const cssFiles = compiledFiles.filter(f => f.path.endsWith('.css'));

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenCode Preview</title>
  ${cssFiles.map(f => `<link rel="stylesheet" href="/${f.path}">`).join('\n  ')}
  <script>
    // Interceptar console para enviar al padre
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    function sendToParent(type, args) {
      if (window.parent !== window) {
        window.parent.postMessage({
          type: 'console',
          level: type,
          args: Array.from(args).map(arg => {
            if (typeof arg === 'object') {
              try {
                return JSON.stringify(arg);
              } catch {
                return String(arg);
              }
            }
            return String(arg);
          })
        }, '*');
      }
    }

    console.log = function(...args) {
      originalConsole.log.apply(console, args);
      sendToParent('log', args);
    };

    console.error = function(...args) {
      originalConsole.error.apply(console, args);
      sendToParent('error', args);
    };

    console.warn = function(...args) {
      originalConsole.warn.apply(console, args);
      sendToParent('warn', args);
    };

    console.info = function(...args) {
      originalConsole.info.apply(console, args);
      sendToParent('info', args);
    };

    // Capturar errores no manejados
    window.onerror = function(message, filename, lineno, colno, error) {
      sendToParent('error', [message, 'at', filename + ':' + lineno]);
      return false;
    };

    window.onunhandledrejection = function(event) {
      sendToParent('error', ['Unhandled Promise Rejection:', event.reason]);
    };
  </script>
</head>
<body>
  <div id="root"></div>
  ${jsFiles.map(f => `<script src="/${f.path}"></script>`).join('\n  ')}
</body>
</html>`;
  }
}

// ============================================================
// Endpoints API
// ============================================================

// Compilar archivos y devolver HTML
router.post('/compile', async (req, res) => {
  try {
    const { files, template = 'vanilla' } = req.body as CompileRequest;

    if (!files || Object.keys(files).length === 0) {
      return res.status(400).json({
        error: 'No files provided'
      });
    }

    const compiler = new FileCompiler(files);
    const result = await compiler.compile();

    // Si hay errores críticos, devolverlos
    if (result.errors.length > 0 && !result.html) {
      return res.status(400).json({
        error: 'Compilation failed',
        errors: result.errors
      });
    }

    res.json({
      success: true,
      html: result.html,
      files: result.files,
      errors: result.errors.length > 0 ? result.errors : undefined
    });

  } catch (err) {
    console.error('Compilation error:', err);
    res.status(500).json({
      error: 'Internal compilation error',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Crear un sandbox persistente (servidor dev)
router.post('/create', async (req, res) => {
  try {
    const { files, install = [], template = 'vanilla' } = req.body as CompileRequest;
    const sandboxId = randomUUID();
    const sandboxPath = join(SANDBOX_DIR, sandboxId);

    // Crear directorio del sandbox
    await mkdir(sandboxPath, { recursive: true });

    // Escribir archivos
    for (const [path, content] of Object.entries(files)) {
      const fullPath = join(sandboxPath, path);
      await mkdir(join(fullPath, '..'), { recursive: true });
      await writeFile(fullPath, content);
    }

    // Encontrar puerto disponible
    const port = await findAvailablePort(3001);

    // Si necesita npm install
    if (install.length > 0 || files['package.json']) {
      // Crear package.json si no existe
      if (!files['package.json']) {
        await writeFile(
          join(sandboxPath, 'package.json'),
          JSON.stringify({
            name: `sandbox-${sandboxId}`,
            version: '1.0.0',
            type: 'module'
          }, null, 2)
        );
      }

      // Instalar dependencias
      await new Promise((resolve, reject) => {
        const npm = spawn('npm', ['install', ...install], {
          cwd: sandboxPath,
          stdio: 'pipe'
        });

        let output = '';
        npm.stdout.on('data', (data) => output += data);
        npm.stderr.on('data', (data) => output += data);

        npm.on('close', (code) => {
          if (code === 0) resolve(true);
          else reject(new Error(`npm install failed: ${output}`));
        });
      });
    }

    // Iniciar servidor Vite o http-server
    const viteProcess = spawn('npx', ['vite', '--port', port.toString(), '--host'], {
      cwd: sandboxPath,
      stdio: 'pipe'
    });

    // Esperar a que el servidor esté listo
    await new Promise((resolve, reject) => {
      let output = '';
      const timeout = setTimeout(() => {
        reject(new Error('Server start timeout'));
      }, 30000);

      viteProcess.stdout.on('data', (data) => {
        output += data;
        if (output.includes('Local:') || output.includes('ready')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });

      viteProcess.stderr.on('data', (data) => {
        output += data;
      });

      viteProcess.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Guardar referencia al sandbox
    const sandboxUrl = `http://localhost:${port}`;
    activeSandboxes.set(sandboxId, {
      process: viteProcess,
      port,
      url: sandboxUrl,
      createdAt: new Date()
    });

    res.json({
      success: true,
      sandboxId,
      url: sandboxUrl,
      port
    });

  } catch (err) {
    console.error('Sandbox creation error:', err);
    res.status(500).json({
      error: 'Failed to create sandbox',
      message: err instanceof Error ? err.message : 'Unknown error'
    });
  }
});

// Obtener URL de un sandbox
router.get('/:sandboxId/url', (req, res) => {
  const { sandboxId } = req.params;
  const sandbox = activeSandboxes.get(sandboxId);

  if (!sandbox) {
    return res.status(404).json({ error: 'Sandbox not found' });
  }

  res.json({
    sandboxId,
    url: sandbox.url,
    port: sandbox.port,
    createdAt: sandbox.createdAt
  });
});

// Eliminar un sandbox
router.delete('/:sandboxId', async (req, res) => {
  const { sandboxId } = req.params;
  const sandbox = activeSandboxes.get(sandboxId);

  if (sandbox) {
    // Matar proceso
    sandbox.process.kill();
    activeSandboxes.delete(sandboxId);

    // Limpiar archivos
    try {
      const sandboxPath = join(SANDBOX_DIR, sandboxId);
      await rm(sandboxPath, { recursive: true, force: true });
    } catch {
      // Ignorar errores de limpieza
    }
  }

  res.json({ success: true });
});

// Listar sandboxes activos
router.get('/', (req, res) => {
  const sandboxes = Array.from(activeSandboxes.entries()).map(([id, data]) => ({
    id,
    url: data.url,
    port: data.port,
    createdAt: data.createdAt
  }));

  res.json({ sandboxes });
});

// ============================================================
// Helpers
// ============================================================

async function findAvailablePort(startPort: number): Promise<number> {
  const net = await import('net');

  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(startPort, () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        // Puerto en uso, intentar siguiente
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(err);
      }
    });
  });
}

// Cleanup periódico de sandboxes inactivos
setInterval(() => {
  const now = new Date();
  const maxAge = 1000 * 60 * 60; // 1 hora

  for (const [id, sandbox] of activeSandboxes) {
    if (now.getTime() - sandbox.createdAt.getTime() > maxAge) {
      sandbox.process.kill();
      activeSandboxes.delete(id);

      // Limpiar archivos
      const sandboxPath = join(SANDBOX_DIR, id);
      rm(sandboxPath, { recursive: true, force: true }).catch(() => {});
    }
  }
}, 1000 * 60 * 10); // Cada 10 minutos

export default router;
