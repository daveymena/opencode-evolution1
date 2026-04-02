# OpenCode Evolution - EasyPanel Setup Guide

## 📋 Prerrequisitos

- Cuenta en EasyPanel
- Servidor Linux con Docker instalado
- Git configurado en el servidor
- Dominio (opcional, pero recomendado)

---

## 🚀 Pasos de Instalación

### 1. **Clonar el Repositorio**

En tu servidor EasyPanel, clona el repositorio:

```bash
cd /opt/apps  # o el directorio que uses en EasyPanel
git clone https://github.com/tu-usuario/opencode-evolution.git
cd opencode-evolution
```

### 2. **Crear Aplicación en EasyPanel**

#### 2.1 Desde Dashboard de EasyPanel:
- Click en **"Create New Application"**
- Selecciona **"Docker"** como tipo
- Nombre: `opencode-evolved`
- Description: `OpenCode IDE con IA`

#### 2.2 Configurar Source Code:
- Tipo: **Git Repository**
- Repository URL: `https://github.com/tu-usuario/opencode-evolution.git`
- Branch: `main`
- Opción: ✅ Auto-deploy on push

#### 2.3 Configurar Build:
- Build Type: **Docker Compose**
- Compose File: `docker-compose.yml`
- Build Context: `./`

---

## 🔧 Configuración de Variables de Entorno

En **Settings → Environment Variables**, añade:

```env
# ============ DATABASE ============
POSTGRES_USER=opencode
POSTGRES_PASSWORD=<genera-una-contraseña-fuerte>
POSTGRES_DB=opencode_evolved
POSTGRES_PORT=5432

# ============ APPLICATION ============
NODE_ENV=production
LOG_LEVEL=info

# ============ API ============
API_URL=http://api:3001

# ============ OPENCODE AI (elige al menos uno) ============
# ANTHROPIC_API_KEY=sk-ant-...
# GROQ_API_KEY=gsk_...
# OPENAI_API_KEY=sk-...
# GOOGLE_API_KEY=...

# ============ OPCIONAL: GIT INTEGRATION ============
# GIT_USER_NAME=OpenCode Bot
# GIT_USER_EMAIL=opencode@localhost
# GIT_REPO_URL=https://github.com/tu-usuario/tu-repo.git
# GIT_TOKEN=ghp_xxxxx

# ============ OPCIONAL: PAGOS ============
# MERCADO_PAGO_PUBLIC_KEY=
# MERCADOPAGO_ACCESS_TOKEN=
# PAYPAL_CLIENT_ID=
```

### ⚠️ Importante:
- **POSTGRES_PASSWORD**: Usa una contraseña fuerte y única
- **ANTHROPIC_API_KEY**: Obtenla de https://console.anthropic.com
- Guarda estas variables en un lugar seguro

---

## 📦 Configurar Puertos

En **Settings → Ports**:

| Puerto | Tipo | Servicio | Público |
|--------|------|---------|---------|
| 3000 | TCP | Frontend | ✅ Sí |
| 3001 | TCP | API | ❌ No |
| 5432 | TCP | PostgreSQL | ❌ No |

### Configurar Dominio (Recomendado):

En **Settings → Domains**:
- Añadir dominio: `opencode.tudominio.com`
- Certificado SSL: Auto (Let's Encrypt)
- Puerto: 3000

---

## 💾 Volúmenes Persistentes

En **Settings → Volumes**, asegúrate de que estén configurados:

```
/root/.local/share/opencode  → opencode_data
/root/workspace              → opencode_workspace
/root/projects               → opencode_projects
/var/lib/postgresql/data     → postgres_data
```

### ✅ Verificar en EasyPanel:
1. Ir a Settings
2. Verificar que los volúmenes estén listados
3. Asegurar que tengan suficiente espacio (al menos 10GB recomendado)

---

## 🚀 Deploy

### Opción 1: Deploy Automático
1. Click en **"Deploy"** en el dashboard
2. Esperar a que se construya (5-10 minutos la primera vez)
3. Ver logs en **"Logs"** → **"Build"**

### Opción 2: Deploy Manual
```bash
# En tu servidor
cd /opt/apps/opencode-evolution

# Actualizar código
git pull origin main

# Reconstruir Docker
docker-compose build --no-cache

# Reiniciar servicios
docker-compose down
docker-compose up -d
```

### Verificar Deploy
1. Ir a tu dominio: `https://opencode.tudominio.com`
2. Esperar carga inicial (2-3 minutos)
3. Ver logs: Click en **"Logs"** en EasyPanel

---

## 🔍 Verificación Post-Deploy

### 1. **Health Check**
```bash
curl -s https://opencode.tudominio.com/api/healthz | jq
# Respuesta esperada:
# {
#   "status": "ok"
# }
```

### 2. **Ver Logs en EasyPanel**
- Settings → Logs
- Frontend: Ver si hay errores
- API: Verificar que está corriendo
- DB: Verificar que PostgreSQL está listo

### 3. **Test Funcionalidad**
1. Abrir https://opencode.tudominio.com
2. Crear nuevo proyecto
3. Crear archivo de prueba
4. Enviar mensaje a IA (si está configurada)

---

## 🐛 Troubleshooting

### Frontend muestra "Loading..." infinitamente

**Causa**: API no accesible

**Solución**:
1. Verificar logs del contenedor API
2. Revisar conexión a BD en logs
3. Reiniciar contenedor: `docker-compose restart api`

### Errores de conexión a BD

**Causa**: PostgreSQL no está listo

**Solución**:
```bash
# Entrar al servidor
docker-compose logs db

# Si ves errores, reiniciar:
docker-compose restart db
```

### Base de datos corrupta

**Solución**:
```bash
# ADVERTENCIA: Esto elimina la BD
docker volume rm opencode-evolution_postgres_data

# Reiniciar para recrear BD
docker-compose up -d db
```

### Migraciones de BD no aplican

**Causa**: Las migraciones fallan al iniciar

**Solución**:
```bash
docker-compose exec api pnpm --filter @workspace/db run push
```

### Memoria insuficiente

**Síntoma**: Contenedor se reinicia constantemente

**Solución en EasyPanel**:
1. Settings → Resources
2. Aumentar Memory Limit (ej: 2GB → 4GB)
3. Aumentar Swap (ej: 1GB → 2GB)
4. Reiniciar aplicación

---

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
# Frontend
docker-compose logs -f frontend

# API Server
docker-compose logs -f api

# PostgreSQL
docker-compose logs -f db
```

### Métricas en EasyPanel
- Ir a **"Monitoring"**
- Ver CPU, RAM, Disk, Network
- Alertas si usos > 80%

---

## 🔐 Seguridad

### Cambiar Contraseña BD después del Deploy

```bash
# Acceder al contenedor PostgreSQL
docker exec -it opencode_db psql -U opencode -d opencode_evolved

# En psql:
ALTER USER opencode WITH PASSWORD 'nueva-contraseña-fuerte';
```

### Habilitar HTTPS (Recomendado)

En **Settings → Domains**:
- ✅ Force HTTPS
- ✅ Auto-renew certificate

### Backups Automáticos

En **Settings → Backups**:
- Frecuencia: Diaria
- Retención: 7 días
- Destino: S3 (si está disponible)

---

## 🔄 Actualizaciones

### Actualizar OpenCode a Nueva Versión

1. En tu máquina local:
```bash
git pull origin main
git push origin main  # Si hiciste cambios locales
```

2. En EasyPanel:
   - Auto-deploy se activa automáticamente
   - O click en **"Deploy"** manualmente

3. Seguir migraciones si hay cambios en BD:
```bash
docker-compose exec api pnpm --filter @workspace/db run push
```

---

## 📞 Soporte

### Si algo no funciona:

1. **Ver Logs en EasyPanel**
   - Mostrar los últimos 100 líneas

2. **Revisar Documentación**
   - README.md del proyecto
   - OpenCode Docs: https://opencode.ai/docs

3. **Reportar Bug**
   - GitHub Issues: https://github.com/tu-usuario/opencode-evolution/issues

---

## 📋 Checklist Post-Deploy

- [ ] ✅ Dominio apunta a la aplicación
- [ ] ✅ HTTPS funcionando correctamente
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ API responde en `/api/healthz`
- [ ] ✅ BD conectada (logs sin errores)
- [ ] ✅ Puedo crear un proyecto
- [ ] ✅ Puedo crear archivos
- [ ] ✅ Mensajes de IA funcionan (si está configurado)
- [ ] ✅ Backups habilitados
- [ ] ✅ Monitoreo activo

---

*Última actualización: 2024*
*Para soporte: https://github.com/tu-usuario/opencode-evolution*
