# 🌌 OpenCode Evolved

Una plataforma revolucionaria de desarrollo impulsada por Inteligencia Artificial, diseñada como un **IDE Full-Stack** con capacidades de chat contextual profundo, ejecución de código en vivo y una interfaz premium de estado del arte (Dark Glassmorphism).

---

## ✨ Características Principales

- **🤖 IA Core (MCP Inteligente):** Integración nativa con múltiples proveedores de IA (Ollama, Antrophic, Groq) listos para leer, razonar y escribir código por ti.
- **💻 Editor Integrado (Monaco):** La misma potencia subyacente que VS Code, operando directamente desde tu navegador con coloreado sintáctico, autocompletado y minimapa.
- **🎨 UI/UX Premium:** Interfaz brutalmente diseñada con *Tailwind CSS* y *Framer Motion* que rinde homenaje a un entorno oscuro profundo, transiciones fluidas y componentes cristalinos.
- **🗄️ Base de Datos Relacional:** Soporte robusto y escalable respaldado por **Supabase (PostgreSQL)** y manejado íntegramente de manera tipada a través de **Drizzle ORM**.
- **💳 Pasarela de Pagos Global:** Listo para monetizar tu plataforma con integraciones transparentes usando la seguridad de **MercadoPago** y **PayPal**.
- **🚀 Infraestructura Dockerizada:** Archivo Docker unificado listo para un despliegue de un solo clic, sin fricciones en plataformas como **EasyPanel**, Vercel o VPS puros.

---

## 🛠️ Stack Tecnológico (Monorepo)

**Frontend (`artifacts/opencode-evolved`)**
- ⚛️ React 18 & Vite
- 👗 Tailwind CSS & Radix UI
- ✨ Framer Motion (Animaciones)
- 📝 Monaco Editor (Escritura de código)
- 🪝 TanStack Query (Estado asíncrono)

**Backend (`artifacts/api-server`)**
- 🟢 Node.js v22 (ESM)
- 🚂 Express / Fastify (Enrutamiento)
- 🛡️ Zod (Validación estricta)
- 🐘 Drizzle ORM & Supabase

---

## 🚦 Guía de Despliegue (EasyPanel / Docker)

Este repositorio está preparado nativamente para despliegues instantáneos mediante Docker en entornos Linux.

1. **Variables de Entorno (`.env`):**
   Asegúrate de definir estas variables maestras en el panel de `Environment` de tu EasyPanel o VPS:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@db.supabase.co:5432/postgres
   
   # IA APIs (Opcional si usas modelos locales)
   GROQ_API_KEY=tu_llave
   ANTHROPIC_API_KEY=tu_llave
   
   # Pagos
   MERCADO_PAGO_PUBLIC_KEY=...
   MERCADOPAGO_ACCESS_TOKEN=...
   PAYPAL_CLIENT_ID=...
   ```

2. **Migración de la Base de Datos:**
   La primera vez que enciendas la aplicación, las tablas deben inyectarse en la plataforma SQL:
   ```bash
   cd lib/db
   pnpm run push-force
   ```

3. **Ejecución Docker:**
   Simplemente construye y despliega:
   ```bash
   docker build -t opencode-evo .
   docker run -p 3000:3000 --env-file .env opencode-evo
   ```

---

## 🚀 Desarrollo Local

Si deseas clonar el proyecto y modificarlo en tu propia máquina:

1. **Instalar Dependencias Globales:**
   ```bash
   npm install -g pnpm pm2
   ```

2. **Instalar Dependencias Monorepo:**
   ```bash
   pnpm install
   ```

3. **Ejecutar en Modo Desarrollo:**
   Se levantarán los motores tanto del API (Backend) como de Vite (Frontend) simultáneamente:
   ```bash
   # En una terminal para el API:
   pnpm --filter @workspace/api-server run dev
   
   # En otra terminal para el UI:
   pnpm --filter @workspace/opencode-evolved run dev
   ```

---

*Desarrollado con Arquitectura Avanzada para escalar las ideas hacia el futuro de forma instantánea.*
