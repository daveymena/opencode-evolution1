// ============================================================
// OpenCode Evolution - Iframe Inject Script
// Script que se inyecta en el iframe para capturar logs y HMR
// ============================================================

(function() {
  'use strict';

  // Evitar múltiples inyecciones
  if (window.__OPENCODE_SANDBOX__) return;
  window.__OPENCODE_SANDBOX__ = true;

  // Colores para la consola
  const COLORS = {
    log: '#3b82f6',
    info: '#10b981',
    warn: '#f59e0b',
    error: '#ef4444',
    debug: '#8b5cf6'
  };

  // ============================================================
  // Interceptar Console
  // ============================================================
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug
  };

  function formatArgs(args) {
    return args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      }
      return String(arg);
    });
  }

  function sendToParent(type, args) {
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'console',
        level: type,
        args: formatArgs(args),
        timestamp: Date.now()
      }, '*');
    }
  }

  console.log = function(...args) {
    originalConsole.log.apply(console, args);
    sendToParent('log', args);
  };

  console.info = function(...args) {
    originalConsole.info.apply(console, args);
    sendToParent('info', args);
  };

  console.warn = function(...args) {
    originalConsole.warn.apply(console, args);
    sendToParent('warn', args);
  };

  console.error = function(...args) {
    originalConsole.error.apply(console, args);
    sendToParent('error', args);
  };

  console.debug = function(...args) {
    originalConsole.debug.apply(console, args);
    sendToParent('debug', args);
  };

  // ============================================================
  // Capturar Errores Globales
  // ============================================================
  window.onerror = function(message, filename, lineno, colno, error) {
    sendToParent('error', [
      `🚨 Uncaught Error: ${message}`,
      `   at ${filename}:${lineno}:${colno}`
    ]);

    if (error?.stack) {
      sendToParent('error', [error.stack]);
    }

    return false;
  };

  window.onunhandledrejection = function(event) {
    sendToParent('error', [
      `🚨 Unhandled Promise Rejection:`,
      event.reason
    ]);
  };

  // ============================================================
  // Hot Module Replacement (HMR)
  // ============================================================
  const stylesheets = new Map();
  const scripts = new Map();

  window.addEventListener('message', function(event) {
    if (event.data?.type === 'HMR_UPDATE') {
      handleHMRUpdate(event.data.files);
    }

    if (event.data?.type === 'FULL_RELOAD') {
      window.location.reload();
    }
  });

  function handleHMRUpdate(files) {
    console.log('🔄 Hot updating...');

    Object.entries(files).forEach(([path, content]) => {
      const ext = path.split('.').pop()?.toLowerCase();

      if (ext === 'css' || ext === 'scss' || ext === 'sass') {
        updateStylesheet(path, content);
      } else if (ext === 'js' || ext === 'ts' || ext === 'jsx' || ext === 'tsx') {
        updateScript(path, content);
      } else if (ext === 'html') {
        // HTML requiere full reload
        window.location.reload();
      }
    });

    console.log('✅ Hot update complete');
  }

  function updateStylesheet(path, content) {
    let link = stylesheets.get(path);

    if (link) {
      // Actualizar existente
      link.href = `data:text/css;base64,${btoa(unescape(encodeURIComponent(content)))}`;
    } else {
      // Crear nueva hoja de estilos
      link = document.createElement('style');
      link.textContent = content;
      link.setAttribute('data-source', path);
      document.head.appendChild(link);
      stylesheets.set(path, link);
    }

    console.log(`🎨 Updated styles: ${path}`);
  }

  function updateScript(path, content) {
    try {
      // Crear un nuevo script y ejecutarlo
      const script = document.createElement('script');
      script.type = 'module';
      script.textContent = content;
      script.setAttribute('data-source', path);

      // Remover script anterior si existe
      const oldScript = document.querySelector(`script[data-source="${path}"]`);
      if (oldScript) {
        oldScript.remove();
      }

      document.body.appendChild(script);
      scripts.set(path, script);

      console.log(`📜 Updated script: ${path}`);
    } catch (err) {
      console.error(`❌ Failed to update script ${path}:`, err);
    }
  }

  // ============================================================
  // Utilidades para el usuario
  // ============================================================
  window.sandbox = {
    // Limpiar la consola
    clear: function() {
      console.clear();
      sendToParent('clear', []);
    },

    // Recargar la página
    reload: function() {
      window.location.reload();
    },

    // Obtener info del sandbox
    info: function() {
      return {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        location: window.location.href
      };
    },

    // Ping al parent
    ping: function() {
      sendToParent('ping', ['pong']);
    }
  };

  // Notificar que el sandbox está listo
  sendToParent('ready', [{ timestamp: Date.now() }]);
  console.log('%c🚀 OpenCode Sandbox Ready', `color: ${COLORS.info}; font-size: 14px; font-weight: bold;`);

})();
