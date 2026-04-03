# 🌐 Guía de Previsualización en OpenCode

## Puertos Disponibles

Tu instalación de OpenCode tiene 3 puertos configurados:

### 1. Puerto 3000 - OpenCode UI
- **URL**: `http://tu-dominio:3000`
- **Uso**: Interfaz principal de OpenCode
- **Descripción**: Aquí trabajas con la IA, creas proyectos, escribes código

### 2. Puerto 8080 - Preview Estático
- **URL**: `http://tu-dominio:8080`
- **Uso**: Ver archivos HTML/CSS/JS estáticos
- **Descripción**: Servidor HTTP simple que sirve todo el contenido de `/root/workspace`

### 3. Puerto 5173 - Dev Server (Auto)
- **URL**: `http://tu-dominio:5173`
- **Uso**: Aplicaciones con hot-reload (React, Vue, Vite, etc.)
- **Descripción**: Se inicia automáticamente cuando detecta `package.json` con script `dev` o `start`

## 📋 Cómo Previsualizar tus Páginas

### Opción 1: Archivos HTML Simples

1. Crea un archivo en OpenCode:
   ```html
   <!-- /root/workspace/index.html -->
   <!DOCTYPE html>
   <html>
   <head>
     <title>Mi Página</title>
   </head>
   <body>
     <h1>Hola Mundo</h1>
   </body>
   </html>
   ```

2. Abre en tu navegador:
   ```
   http://tu-dominio:8080/index.html
   ```

### Opción 2: Aplicaciones con Framework (React, Vue, etc.)

1. OpenCode crea un proyecto con `package.json`:
   ```json
   {
     "scripts": {
       "dev": "vite"
     }
   }
   ```

2. El watcher detecta el proyecto y ejecuta `npm install` + `npm run dev`

3. Abre en tu navegador:
   ```
   http://tu-dominio:5173
   ```

## 🔧 Configuración en EasyPanel

Asegúrate de exponer los 3 puertos:

1. **Puerto 3000**: OpenCode UI (principal)
2. **Puerto 8080**: Preview estático
3. **Puerto 5173**: Dev server (opcional, solo si usas frameworks)

## 💡 Consejos

- **Archivos estáticos**: Usa puerto 8080 para HTML/CSS/JS simples
- **Aplicaciones React/Vue**: Usa puerto 5173 (se inicia automáticamente)
- **Debugging**: Revisa logs con `docker logs <container-id>`
- **Estructura**: Todos los archivos van en `/root/workspace`

## 🐛 Troubleshooting

### No veo mi página en puerto 8080
- Verifica que el archivo esté en `/root/workspace`
- Revisa la ruta: `http://tu-dominio:8080/ruta/al/archivo.html`

### Puerto 5173 no funciona
- Verifica que exista `package.json` con script `dev` o `start`
- Verifica que exista carpeta `src/` o archivo `index.html`
- Revisa logs: `docker exec <container> cat /tmp/dev.log`

### Cambios no se reflejan
- Puerto 8080: Refresca el navegador (Ctrl+F5)
- Puerto 5173: Hot-reload automático (si está configurado en Vite/Webpack)
