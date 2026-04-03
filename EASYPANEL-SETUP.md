# ⚙️ Configuración Recomendada para EasyPanel

## 🚨 Problema: Error 502 durante instalación de dependencias

El error 502 ocurre cuando el contenedor se queda sin recursos (RAM/CPU) al instalar dependencias con `npm install`.

## ✅ Soluciones Implementadas

### 1. Sistema de Cache Externo
- ✓ Dependencias instaladas en `/root/.cache/projects/<nombre-proyecto>/`
- ✓ Workspace limpio, solo código fuente
- ✓ Symlinks automáticos desde workspace a cache
- ✓ Reduce uso de memoria y espacio en disco
- ✓ Múltiples proyectos pueden compartir dependencias

### 2. Optimizaciones en el código
- ✓ Límite de memoria Node.js: 512MB por proceso
- ✓ NPM sin audit/fund (más rápido)
- ✓ Instalación con `--prefer-offline`
- ✓ Watcher con delays más largos (15s)
- ✓ Flag de instalación para evitar múltiples procesos

### 2. Configuración Requerida en EasyPanel

#### Recursos Mínimos Recomendados:
```
RAM: 2GB mínimo (4GB recomendado)
CPU: 1 core mínimo (2 cores recomendado)
```

#### Variables de Entorno:
```bash
# API Keys (al menos una)
ANTHROPIC_API_KEY=tu_key_aqui
# o
OPENAI_API_KEY=tu_key_aqui
# o
OPENCODE_API_KEY=tu_key_aqui

# Git (opcional)
GIT_REPO_URL=https://TOKEN@github.com/usuario/repo.git
GIT_USER_NAME=Tu Nombre
GIT_USER_EMAIL=tu@email.com

# OpenClaw (opcional)
OPENCLAW_GATEWAY_TOKEN=tu_token_secreto
TELEGRAM_BOT_TOKEN=tu_bot_token
```

#### Puertos a Exponer:
```
3000 → OpenCode UI (principal)
8080 → Preview estático
5173 → Dev server (opcional)
18789 → OpenClaw gateway (opcional)
```

#### Volúmenes Persistentes:
```
/root/.local/share/opencode → Sesiones, historial, DB
/root/workspace → Código fuente (sin node_modules)
/root/.cache/projects → Dependencias npm (node_modules)
```

**Importante**: El workspace NO contiene `node_modules` reales, solo symlinks al cache. Esto mantiene el workspace limpio y reduce el uso de memoria.

## 🔧 Troubleshooting

### Error 502 persiste
1. **Aumentar RAM** en EasyPanel a 4GB
2. **Aumentar timeout** del proxy/load balancer
3. **Verificar logs**:
   ```bash
   docker logs <container-id> --tail 100
   ```

### Instalación de dependencias muy lenta
- Es normal, `npm install` puede tardar 2-5 minutos
- El contenedor NO se reinicia, solo espera
- Verás en logs: "→ Instalando dependencias (esto puede tardar)..."

### Dev server no inicia
1. Verifica que exista `package.json` con script `dev` o `start`
2. Verifica que exista carpeta `src/` o archivo `index.html`
3. Revisa logs del dev server:
   ```bash
   docker exec <container-id> cat /tmp/dev.log
   ```

### Contenedor se reinicia constantemente
1. Verifica que `GIT_REPO_URL` sea correcto (con el "1" al final)
2. Verifica que tengas al menos una API key configurada
3. Revisa logs completos:
   ```bash
   docker logs <container-id> --tail 200
   ```

## 📊 Monitoreo

### Ver uso de recursos:
```bash
docker stats <container-id>
```

### Ver logs en tiempo real:
```bash
docker logs -f <container-id>
```

### Ver logs del watcher:
```bash
docker exec <container-id> cat /tmp/dev.log
docker exec <container-id> cat /tmp/preview.log
```

## 🎯 Mejores Prácticas

1. **No crear proyectos muy grandes** al inicio
2. **Esperar** a que termine `npm install` antes de continuar
3. **Usar modelos más ligeros** (Gemini Flash, GPT-4o Mini) para tareas simples
4. **Monitorear RAM** en EasyPanel dashboard
5. **Configurar volúmenes** para no perder datos

## 🆘 Si nada funciona

1. Elimina el contenedor en EasyPanel
2. Recrea con 4GB RAM mínimo
3. Configura solo las variables esenciales:
   ```
   ANTHROPIC_API_KEY=tu_key
   ```
4. NO configures `GIT_REPO_URL` al inicio
5. Espera 2-3 minutos después del deploy
6. Accede a `https://tu-dominio/`

## 📞 Soporte

Si el problema persiste, comparte:
1. Logs completos: `docker logs <container-id> --tail 200`
2. Uso de recursos: `docker stats <container-id>`
3. Configuración de RAM/CPU en EasyPanel
