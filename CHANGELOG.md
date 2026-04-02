# 📝 CHANGELOG - OpenCode Evolution Enhanced

## [v2.0.0] - 2024-04-02

### 🚀 Major Features

#### Docker Architecture Overhaul
- ✅ Separación de servicios: Frontend, API, PostgreSQL
- ✅ `docker-compose.yml` mejorado con 3 servicios coordinados
- ✅ Health checks automáticos
- ✅ Redes internas para comunicación segura
- ✅ Volúmenes persistentes para datos, workspace, proyectos

#### Database Persistence
- ✅ PostgreSQL 16 integrado automáticamente
- ✅ Migraciones automáticas en startup
- ✅ Script `entrypoint-api.sh` para inicialización
- ✅ Health check con `pg_isready`
- ✅ Manejo de errores y reintentos

#### Live Hot-Reload
- ✅ Nodemon para backend con watch mode
- ✅ Cambios instantáneos sin reiniciar servidor
- ✅ Monitoreo de `src/`, `lib/db/`, `lib/api-zod/`
- ✅ Delay configurable (500ms)
- ✅ `nodemon.json` con configuración optimizada

#### Frontend UI Components
- ✅ `BuildPanel.tsx` - Panel de logs en tiempo real
- ✅ `CompileButtons.tsx` - Botones: Compile, Stop, Refresh, Export
- ✅ Soporte para múltiples niveles de logs (info, warning, error, success)
- ✅ Auto-scroll en logs
- ✅ Indicadores de estado de compilación

#### API Endpoints
- ✅ `POST /api/projects/:projectId/compile` - Iniciar compilación
- ✅ `GET /api/projects/:projectId/compile` - Status de compilación
- ✅ `POST /api/projects/:projectId/export` - Exportar proyecto
- ✅ Nueva ruta: `artifacts/api-server/src/routes/build.ts`

#### Development Tools
- ✅ `dev-setup.sh` - Setup automático de ambiente local
- ✅ Crea directorios, instala dependencias, inicia Docker
- ✅ Instrucciones coloreadas y claras
- ✅ Manejo de PostgreSQL con Docker
- ✅ Aplicación de migraciones automáticas

#### EasyPanel Integration
- ✅ `EASYPANEL_SETUP.md` - Guía completa paso a paso
- ✅ Configuración de variables de entorno
- ✅ Setup de puertos y volúmenes
- ✅ Troubleshooting detallado
- ✅ Guía de backups y monitoreo

### 📝 Documentation

- ✅ `README.md` - Actualizado con instrucciones claras
- ✅ `QUICK_START.md` - Guía rápida de 3 opciones
- ✅ `.env.example` - Template mejorado con todas las variables
- ✅ `EASYPANEL_SETUP.md` - 500+ líneas de documentación
- ✅ `CHANGELOG.md` - Este archivo

### 🐳 Docker

#### Nuevos Dockerfiles
- ✅ `Dockerfile` - Frontend optimizado
- ✅ `Dockerfile.api` - API server con multi-stage build
- ✅ `docker-compose.yml` - Orquestación completa

#### Scripts de Inicialización
- ✅ `entrypoint.sh` - Frontend + Workspace
- ✅ `entrypoint-api.sh` - API + Migraciones BD
- ✅ `docker-serve.mjs` - Frontend proxy mejorado

### 🔧 Configuration

#### Environment Variables
- ✅ Documentación de todas las variables
- ✅ Separación por secciones (DB, APP, API, IA, GIT, PAGOS)
- ✅ Valores por defecto seguros
- ✅ Instrucciones claras

#### Package.json Updates
- ✅ API Server: Nuevos scripts `dev:watch`, `dev:start`, `start:watch`
- ✅ API Server: Añadido `nodemon@3.1.4`
- ✅ API Server: `nodemon.json` con config optimizada

### 🔒 Security Notes

⚠️ Las siguientes mejoras aún están **PENDIENTES**:
- [ ] Autenticación JWT
- [ ] Rate limiting
- [ ] CORS restrictivo
- [ ] Sanitización de inputs
- [ ] Encriptación de datos sensibles
- [ ] Audit logging

### 🐛 Bug Fixes

- ✅ API server no estaba en docker-compose (ahora separado)
- ✅ Proxy a localhost:3001 no funcionaba (ahora usa API_URL)
- ✅ Migraciones de BD no se ejecutaban automáticamente (ahora en entrypoint)
- ✅ Frontend no tenía way de ver compilaciones en vivo
- ✅ Backend no tenía hot-reload en desarrollo

### 📊 Performance Improvements

- ✅ Multi-stage Docker build para API (reduce tamaño de imagen)
- ✅ Separación de servicios mejora escalabilidad
- ✅ Health checks optimizados
- ✅ Logs mejorados con niveles y timestamps
- ✅ Mejor uso de volúmenes para persistencia

### 🔄 Breaking Changes

⚠️ Requiere actualización de configuración:
- Los usuarios que usan `docker-compose.yml` anterior deben actualizar
- Variables de entorno nuevas (ver `.env.example`)
- Necesita Dockerfile.api nuevo para API server

### 🚦 Migration Guide

Para actualizar desde versión anterior:

```bash
# 1. Backup de datos
docker-compose exec db pg_dump -U opencode opencode_evolved > backup.sql

# 2. Descargar cambios
git pull origin main

# 3. Reconstruir
docker-compose build --no-cache

# 4. Actualizar BD si hay cambios
docker-compose up -d
docker-compose exec api pnpm --filter @workspace/db run push

# 5. Verificar health
curl http://localhost:3000/api/healthz
```

### 📦 Dependencies Added

```
API Server:
- nodemon@3.1.4 (dev - hot-reload)

Frontend:
- (sin cambios en dependencies)

Docker:
- PostgreSQL 16-alpine (nuevo servicio)
```

### 🧪 Testing

✅ Verificado:
- Docker Compose está completo
- API server inicia correctamente
- BD se conecta y aplica migraciones
- Frontend sirve y proxea a API
- Hot-reload funciona en desarrollo

❌ Aún falta:
- Tests unitarios
- Tests de integración
- Tests E2E
- Load testing

### 📚 Additional Resources

- OpenCode Docs: https://opencode.ai/docs
- Drizzle ORM: https://orm.drizzle.team
- Docker: https://docs.docker.com/compose
- EasyPanel: https://easypanel.io

### 🙏 Credits

- Mejoras arquitectónicas basadas en mejores prácticas de Docker
- Componentes UI siguiendo patrones de Radix UI y shadcn
- Documentación inspirada en proyectos open source exitosos

### 🎯 Next Steps (v2.1.0)

Planeado para próxima versión:
- [ ] Autenticación JWT
- [ ] WebSockets para real-time
- [ ] Sistema de permisos RBAC
- [ ] Caché Redis
- [ ] Monitoreo Prometheus
- [ ] CI/CD GitHub Actions
- [ ] Tests automatizados
- [ ] Métricas de performance

---

## [v1.0.0] - 2024-03-22

### ✨ Initial Release

- IDE con Monaco Editor
- Chat integrado
- Soporte para múltiples proveedores de IA
- Base de datos con Prisma
- Docker básico
- React + Tailwind UI

---

**Versión Actual: v2.0.0**  
**Última actualización: 2 de Abril de 2024**
