#!/usr/bin/env node
// ============================================================
// OpenCode - Docker Serve Entrypoint
// Punto de entrada alternativo para EasyPanel y Docker
// ============================================================

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Configuración
const CONFIG = {
  // Intentar encontrar el servidor API en varias ubicaciones posibles
  possiblePaths: [
    './artifacts/api-server/dist/index.js',
    './api-server/dist/index.js',
    './artifacts/api-server/dist/server.js',
    './api-server/dist/server.js',
    './artifacts/api-server/index.js',
    './api-server/index.js',
  ],
  // Comando pnpm como fallback
  pnpmCommand: ['pnpm', '--filter', '@workspace/api-server', 'run', 'start'],
  // Puerto por defecto
  port: process.env.PORT || 3000
};

console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║  OpenCode Evolution - Docker Serve                         ║');
console.log('╚═══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`📁 Directorio de trabajo: ${process.cwd()}`);
console.log(`🔌 Puerto configurado: ${CONFIG.port}`);
console.log('');

// Función para encontrar el archivo del servidor
function findServerPath() {
  for (const path of CONFIG.possiblePaths) {
    const fullPath = join(process.cwd(), path);
    if (existsSync(fullPath)) {
      console.log(`✅ Servidor encontrado en: ${path}`);
      return fullPath;
    }
  }
  return null;
}

// Función para ejecutar con pnpm
function runWithPnpm() {
  console.log('🚀 Iniciando con PNPM...');
  console.log(`   Comando: ${CONFIG.pnpmCommand.join(' ')}`);
  console.log('');

  const [cmd, ...args] = CONFIG.pnpmCommand;
  const proc = spawn(cmd, args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: CONFIG.port.toString()
    }
  });

  proc.on('error', (err) => {
    console.error('❌ Error al iniciar con PNPM:', err.message);
    process.exit(1);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ El proceso salió con código: ${code}`);
    }
    process.exit(code);
  });

  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, cerrando gracefully...');
    proc.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, cerrando...');
    proc.kill('SIGINT');
  });
}

// Función para ejecutar directamente con Node
function runWithNode(serverPath) {
  console.log('🚀 Iniciando servidor directamente con Node...');
  console.log(`   Archivo: ${serverPath}`);
  console.log('');

  const proc = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: CONFIG.port.toString()
    }
  });

  proc.on('error', (err) => {
    console.error('❌ Error al iniciar el servidor:', err.message);
    // Intentar con pnpm como fallback
    console.log('🔄 Intentando con PNPM como fallback...');
    runWithPnpm();
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ El proceso salió con código: ${code}`);
    }
    process.exit(code);
  });

  // Manejar señales de terminación
  process.on('SIGTERM', () => {
    console.log('\n🛑 Recibida señal SIGTERM, cerrando gracefully...');
    proc.kill('SIGTERM');
  });

  process.on('SIGINT', () => {
    console.log('\n🛑 Recibida señal SIGINT, cerrando...');
    proc.kill('SIGINT');
  });
}

// Verificar si pnpm está disponible
function checkPnpm() {
  return new Promise((resolve) => {
    const check = spawn('pnpm', ['--version'], { shell: true });
    check.on('error', () => resolve(false));
    check.on('exit', (code) => resolve(code === 0));
  });
}

// Función principal
async function main() {
  console.log('🔍 Verificando entorno...\n');

  // Verificar que estamos en el directorio correcto
  const packageJsonPath = join(process.cwd(), 'package.json');
  if (!existsSync(packageJsonPath)) {
    console.error('❌ No se encontró package.json en el directorio actual');
    console.error('   Asegúrate de que el volumen esté montado correctamente');
    process.exit(1);
  }

  // Buscar el servidor compilado
  const serverPath = findServerPath();

  if (serverPath) {
    // Si encontramos el archivo compilado, ejecutarlo directamente
    runWithNode(serverPath);
  } else {
    // Si no, usar pnpm
    const hasPnpm = await checkPnpm();
    if (hasPnpm) {
      runWithPnpm();
    } else {
      console.error('❌ No se encontró pnpm ni el servidor compilado');
      console.error('   Asegúrate de que las dependencias estén instaladas');
      process.exit(1);
    }
  }
}

// Ejecutar
main().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
