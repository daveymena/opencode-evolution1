# 📋 Environment Variables Configuration

OpenCode Evolution v2.0 tiene variables de entorno **unificadas y centralizadas** en 3 lugares:

## 1️⃣ Root (`.env`)
**Archivo**: `C:\opencode-evolution\.env`

**Uso**: Configuración global para Docker y desarrollo local

```bash
# Base de datos
POSTGRES_USER=opencode
POSTGRES_PASSWORD=opencode
POSTGRES_DB=opencode_evolved
POSTGRES_PORT=5432

# Aplicación
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug

# API
API_URL=http://localhost:3001
API_PORT=3001

# AI (opcional)
# ANTHROPIC_API_KEY=sk-ant-...
```

---

## 2️⃣ Frontend (`.env` + `.env.example`)
**Ubicación**: `artifacts/opencode-evolved/`

**Archivo**: `.env.example` (template seguro en GitHub)

```bash
# Para desarrollo local (API en puerto 3001)
VITE_API_URL=http://localhost:3001

# Para Docker (usa proxy /api)
# VITE_API_URL=/api

# Para producción
# VITE_API_URL=https://api.tudominio.com
```

**Cómo usar**:
1. Copia `.env.example` a `.env`
2. Modifica según tu entorno
3. `.env` está en `.gitignore` (no se subirá a GitHub)

---

## 3️⃣ API Server (`.env` + `.env.example`)
**Ubicación**: `artifacts/api-server/`

**Archivo**: `.env.example` (template seguro en GitHub)

```bash
# Servidor
NODE_ENV=development
PORT=3001
LOG_LEVEL=debug

# Base de datos
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# AI (opcional)
# ANTHROPIC_API_KEY=sk-ant-...
```

**Cómo usar**:
1. Copia `.env.example` a `.env`
2. Modifica según tu entorno
3. `.env` está en `.gitignore` (no se subirá a GitHub)

---

## 🔧 Configuración por Entorno

### 📱 Desarrollo Local (sin Docker)

**Root `.env`**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
API_URL=http://localhost:3001
```

**Frontend `artifacts/opencode-evolved/.env`**:
```bash
VITE_API_URL=http://localhost:3001
```

**API `artifacts/api-server/.env`**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
PORT=3001
```

### 🐳 Docker Local

**Root `.env`**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://opencode:opencode@db:5432/opencode_evolved
API_URL=http://api:3001
POSTGRES_PASSWORD=opencode_dev_secure_password
```

**Frontend `artifacts/opencode-evolved/.env`**:
```bash
VITE_API_URL=/api
```

**API `artifacts/api-server/.env`**:
```bash
NODE_ENV=development
DATABASE_URL=postgresql://opencode:opencode@db:5432/opencode_evolved
PORT=3001
```

### 🌐 Producción (EasyPanel)

**Root `.env` (secretos en EasyPanel UI)**:
```bash
NODE_ENV=production
POSTGRES_PASSWORD=tu-contraseña-segura
POSTGRES_USER=opencode
POSTGRES_DB=opencode_prod

# En EasyPanel, agregar como variables:
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
```

**Frontend `artifacts/opencode-evolved/.env`**:
```bash
VITE_API_URL=https://api.tudominio.com
```

**API `artifacts/api-server/.env`**:
```bash
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
CORS_ORIGIN=https://tudominio.com
```

---

## 📊 Arquitectura de Comunicación

```
┌─────────────────────────────────────┐
│  Frontend (Puerto 3000)             │
│  VITE_API_URL = /api (Docker)       │
└──────────────────┬──────────────────┘
                   │
                   │ Proxy /api
                   │ (docker-serve.mjs)
                   ▼
┌─────────────────────────────────────┐
│  API Server (Puerto 3001)           │
│  DATABASE_URL = postgresql://...    │
└──────────────────┬──────────────────┘
                   │
                   │
                   ▼
┌─────────────────────────────────────┐
│  PostgreSQL (Puerto 5432)           │
│  POSTGRES_PASSWORD = ****           │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Variables

- [x] Root `.env` con base de datos y puertos
- [x] Root `.env.example` en GitHub (plantilla segura)
- [x] Frontend `.env.example` con VITE_API_URL
- [x] API `.env.example` con DATABASE_URL
- [x] Todos los `.env` locales en `.gitignore`
- [x] `.env.example` permitidos en `.gitignore` (safe to share)
- [x] Proxy configurado en `docker-serve.mjs` para `/api`
- [x] Variables unificadas en docker-compose.yml

---

## 🚀 Para Empezar

**1. Clonar el repo**:
```bash
git clone https://github.com/daveymena/opencode-evolution1.git
cd opencode-evolution1
```

**2. Crear archivos .env desde templates**:
```bash
# En raíz
cp .env.example .env

# En frontend
cp artifacts/opencode-evolved/.env.example artifacts/opencode-evolved/.env

# En API
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

**3. Modificar según tu entorno** (local, Docker, o producción)

**4. Ejecutar**:
```bash
# Docker
docker-compose up -d

# O local
pnpm install
pnpm --filter @workspace/db run push
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/opencode-evolved run dev
```

---

## 🔒 Seguridad

- ✅ Nunca commitear `.env` (contiene secretos)
- ✅ Commitear `.env.example` (sin secretos, es plantilla)
- ✅ En producción, usar variables de EasyPanel UI
- ✅ Regenerar `POSTGRES_PASSWORD` en producción
- ✅ Usar credenciales de API separadas por entorno
