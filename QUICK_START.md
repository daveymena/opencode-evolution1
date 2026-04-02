# 🚀 OpenCode Evolution - Quick Start Guide

## Lo que hemos mejorado

### ✅ Completado
1. **Docker Architecture** - Servicios separados para API, Frontend y BD
2. **Database Persistence** - PostgreSQL con migraciones automáticas
3. **Live Hot-Reload** - Cambios instantáneos en backend durante desarrollo
4. **UI para Compilación** - Panel con logs en tiempo real
5. **EasyPanel Integration** - Guía completa para despliegue
6. **Endpoints de Build** - Compilación, export y status de proyectos

---

## 🏃 Inicio Rápido

### Opción A: Desarrollo Local (Recomendado)

```bash
# 1. Clonar y entrar
git clone <repo-url>
cd opencode-evolution

# 2. Ejecutar setup automático
chmod +x dev-setup.sh
./dev-setup.sh

# 3. Terminal 1 - API con hot-reload
pnpm --filter @workspace/api-server run dev

# 4. Terminal 2 - Frontend con Vite HMR
pnpm --filter @workspace/opencode-evolved run dev

# 5. Abrir navegador
open http://localhost:5173
```

**Direcciones:**
- Frontend: http://localhost:5173
- API: http://localhost:3001
- Database: localhost:5432

---

### Opción B: Docker Local

```bash
# 1. Preparar
cp .env.example .env

# 2. Iniciar todo
docker-compose up -d

# 3. Acceder
open http://localhost:3000

# 4. Ver logs
docker-compose logs -f frontend
docker-compose logs -f api
docker-compose logs -f db
```

---

### Opción C: EasyPanel (Hosting)

Ver **EASYPANEL_SETUP.md** para instrucciones detalladas.

Resumen:
1. Crear app Docker en EasyPanel
2. Git: `https://github.com/tu-usuario/opencode-evolution.git`
3. Variables de entorno (POSTGRES_PASSWORD, APIs, etc)
4. Deploy automático

---

## 🗂️ Cambios Realizados

### Docker Compose Mejorado
```
services:
  ✅ db         (PostgreSQL 16)
  ✅ api        (Express API)
  ✅ frontend   (React + Static Server + Proxy)
```

Archivo: `docker-compose.yml`

### API Server con Hot-Reload
```bash
pnpm --filter @workspace/api-server run dev  # Con nodemon
```

Cambios en:
- `artifacts/api-server/package.json` - Añadido nodemon
- `artifacts/api-server/nodemon.json` - Config watch

### Nuevos Componentes Frontend
- `BuildPanel.tsx` - Mostrar logs de compilación
- `CompileButtons.tsx` - Botones: Compile, Stop, Refresh, Export

### Nuevos Endpoints
- `POST /api/projects/:projectId/compile` - Iniciar compilación
- `GET /api/projects/:projectId/compile` - Status
- `POST /api/projects/:projectId/export` - Exportar proyecto

Archivo: `artifacts/api-server/src/routes/build.ts`

### Scripts Automáticos
- `dev-setup.sh` - Setup automático con Docker + dependencias
- `entrypoint-api.sh` - Inicializa BD y API en Docker
- `Dockerfile.api` - Build separado para API

### Documentación
- `EASYPANEL_SETUP.md` - Guía paso a paso para EasyPanel
- `README.md` - Actualizado con instrucciones claras
- `.env.example` - Template mejorado

---

## 📊 Flujo de Trabajo Típico

### 1. Crear Proyecto
```
Frontend → POST /api/projects → BD → Response
```

### 2. Crear Archivo
```
Frontend → POST /api/projects/:id/files → BD → Response
```

### 3. Editar en Vivo
```
Monaco Editor → PUT /api/files/:id → BD → Frontend actualiza
```

### 4. Compilar
```
Frontend → POST /api/projects/:id/compile 
→ Backend ejecuta compilación 
→ Logs en tiempo real en BuildPanel
```

### 5. Exportar
```
Frontend → GET /api/projects/:id/export → ZIP → Descarga
```

---

## 🔧 Configuración

### Variables Importantes

#### Base de Datos
```env
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
POSTGRES_USER=opencode
POSTGRES_PASSWORD=opencode
```

#### APIs IA (elige al menos una)
```env
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
```

#### Git (Opcional)
```env
GIT_REPO_URL=https://github.com/usuario/repo
GIT_TOKEN=ghp_xxxxx
```

---

## 🐛 Troubleshooting

### "Cannot connect to database"
```bash
# Verificar PostgreSQL
docker ps | grep postgres

# Ver logs
docker-compose logs db

# Reiniciar
docker-compose restart db
```

### "API server not responding"
```bash
# Verificar API
curl http://localhost:3001/api/healthz

# Ver logs
docker-compose logs api

# O en desarrollo:
# Revisar Terminal 1 donde corre pnpm dev
```

### "Frontend loads forever"
```bash
# Verificar proxy
curl http://localhost:3000/api/healthz

# Revisar CORS en docker-serve.mjs
# Reiniciar frontend
docker-compose restart frontend
```

### "Migraciones fallan"
```bash
# Ejecutar manualmente
docker-compose exec api pnpm --filter @workspace/db run push

# O en desarrollo
pnpm --filter @workspace/db run push
```

---

## 🚀 Comandos Útiles

```bash
# Desarrollo - Terminal 1
pnpm --filter @workspace/api-server run dev

# Desarrollo - Terminal 2  
pnpm --filter @workspace/opencode-evolved run dev

# Docker - Iniciar todo
docker-compose up -d

# Docker - Ver logs
docker-compose logs -f frontend  # Frontend
docker-compose logs -f api       # API
docker-compose logs -f db        # BD

# Docker - Detener
docker-compose down

# Docker - Reconstruir
docker-compose build --no-cache

# BD - Migraciones
pnpm --filter @workspace/db run push

# BD - Acceder con psql
psql postgresql://opencode:opencode@localhost:5432/opencode_evolved

# Tests
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/opencode-evolved run typecheck

# Build para producción
pnpm run build
```

---

## 📈 Próximas Mejoras (Optional)

- [ ] Autenticación de usuarios (JWT)
- [ ] Rate limiting en API
- [ ] Caché Redis
- [ ] WebSockets para real-time
- [ ] Sistema de permisos (RBAC)
- [ ] Monitoreo y alertas (Prometheus)
- [ ] Testing automatizado (Jest, Vitest)
- [ ] CI/CD (GitHub Actions)

---

## 📚 Recursos

- **OpenCode Docs**: https://opencode.ai/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **React Query**: https://tanstack.com/query
- **Express.js**: https://expressjs.com
- **Docker Compose**: https://docs.docker.com/compose

---

## ✅ Checklist de Verificación

- [ ] PostgreSQL corriendo y accesible
- [ ] API server respondiendo en `/api/healthz`
- [ ] Frontend cargando en localhost:5173 (o docker)
- [ ] Puedo crear un proyecto
- [ ] Puedo crear/editar archivos
- [ ] Panel de compilación muestra logs
- [ ] Botones de compile/export funcionan
- [ ] Hot-reload funciona en desarrollo
- [ ] Migraciones de BD aplicadas
- [ ] Volúmenes persistentes en Docker

---

## 🤝 Soporte

Si tienes problemas:

1. **Revisar logs**: `docker-compose logs -f`
2. **Leer README.md**: Instrucciones detalladas
3. **Ver EASYPANEL_SETUP.md**: Si usas EasyPanel
4. **Reportar bug**: GitHub Issues

---

**🎉 ¡OpenCode Evolution está listo para usar!**

*Última actualización: Abril 2024*
