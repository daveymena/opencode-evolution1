# 🌌 OpenCode Evolved - Enhanced Edition

Una plataforma revolucionaria de desarrollo impulsada por Inteligencia Artificial, diseñada como un **IDE Full-Stack** con capacidades de chat contextual profundo, ejecución de código en vivo y una interfaz premium de estado del arte (Dark Glassmorphism).

---

## ✨ Características Principales

- **🤖 IA Core (MCP Inteligente):** Integración nativa con múltiples proveedores de IA (Ollama, Antrophic, Groq) listos para leer, razonar y escribir código por ti.
- **💻 Editor Integrado (Monaco):** La misma potencia subyacente que VS Code, operando directamente desde tu navegador con coloreado sintáctico, autocompletado y minimapa.
- **🎨 UI/UX Premium:** Interfaz brutalmente diseñada con *Tailwind CSS* y *Framer Motion* que rinde homenaje a un entorno oscuro profundo, transiciones fluidas y componentes cristalinos.
- **🗄️ Base de Datos Relacional:** Soporte robusto y escalable respaldado por **PostgreSQL** y manejado íntegramente de manera tipada a través de **Drizzle ORM**.
- **🐳 Infraestructura Dockerizada:** Despliegue simplificado con servicios separados (API, Frontend, BD) listos para EasyPanel, Vercel o VPS puros.
- **♻️ Hot-Reload en Desarrollo:** Cambios instantáneos sin reiniciar servidores.

---

## 🛠️ Stack Tecnológico (Monorepo)

### **Frontend (`artifacts/opencode-evolved`)**
- ⚛️ React 19 & Vite 7
- 👗 Tailwind CSS 4 & Radix UI
- ✨ Framer Motion (Animaciones)
- 📝 Monaco Editor (Escritura de código)
- 🪝 TanStack Query (Estado asíncrono)

### **Backend (`artifacts/api-server`)**
- 🟢 Node.js v22 (ESM)
- 🚂 Express 5 (Enrutamiento)
- 🛡️ Zod (Validación estricta)
- 🐘 Drizzle ORM & PostgreSQL

### **Base de Datos (`lib/db`)**
- 🗄️ PostgreSQL 16
- 🔧 Drizzle ORM (Type-safe)
- 📊 Migraciones automáticas

---

## 🚀 Inicio Rápido

### **Opción 1: Desarrollo Local (Con Hot-Reload)**

#### Prerequisitos:
- Node.js 22+
- Docker (para PostgreSQL)
- pnpm 10+ (instálalo con `npm install -g pnpm@10`)

#### Pasos:

```bash
# 1. Clonar repositorio
git clone <repo-url>
cd opencode-evolution

# 2. Ejecutar setup automático
chmod +x dev-setup.sh
./dev-setup.sh

# 3. En Terminal 1 - Iniciar Backend (con watch mode)
pnpm --filter @workspace/api-server run dev

# 4. En Terminal 2 - Iniciar Frontend (con Vite HMR)
pnpm --filter @workspace/opencode-evolved run dev

# 5. Abrir navegador
open http://localhost:5173
```

**Direcciones locales:**
- 🌐 Frontend: http://localhost:5173
- 📡 API: http://localhost:3001
- ✅ Health: http://localhost:3001/api/healthz
- 🐘 PostgreSQL: localhost:5432 (opencode:opencode)

---

### **Opción 2: Docker Compose (Producción-like)**

```bash
# 1. Crear archivo .env desde el template
cp .env.example .env

# 2. Construir y iniciar todos los servicios
docker-compose up -d

# 3. Ver logs
docker-compose logs -f frontend  # Frontend
docker-compose logs -f api       # API Server
docker-compose logs -f db        # PostgreSQL

# 4. Acceder
open http://localhost:3000
```

**Servicios en Docker:**
- Frontend (puerto 3000): Sirve React compiled + proxy a API
- API (puerto 3001): Express server con rutas de proyectos/archivos/mensajes
- DB (puerto 5432): PostgreSQL con volumen persistente

---

### **Opción 3: EasyPanel (Hosting)

1. **En tu servidor EasyPanel:**
   - Clonar este repositorio
   - Crear aplicación Docker
   - Subir el Dockerfile y docker-compose.yml

2. **Variables de entorno (Environment en EasyPanel):**
   ```
   NODE_ENV=production
   DATABASE_URL=postgresql://opencode:opencode@db:5432/opencode_evolved
   ANTHROPIC_API_KEY=<tu-api-key>
   ```

3. **Puertos:**
   - Frontend: 3000
   - API: 3001 (solo interno)
   - DB: 5432 (solo interno)

4. **Volúmenes persistentes:**
   - `/root/.local/share/opencode` - Configuración
   - `/root/workspace` - Archivos del workspace
   - `/root/projects` - Proyectos guardados

---

## 📋 Configuración Variables (.env)

### **Base de Datos**
```env
POSTGRES_USER=opencode
POSTGRES_PASSWORD=opencode
POSTGRES_DB=opencode_evolved
DATABASE_URL=postgresql://opencode:opencode@localhost:5432/opencode_evolved
```

### **API**
```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=info
```

### **Frontend**
```env
PORT=3000
API_URL=http://localhost:3001
```

### **OpenCode AI (Opcional - Elige al menos uno)**
```env
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...
```

---

## 🏗️ Arquitectura

```
opencode-evolution/
├── artifacts/
│   ├── api-server/          # Backend Express
│   │   └── src/
│   │       ├── routes/      # Endpoints: /api/projects, /api/files, /api/messages
│   │       ├── lib/         # OpenCode MCP, Logger, etc
│   │       └── middlewares/ # Auth, CORS, etc
│   └── opencode-evolved/    # Frontend React + Vite
│       └── src/
│           ├── pages/       # ChatPage, ProjectIde
│           ├── components/  # EditorArea, Sidebar, MessageList
│           └── contexts/    # IdeContext para estado compartido
├── lib/
│   ├── db/                  # Drizzle ORM + Schema
│   │   └── src/schema/      # Users, Projects, Files, Messages
│   ├── api-zod/             # Schemas validación
│   └── api-client-react/    # Cliente autogenerado
├── docker-compose.yml       # Orquestación de servicios
├── Dockerfile               # Frontend + Static server
├── Dockerfile.api           # API Server
├── entrypoint.sh           # Inicializador frontend
├── entrypoint-api.sh       # Inicializador API + migraciones BD
└── dev-setup.sh            # Setup desarrollo con hot-reload
```

---

## 🔌 API Endpoints

### **Proyectos**
```
GET     /api/projects              # Listar proyectos
POST    /api/projects              # Crear proyecto
GET     /api/projects/:id          # Obtener detalles
PATCH   /api/projects/:id          # Actualizar
DELETE  /api/projects/:id          # Eliminar
```

### **Archivos**
```
GET     /api/projects/:projectId/files           # Listar archivos
POST    /api/projects/:projectId/files           # Crear archivo
PUT     /api/projects/:projectId/files/:fileId   # Editar contenido
DELETE  /api/projects/:projectId/files/:fileId   # Eliminar archivo
```

### **Mensajes (Chat + IA)**
```
GET     /api/projects/:projectId/messages        # Historial
POST    /api/projects/:projectId/messages        # Enviar (ejecuta OpenCode)
DELETE  /api/projects/:projectId/messages/:id    # Eliminar mensaje
```

### **Salud & Status**
```
GET     /api/healthz                 # Health check
GET     /api/opencode/status         # Disponibilidad de OpenCode CLI
```

---

## 🐛 Troubleshooting

### **PostgreSQL connection refused**
```bash
# Revisar si PostgreSQL está corriendo
docker ps | grep opencode_db

# Iniciar si está parado
docker start opencode_db

# Ver logs
docker logs opencode_db
```

### **API server not responding**
```bash
# Verificar logs del API
docker-compose logs api

# O en desarrollo:
# Revisa la Terminal 1 donde corre el backend

# Verificar conexión a BD
psql postgresql://opencode:opencode@localhost:5432/opencode_evolved
```

### **Frontend muestra errores de API**
1. Abrir DevTools (F12) → Console
2. Verificar que `/api/healthz` responda
3. Revisar CORS en `docker-serve.mjs`

### **Migraciones de BD no aplican**
```bash
# Manual en desarrollo:
pnpm --filter @workspace/db run push

# En Docker:
docker-compose logs api | grep migration
```

---

## 📝 Desarrollo

### **Agregar nueva tabla a BD**

1. Crear schema en `lib/db/src/schema/nueva_tabla.ts`:
```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const nuevaTabla = pgTable('nueva_tabla', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

2. Exportar en `lib/db/src/schema/index.ts`:
```typescript
export * from './nueva_tabla';
```

3. Aplicar migración:
```bash
pnpm --filter @workspace/db run push
```

### **Crear nuevo endpoint**

1. Crear archivo en `artifacts/api-server/src/routes/nueva_ruta.ts`
2. Importar en `artifacts/api-server/src/routes/index.ts`
3. Registrar en `artifacts/api-server/src/app.ts`:
```typescript
app.use('/api/nueva-ruta', nuevaRutaRouter);
```

4. Reiniciar backend (en desarrollo se recompila automáticamente)

---

## 🚢 Deploy con EasyPanel

### **Pasos:**

1. **Crear Application en EasyPanel**
   - Tipo: Docker
   - Nombre: opencode-evolved

2. **Configurar:**
   - Dockerfile: Usar Dockerfile principal
   - Docker Compose: Usar docker-compose.yml
   - Build context: ./

3. **Variables de entorno:**
   - Copiar todas del `.env.example`
   - Actualizar `DATABASE_URL` (usar hostname del contenedor `db`)
   - Agregar `ANTHROPIC_API_KEY` u otro proveedor IA

4. **Puertos:**
   - Frontend: 3000 (expuesto)
   - API: 3001 (opcional, solo si necesitas acceso externo)
   - DB: 5432 (NO exponer)

5. **Deploy:**
   - Click en "Deploy" o "Rebuild"
   - Esperar a que se construya
   - Acceder a `https://tu-dominio.com`

---

## 📚 Documentación Adicional

- **OpenCode AI Docs:** https://opencode.ai/docs
- **Drizzle ORM:** https://orm.drizzle.team
- **React Query:** https://tanstack.com/query
- **Express.js:** https://expressjs.com
- **Vite:** https://vitejs.dev

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crear rama: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -am 'Add new feature'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Pull Request

---

## 📄 Licencia

MIT License - Ver `LICENSE` para detalles

---

## 🆘 Soporte

- 📖 Ver README.md (este archivo)
- 🐛 Reportar bugs en GitHub Issues
- 💬 Discusiones en GitHub Discussions
- 📧 Email: support@opencode.local

---

*Desarrollado con ❤️ para el futuro del desarrollo con IA*
