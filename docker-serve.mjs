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
const STATIC_DIR = join(process.cwd(), 'dist');

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  OpenCode Evolution - Server v4 (Standalone)             ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`📁 Directorio: ${process.cwd()}`);
console.log(`🔌 Puerto: ${PORT}`);
console.log(`📂 Static: ${STATIC_DIR}`);
console.log('');

// Verificar si el build existe
if (!existsSync(STATIC_DIR)) {
  console.error('❌ No se encontró el directorio dist/');
  console.error('   Ejecuta: npm run build');
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

  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = join(STATIC_DIR, url);

  try {
    const content = await readFile(filePath);
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
      'ico': 'image/x-icon'
    }[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    // Si no encuentra el archivo, servir index.html (SPA)
    try {
      const indexContent = await readFile(join(STATIC_DIR, 'index.html'));
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
