#!/usr/bin/env node
// ============================================================
// OpenCode - Docker Serve Entrypoint v4
// Sin dependencias externas - Solo Node.js nativo
// ============================================================

import { existsSync } from 'fs';
import { join } from 'path';
import http from 'http';
import { readFile } from 'fs/promises';

// Configuración
const PORT = process.env.PORT || 3000;

// Buscar directorio dist en múltiples ubicaciones
const SEARCH_DIRS = [
  join(process.cwd(), 'dist'),
  join(process.cwd(), 'artifacts', 'opencode-ui', 'dist'),
  join(process.cwd(), 'artifacts', 'opencode-evolved', 'dist'),
  join(process.cwd(), 'opencode-ui', 'dist'),
  join(process.cwd(), '..', 'dist'),
];

let STATIC_DIR = null;
for (const dir of SEARCH_DIRS) {
  if (existsSync(dir)) {
    STATIC_DIR = dir;
    break;
  }
}

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  OpenCode Evolution - Server v4 (Standalone)             ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`📁 Directorio: ${process.cwd()}`);
console.log(`🔌 Puerto: ${PORT}`);
console.log(`📂 Static: ${STATIC_DIR || 'NO ENCONTRADO'}`);
console.log('');

// Verificar si el build existe
if (!STATIC_DIR) {
  console.error('❌ No se encontró el directorio dist/');
  console.error('   Buscado en:', SEARCH_DIRS.join(', '));
  process.exit(1);
}

// Servidor HTTP simple sin express
const server = http.createServer(async (req, res) => {
  // Health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Skip query strings for file lookup
  const urlPath = req.url.split('?')[0];
  const url = urlPath === '/' ? '/index.html' : urlPath;
  const filePath = join(STATIC_DIR, url);

  const ext = filePath.split('.').pop();
  const contentType = {
    'html': 'text/html',
    'js': 'application/javascript',
    'css': 'text/css',
    'json': 'application/json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon',
    'woff': 'font/woff',
    'woff2': 'font/woff2',
    'ttf': 'font/ttf',
    'eot': 'application/vnd.ms-fontobject'
  }[ext] || 'application/octet-stream';

  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch {
    // SPA fallback - serve index.html
    const indexPath = join(STATIC_DIR, 'index.html');
    try {
      const indexContent = await readFile(indexPath);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(indexContent);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }
});

server.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
  console.log('');
});

// Manejar errores
server.on('error', (err) => {
  console.error('❌ Error del servidor:', err.message);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  server.close(() => {
    process.exit(0);
  });
});
