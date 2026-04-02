# 🔗 Integración con Supabase

OpenCode Evolution v2.0 está integrado con **Supabase** (PostgreSQL remoto en AWS).

## ✅ Configuración Actual

```
URL: https://rzkmwvvezpijejiasowe.supabase.co
BD:  postgres.rzkmwvvezpijejiasowe (AWS US-East-1)
```

## 🔐 Variables en `.env`

```bash
DATABASE_URL=postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://rzkmwvvezpijejiasowe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🚀 Primeros pasos

### 1. Conectarse a Supabase

```bash
# Instalar CLI de Supabase (opcional)
npm install -g supabase

# Listar proyectos
supabase projects list

# Conectar con el proyecto
supabase link --project-ref rzkmwvvezpijejiasowe
```

### 2. Correr migraciones

```bash
# Con Drizzle ORM
pnpm --filter @workspace/db run push

# O con Supabase SQL
psql postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres < migrations.sql
```

### 3. Variables de entorno en Docker

**Para Docker Compose** (cambiar DATABASE_URL):

```yaml
environment:
  DATABASE_URL: postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres
  SUPABASE_URL: https://rzkmwvvezpijejiasowe.supabase.co
  SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Variables en EasyPanel

1. Dashboard EasyPanel → Tu App
2. Environment Variables
3. Agregar:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## 📚 Tablas en Supabase

Las siguientes tablas se crearán automáticamente en Supabase:

- `users` - Usuarios del sistema
- `projects` - Proyectos OpenCode
- `files` - Archivos de código
- `messages` - Mensajes de chat
- `userApiKeys` - Claves API de usuarios

## ⚠️ Seguridad

- ✅ `SUPABASE_SERVICE_ROLE_KEY` = solo para servidor (secreto)
- ❌ Nunca compartir por público o en repositorio
- ✅ En producción, usar variables de EasyPanel UI
- ✅ Regenerar claves cada 90 días

## 🔄 Sincronizar cambios de BD

```bash
# Ver estado de migraciones
pnpm --filter @workspace/db run status

# Aplicar migraciones locales a Supabase
pnpm --filter @workspace/db run push

# Revertir última migración (cuidado)
pnpm --filter @workspace/db run drop
```

## 🐛 Troubleshooting

### Error: "Connection refused"
- Verificar `DATABASE_URL` en `.env`
- Verificar conexión a internet
- Revisar IP whitelist en Supabase: Settings → Database → Allowed connections

### Error: "Table does not exist"
- Correr: `pnpm --filter @workspace/db run push`
- Verificar que las migraciones estén completas

### Lentitud en conexión
- Supabase usa connection pooling
- Usar `pooler.supabase.com` (actual, optimizado)
- No usar `db.supabase.com` en producción

## 📊 Monitoreo

Dashboard Supabase:
- Logs de consultas: https://rzkmwvvezpijejiasowe.supabase.co/project/default/logs
- Estadísticas: https://rzkmwvvezpijejiasowe.supabase.co/project/default/analytics
- Backups automáticos disponibles

---

**Estado**: ✅ Configurado y listo para producción con Supabase
