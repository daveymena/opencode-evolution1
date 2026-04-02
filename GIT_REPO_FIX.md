# 🚨 PROBLEMA: GIT_REPO_URL Antiguo

## El Verdadero Problema:

El `entrypoint.sh` está usando la variable `GIT_REPO_URL` del **antiguo repo** que está en `/root/.local/share/opencode/auth.json`

Por eso ve:
```
[entrypoint] Clonando https://ghp_...@github.com/daveymena/opencode-evolution.git
```

En lugar de:
```
https://github.com/daveymena/opencode-evolution1.git
```

---

## ✅ SOLUCIÓN: En EasyPanel agregar Variable

En EasyPanel → Tu App → Environment Variables

**Agregar esta variable**:
```
GIT_REPO_URL=https://github.com/daveymena/opencode-evolution1.git
```

Eso va a forzar que clone el repo correcto.

---

## Pero También Necesitas:

Asegurar que `express` esté instalado. He actualizado el código para:

1. **package.json raíz**: Ahora incluye `express` como dependencia
2. **entrypoint.sh**: Ahora instala express si falta
3. **Dockerfile**: Copia node_modules correctamente

---

## 🔄 Próximos Pasos:

1. En EasyPanel, **agregar variable**:
   ```
   GIT_REPO_URL=https://github.com/daveymena/opencode-evolution1.git
   GIT_BRANCH=main
   ```

2. **Rebuild**

3. Esperar a que vea:
   ```
   ✅ [entrypoint] Clonando https://github.com/daveymena/opencode-evolution1.git
   ✅ [entrypoint] Instalando express y dependencias...
   ✅ [entrypoint] Iniciando OpenCode Evolved (Frontend + Proxy) en :3000
   ✅ Listening on port 3000
   ```

---

El código está actualizado en GitHub con el fix (commit b8d126d)
