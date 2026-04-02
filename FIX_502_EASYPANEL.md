# 🚀 Actualizar tu App en EasyPanel - Solución 502

El error 502 significa que el contenedor de Docker **no levanta correctamente**. El problema es:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

## ✅ Solución (Elige una):

---

## Opción 1: Cambiar el Repositorio (RECOMENDADO)

Tu EasyPanel está usando el **repo antiguo** con problemas. Necesitas usar el **repo actualizado**:

### Pasos:

1. **En EasyPanel Dashboard**
2. Haz click en tu App
3. Haz click en **"Settings"** o **"Configuration"**
4. Busca **"Repository"** o **"Git URL"**

### Cambiar de:
```
https://github.com/daveymena/opencode-evolution.git
```

### A:
```
https://github.com/daveymena/opencode-evolution1.git
```

5. **Guardar** (Save)
6. **Rebuild** o **Redeploy**

---

## Opción 2: Forzar Rebuild del Container

Si quieres mantener el repo actual y solo hacer rebuild:

1. En EasyPanel → Tu App
2. **Actions** → **Rebuild Container**
3. Esperar 10-15 minutos
4. Revisar logs

**Nota**: El rebuild con la solución anterior incluye fallback de instalación de dependencias.

---

## Opción 3: Limpiar y Redeploy Completo

1. En EasyPanel → Tu App
2. **Delete** (eliminar app)
3. **New App** → Docker
4. Repository: `https://github.com/daveymena/opencode-evolution1.git`
5. Branch: `main`
6. Dockerfile: `Dockerfile`
7. Agregar variables de entorno
8. Deploy

---

## ✅ Lo que necesitas en EasyPanel

### Environment Variables (REQUERIDAS):
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://postgres.rzkmwvvezpijejiasowe:OpenCode_Evo_2026!@aws-1-us-east-1.pooler.supabase.com:5432/postgres
SUPABASE_URL=https://rzkmwvvezpijejiasowe.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Puertos:
- **Exponer**: `3000`
- **Protocolo**: HTTP

---

## 🔍 Verificar después de Deploy

### URLs para probar:
```
✅ Frontend: https://tu-app.easypanel.io
✅ API Health: https://tu-app.easypanel.io/api/healthz
```

### Logs esperados:
```
[entrypoint] auth.json OK
[entrypoint] opencode.json OK
[entrypoint] Workspace listo: /root/workspace
[entrypoint] Iniciando OpenCode Evolved (Frontend + Proxy) en :3000
✅ Listening on port 3000
✅ Frontend + Proxy ready
```

### Logs que indican error:
```
❌ Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
   → Significa que node_modules no se copió correctamente
   → Intenta Opción 1 o 3

❌ ECONNREFUSED at 127.0.0.1:5432
   → Problema de conexión a Supabase
   → Verificar DATABASE_URL
```

---

## 🛠️ Lo que cambió en el Código

### Dockerfile mejorado:
```dockerfile
# Ahora copia TODOS los artifacts
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/node_modules ./node_modules

# Y tiene fallback de instalación
RUN cd /app && npm install --omit=dev --silent 2>/dev/null || true
```

### Entrypoint mejorado:
```bash
# Verifica que express existe
if ! node -e "require('express')" 2>/dev/null; then
  # Instala fallback si es necesario
  npm install --omit=dev 2>&1
fi
```

---

## ⏱️ Tiempo esperado

- **Opción 1**: 5-10 minutos (rebuild)
- **Opción 2**: 10-15 minutos (rebuild completo)
- **Opción 3**: 15-20 minutos (new app desde cero)

---

## 📊 Resumen

| Problema | Causa | Solución |
|----------|-------|----------|
| 502 Bad Gateway | No levanta contenedor | Cambiar repo o rebuild |
| `Cannot find package 'express'` | node_modules faltante | Ya está arreglado en código |
| Database connection error | DATABASE_URL incorreta | Verificar variables |
| Rebuild lento | Primera construcción | Esperar, es normal |

---

## 📞 Si sigue sin funcionar

1. **Verifica que el repo sea correcto**:
   ```
   https://github.com/daveymena/opencode-evolution1.git
   ```

2. **Comprueba que las variables estén en EasyPanel** (no en `.env` del repo)

3. **Haz full rebuild** desde cero (Opción 3)

4. **Revisa los logs** en tiempo real en EasyPanel

---

**Última actualización**: 02/04/2026  
**Código actualizado**: a0710fd  
**Estado**: Ready for deployment ✅
