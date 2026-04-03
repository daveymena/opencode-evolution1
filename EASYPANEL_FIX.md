# ============================================================
# FIX PARA EASYPANEL - OpenCode Evolution
# ============================================================

## 🔴 PROBLEMA

EasyPanel está intentando ejecutar `/app/docker-serve.mjs` que NO existe en el
repositorio original, causando el error:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

## 🟢 SOLUCIÓN

He creado los siguientes archivos que debes subir al repositorio:

### 1. docker-serve.mjs
Punto de entrada que maneja la falta de dependencias y busca el servidor
en múltiples ubicaciones posibles. Incluye:
- Detección automática del servidor compilado
- Fallback a pnpm si no encuentra el build
- Manejo graceful de señales de terminación
- Logs informativos

### 2. docker-entrypoint.sh
Script bash alternativo más robusto que:
- Instala dependencias si no existen
- Compila automáticamente si es necesario
- Soporta múltiples ubicaciones del servidor

### 3. Dockerfile.easypanel
Versión optimizada del Dockerfile que:
- Usa caché eficientemente (copia package.json primero)
- Instala todas las herramientas necesarias
- Incluye healthcheck
- Usa el entrypoint correcto

### 4. easypanel-v2.yml
Configuración mejorada para EasyPanel con:
- Variables de entorno bien documentadas
- Volúmenes persistentes configurados
- Recursos ajustables
- Soporte para Ollama (opcional)

## 📋 INSTRUCCIONES PARA EASYPANEL

### Opción A: Usar Dockerfile (Recomendada)

1. **Sube los archivos a tu repositorio:**
   ```bash
   git add docker-serve.mjs docker-entrypoint.sh Dockerfile.easypanel easypanel-v2.yml
   git commit -m "Fix: Agregar entrypoints para Docker/EasyPanel"
   git push
   ```

2. **Renombra los archivos:**
   - `Dockerfile.easypanel` → `Dockerfile`
   - `easypanel-v2.yml` → `easypanel.yml`

3. **En EasyPanel:**
   - Ve a tu aplicación
   - Selecciona "Redeploy" o "Rebuild"
   - EasyPanel usará automáticamente el nuevo Dockerfile

4. **Configura las variables de entorno en la UI de EasyPanel:**
   - `DATABASE_URL` (requerido)
   - `GROQ_API_KEY` (recomendado - gratuito)
   - `OPENROUTER_API_KEY` (opcional)
   - `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (si usas Supabase)

### Opción B: Usar Docker Compose

1. Sube el archivo `docker-compose.easypanel.yml`

2. En EasyPanel, selecciona "Docker Compose" en lugar de "Dockerfile"

3. Configura las variables de entorno

## 🔧 VARIABLES DE ENTORNO REQUERIDAS

### Mínimas (para funcionar):
```
DATABASE_URL=postgresql://usuario:password@host:puerto/db
PORT=3000
```

### Recomendadas (con APIs gratuitas):
```
DATABASE_URL=postgresql://...
GROQ_API_KEY=tu-api-key-de-groq
OPENROUTER_API_KEY=tu-api-key-de-openrouter
PORT=3000
```

### Completas:
Ver el archivo `easypanel-v2.yml` para todas las opciones.

## 🚀 API KEYS GRATUITAS

Para empezar sin pagar, obtén estas APIs gratuitas:

1. **Groq** (muy rápido, modelos Llama/Mixtral): https://console.groq.com
2. **OpenRouter** (acceso a múltiples modelos): https://openrouter.ai
3. **Cerebras** (modelos propios): https://cerebras.ai
4. **Together AI** (varios modelos open source): https://together.ai

## 🐛 DEBUGGING

Si sigue fallando:

1. **Revisa los logs de EasyPanel** - debería mostrar:
   ```
   ✅ Servidor encontrado en: artifacts/api-server/dist/index.js
   🚀 Iniciando servidor...
   ```

2. **Verifica que las dependencias se instalaron:**
   ```bash
   # En la terminal de EasyPanel
   ls -la node_modules/.bin/pnpm
   ```

3. **Intenta reconstruir manualmente:**
   ```bash
   pnpm install
   pnpm --filter @workspace/api-server run build
   ```

## 📁 ARCHIVOS CREADOS

```
docker-serve.mjs           → Entrypoint Node.js (recomendado)
docker-entrypoint.sh       → Entrypoint Bash (alternativa)
Dockerfile.easypanel       → Dockerfile optimizado
easypanel-v2.yml          → Config EasyPanel mejorada
docker-compose.easypanel.yml → Alternativa con docker-compose
EASYPANEL_FIX.md           → Esta documentación
```

## ✅ CHECKLIST PARA DESPLIEGUE

- [ ] Subir todos los archivos al repositorio
- [ ] Renombrar `Dockerfile.easypanel` a `Dockerfile`
- [ ] Renombrar `easypanel-v2.yml` a `easypanel.yml`
- [ ] Configurar `DATABASE_URL` en EasyPanel
- [ ] Configurar al menos una API key (GROQ recomendado)
- [ ] Verificar que el puerto 3000 esté expuesto
- [ ] Hacer "Deploy" en EasyPanel
- [ ] Verificar logs para confirmar inicio exitoso

## 🆘 SOPORTE

Si continúas teniendo problemas:
1. Copia los logs completos de EasyPanel
2. Verifica que el repositorio tenga el `docker-serve.mjs`
3. Asegúrate de que EasyPanel esté usando la última versión del código
