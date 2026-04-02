# 🔌 Puertos y Configuración de EasyPanel

## 📊 Puertos del Proyecto

```
┌─────────────────────────────────────────┐
│   FRONTEND + PROXY                      │
│   Puerto: 3000                          │
│   URL: http://localhost:3000            │
└─────────────────────────────────────────┘
           ↓ (proxy /api)
┌─────────────────────────────────────────┐
│   API SERVER (interno)                  │
│   Puerto: 3001                          │
│   URL: http://localhost:3001            │
│   (solo accesible dentro del proxy)     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│   PostgreSQL (Supabase remoto)          │
│   Puerto: 5432                          │
│   Host: aws-1-us-east-1.pooler.supabase│
└─────────────────────────────────────────┘
```

---

## 🚀 En EasyPanel

### Puerto Expuesto
- **3000** ← Único puerto que necesitas exponer
  - Sirve el Frontend (React)
  - Proxy a API en /api
  - Conecta con Supabase

### Variables de Entorno Requeridas
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://rzkmwvvezpijejiasowe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Variables Opcionales (pero recomendadas)
```bash
GROQ_API_KEY=gsk_...
GOOGLE_API_KEY=AIzaSy...
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-...
PAYPAL_CLIENT_ID=BAA...
PAYPAL_CLIENT_SECRET=EP5...
GIT_TOKEN=ghp_...
```

---

## ⚙️ Configuración en EasyPanel

### Paso 1: Crear App
1. Dashboard → **New App**
2. Tipo: **Docker**
3. Repository: `https://github.com/daveymena/opencode-evolution1`
4. Branch: `main`
5. Dockerfile: `Dockerfile`

### Paso 2: Puertos y Networking
- **Expose Port**: `3000`
- **Internal Port**: `3000`
- **Protocol**: HTTP

### Paso 3: Environment Variables
Copiar todas las variables de tu `.env` local:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://rzkmwvvezpijejiasowe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[copiar tu key completa]
GROQ_API_KEY=gsk_...
[resto de variables...]
```

### Paso 4: Recursos
- **CPU**: 1-2 cores (mínimo)
- **RAM**: 2-4GB (recomendado)
- **Almacenamiento**: 10GB+

### Paso 5: Deploy
- Click **Deploy**
- Esperar ~5-10 minutos
- Revisar logs

---

## 🔍 Validación

### Ver si está corriendo
```bash
# En EasyPanel logs:
✅ [entrypoint] Iniciando OpenCode Evolved (Frontend + Proxy) en :3000
✅ Listening on port 3000

❌ Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
   → Significa que falta el fix del Dockerfile (ya aplicado)
```

### URLs para probar
```
Frontend: https://tu-app.easypanel.io
API Health: https://tu-app.easypanel.io/api/healthz
```

### Logs esperados
```
✅ Frontend levantado en puerto 3000
✅ Proxy configurado en /api
✅ Conectado a Supabase
✅ Ready to accept connections
```

---

## 🐛 Troubleshooting

### Error: "Cannot find package 'express'"
- **Causa**: Falta copiar node_modules al Dockerfile
- **Solución**: Ya está arreglado en la versión actual
- **Action**: Hacer rebuild en EasyPanel

### Error: "Database connection refused"
- **Causa**: DATABASE_URL incorreta o IP no whitelisted
- **Solución**: 
  1. Verificar DATABASE_URL en variables
  2. En Supabase: Settings → Database → Whitelist

### Error: "Cannot find module '@workspace/db'"
- **Causa**: pnpm workspaces no instaladas
- **Solución**: Ya compilado en Dockerfile, debe funcionar

### App reinicia constantemente
- **Causa**: Error en las APIs o base de datos
- **Solución**: Revisar logs de EasyPanel en real-time

---

## 📈 Monitoreo en EasyPanel

### Dashboard
- Ver recursos (CPU, RAM, almacenamiento)
- Ver logs en tiempo real
- Ver historial de deployments

### Logs útiles
```
# Ver últimas líneas
tail -100 /app/logs.txt

# Ver errores
grep "ERROR\|error" /app/logs.txt

# Ver puerto
netstat -tlnp | grep 3000
```

---

## 🔄 Actualizar el Proyecto

Cuando actualices GitHub (`git push`):

1. **EasyPanel detecta cambios automáticamente**
2. **Hace rebuild del Docker**
3. **Redeploy automático** (configurable)

O manualmente:
1. Dashboard → Tu App
2. **Redeploy** button
3. Esperar rebuild

---

## 📊 Resumen Puertos

| Servicio | Puerto | Externo | Uso |
|----------|--------|---------|-----|
| Frontend | 3000 | ✅ Sí | Web browser |
| API | 3001 | ❌ No | Internal (proxy) |
| PostgreSQL | 5432 | ❌ No | Supabase remoto |

**Importante**: Solo exponer puerto **3000** en EasyPanel

---

## ✅ Checklist Pre-Deploy

- [x] Dockerfile actualizado (include dependencies)
- [x] .env.example en GitHub
- [x] DATABASE_URL apunta a Supabase
- [x] API keys configuradas
- [x] Git sync habilitado
- [x] Puerto 3000 expuesto
- [x] Logs configurados

---

**Última actualización**: 02/04/2026  
**Versión Dockerfile**: 6e0acda  
**Status**: ✅ Listo para EasyPanel
