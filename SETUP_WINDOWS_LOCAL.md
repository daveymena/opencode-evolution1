# 🚀 OpenCode Evolution - Setup en Windows SIN Docker

## ⚠️ Tu Situación Actual

- ✅ Node.js v22.20.0 instalado
- ✅ pnpm v10.33.0 instalado
- ❌ Docker no disponible en Windows
- ✅ Dependencias del proyecto instaladas

---

## 🔧 Opción 1: Usar PostgreSQL Local (Recomendado)

### Paso 1: Instalar PostgreSQL Localmente

Descarga desde: https://www.postgresql.org/download/windows/

**Durante la instalación:**
- Username: `postgres`
- Password: cualquiera (recuérdalo)
- Port: 5432 (default)
- Password para superusuario: `postgres`

### Paso 2: Crear Base de Datos

Abre **pgAdmin** (incluido con PostgreSQL):

```sql
-- Crear usuario opencode
CREATE USER opencode WITH PASSWORD 'opencode';
ALTER USER opencode CREATEDB;

-- Crear database
CREATE DATABASE opencode_evolved OWNER opencode;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE opencode_evolved TO opencode;
```

O desde Command Line:
```cmd
psql -U postgres
# Luego pega los comandos SQL de arriba
```

### Paso 3: Actualizar .env

```env
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
```

### Paso 4: Aplicar Migraciones

```bash
cd C:\opencode-evolution
pnpm --filter @workspace/db run push
```

---

## 🔧 Opción 2: Usar PostgreSQL en WSL2 (Linux en Windows)

Si tienes WSL2 instalado:

```bash
# En WSL terminal
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar PostgreSQL
sudo service postgresql start

# Crear usuario y BD (mismo que Opción 1)
sudo -u postgres psql
# Pega los comandos SQL

# Desde Windows, usar:
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
```

---

## ▶️ Ejecutar el Proyecto (Local)

### Terminal 1: API Server (Hot-Reload)

```bash
cd C:\opencode-evolution
set NODE_ENV=development
set PORT=3001
set DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved

pnpm --filter @workspace/api-server run dev
```

**Esperado:**
```
✅ API server escuchando en port 3001
✅ Conectado a base de datos
✅ Watchers activos (nodemon)
```

### Terminal 2: Frontend (Vite HMR)

```bash
cd C:\opencode-evolution
set NODE_ENV=development
set PORT=5173
set VITE_API_URL=http://localhost:3001

pnpm --filter @workspace/opencode-evolved run dev
```

**Esperado:**
```
VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

---

## 🌐 Acceder a la Aplicación

Abre en tu navegador:

```
http://localhost:5173
```

---

## 🧪 Verificar que Todo Funciona

### 1. Frontend cargó correctamente
- Deberías ver la interfaz de OpenCode
- Debe haber un sidebar con "New Project"

### 2. API responde
```bash
# En otra terminal (Terminal 3)
curl http://localhost:3001/api/healthz
# Esperado: {"status":"ok"}
```

### 3. Base de datos conectada
- Crea un nuevo proyecto en la UI
- Debe aparecer en la BD

---

## 🚨 Troubleshooting

### "Error: connect ECONNREFUSED 127.0.0.1:5432"

**Causa**: PostgreSQL no está corriendo

**Solución (Windows)**:
```bash
# Verificar que PostgreSQL está corriendo
# Services → PostgreSQL Server

# O desde cmd:
sc query postgresql-x64-15  # o tu versión
```

### "ENOENT: no such file or directory, open '...\node_modules\'"

**Causa**: Dependencias no instaladas

**Solución**:
```bash
cd C:\opencode-evolution
pnpm install
```

### "Cannot find module '@workspace/db'"

**Causa**: Workspace no está correctamente referenciado

**Solución**:
```bash
# Reconstruir
pnpm --filter @workspace/db run build
pnpm --filter @workspace/api-zod run build
pnpm --filter @workspace/api-server run build
```

### Frontend dice "Loading..." infinitamente

**Causa**: API no responde

**Verificar**:
1. Terminal 1 está corriendo?
2. `curl http://localhost:3001/api/healthz` funciona?
3. DATABASE_URL es correcto?

---

## 📋 Variables de Entorno para Cada Terminal

### Terminal 1 (API)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
LOG_LEVEL=debug
```

### Terminal 2 (Frontend)
```
NODE_ENV=development
PORT=5173
VITE_API_URL=http://localhost:3001
```

---

## 🔄 Workflow de Desarrollo

1. **Haces cambios en backend** (`artifacts/api-server/src/**`)
   → nodemon detecta cambios
   → Auto-reconstruye
   → Sin reiniciar (hot-reload)

2. **Haces cambios en frontend** (`artifacts/opencode-evolved/src/**`)
   → Vite detecta cambios
   → Actualiza en el navegador (HMR)
   → Sin recargar página

3. **Cambios en BD** (`lib/db/src/schema/**`)
   → Requiere rebuilds manuales:
   ```bash
   pnpm --filter @workspace/db run push
   ```

---

## 💾 Comandos Útiles

```bash
# Instalar dependencias
pnpm install

# Reconstruir BD
pnpm --filter @workspace/db run push

# Ver logs de BD en tiempo real
psql -U opencode -d opencode_evolved -c "SELECT * FROM projects;"

# Resetear BD completamente (⚠️ BORRA TODO)
psql -U postgres -c "DROP DATABASE opencode_evolved;"
psql -U postgres -c "CREATE DATABASE opencode_evolved OWNER opencode;"
pnpm --filter @workspace/db run push

# Typecheck
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/opencode-evolved run typecheck

# Build para producción
pnpm run build
```

---

## 🐛 Próximo Paso: Docker en Windows

Una vez que todo funcione localmente, puedes:

1. **Instalar Docker Desktop** desde https://www.docker.com/products/docker-desktop/
2. **Usar docker-compose**:
   ```bash
   docker-compose up -d
   # Acceder: http://localhost:3000
   ```

---

## 📞 Si algo no funciona

1. **Revisa los logs** en ambas terminales
2. **Verifica .env** con `cat C:\opencode-evolution\.env`
3. **Verifica PostgreSQL**: `psql -U opencode -d opencode_evolved`
4. **Reconstruye todo**:
   ```bash
   pnpm clean
   pnpm install
   pnpm run build
   ```

---

**¡Listo para empezar! 🚀**

*Próximo paso: Abre las 2 terminales y ejecuta los comandos.*
