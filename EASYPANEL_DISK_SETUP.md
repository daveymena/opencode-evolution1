# OpenCode Evolution - Usar Disco en lugar de RAM en EasyPanel

## 🎯 El Problema

EasyPanel típicamente ofrece:
- **RAM**: 1-2GB (limitado y caro)
- **Almacenamiento**: 20-50GB+ (mucho espacio disponible)

## 💡 La Solución: Swap + Optimización de Disco

Convertimos GB de **disco barato** en GB de "RAM virtual".

---

## 📊 Arquitectura: RAM vs Disco

```
┌─────────────────────────────────────────────────────────┐
│                   EASYPanel SERVER                      │
├─────────────────────────────────────────────────────────┤
│  RAM Física (1-2GB)                                     │
│  ├─ Sistema operativo (300MB)                          │
│  ├─ Docker (200MB)                                     │
│  └─ OpenCode App (500MB) ← MÁXIMO                      │
│                                                         │
│  SWAP en Disco (4-8GB) ← ¡TU ALIADO!                   │
│  ├─ Extensión de RAM virtual                           │
│  └─ Más lento pero funciona                            │
│                                                         │
│  Almacenamiento (50GB)                                  │
│  ├─ Workspace: /opt/opencode/workspace (proyectos)    │
│  ├─ Cache: /opt/opencode/cache (npm, pnpm)            │
│  └─ Data: /opt/opencode/data (configs, db)            │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 PASO 1: Configurar SWAP en el Servidor EasyPanel

### Opción A: Script Automático (Recomendado)

```bash
# Descargar y ejecutar el script de configuración
chmod +x scripts/setup-swap.sh
sudo ./scripts/setup-swap.sh
```

### Opción B: Manual

```bash
# 1. Entrar al servidor EasyPanel vía SSH
ssh root@tu-servidor

# 2. Verificar espacio disponible
df -h

# 3. Crear archivo de swap de 8GB (ajusta según tu espacio)
# Importante: No uses más del 50% de tu disco disponible
sudo fallocate -l 8G /swapfile
# O si fallocate no está disponible:
# sudo dd if=/dev/zero of=/swapfile bs=1M count=8192

# 4. Configurar permisos
sudo chmod 600 /swapfile

# 5. Formatear como swap
sudo mkswap /swapfile

# 6. Activar swap
sudo swapon /swapfile

# 7. Verificar
sudo swapon --show
free -h

# 8. Hacer permanente (editar /etc/fstab)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 9. Ajustar swappiness (usar swap más agresivamente)
# Esto es clave: fuerza a usar swap en lugar de matar procesos
echo 'vm.swappiness=80' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=80

# 10. Verificar configuración
sudo sysctl vm.swappiness
```

---

## 📁 PASO 2: Crear Estructura de Directorios en Disco

```bash
# Crear directorios para persistencia en disco (no en contenedor)
sudo mkdir -p /opt/easypanel/opencode/workspace
sudo mkdir -p /opt/easypanel/opencode/cache/npm
sudo mkdir -p /opt/easypanel/opencode/cache/pnpm
sudo mkdir -p /opt/easypanel/opencode/data

# Asignar permisos (para que el contenedor pueda escribir)
sudo chmod -R 777 /opt/easypanel/opencode

# Verificar espacio
df -h /opt/easypanel/opencode
```

---

## ⚙️ PASO 3: Configurar el Docker Compose

### Usar el archivo optimizado para disco:

```bash
# En tu servidor EasyPanel
cd /opt/apps/opencode-evolution

# Crear archivo de configuración
cat > .env.disk << 'EOF'
# Base de datos
DATABASE_URL=postgresql://user:password@host:5432/opencode

# APIs
GROQ_API_KEY=gsk_xxxxx

# Rutas en disco (cambia según tu servidor)
WORKSPACE_PATH=/opt/easypanel/opencode/workspace
CACHE_PATH=/opt/easypanel/opencode/cache
DATA_PATH=/opt/easypanel/opencode/data

# Recursos: Mínima RAM, usa swap
MEMORY_LIMIT=1G
MEMORY_RESERVATION=256M
CPU_LIMIT=1
CPU_RESERVATION=0.5
EOF

# Desplegar
docker-compose -f docker-compose.disk-optimized.yml up -d
```

---

## 🔧 Configuración en EasyPanel UI

### 1. Crear Aplicación

- **Nombre**: `opencode-evolution`
- **Tipo**: Docker Compose
- **Compose File**: `docker-compose.disk-optimized.yml`

### 2. Variables de Entorno

```env
DATABASE_URL=postgresql://user:pass@host:5432/db
GROQ_API_KEY=gsk_xxxxx
WORKSPACE_PATH=/opt/easypanel/opencode/workspace
CACHE_PATH=/opt/easypanel/opencode/cache
DATA_PATH=/opt/easypanel/opencode/data
MEMORY_LIMIT=1G
MEMORY_RESERVATION=256M
```

### 3. Configurar Volúmenes Bind

En EasyPanel → Settings → Volumes, agregar:

| Host Path | Container Path | Descripción |
|-----------|----------------|-------------|
| `/opt/easypanel/opencode/workspace` | `/workspace` | Proyectos del usuario |
| `/opt/easypanel/opencode/cache` | `/cache` | Caché de npm/pnpm |
| `/opt/easypanel/opencode/data` | `/data` | Datos persistentes |

### 4. Recursos

| Configuración | Valor | Por qué |
|---------------|-------|---------|
| **Memory Limit** | `1G` o `1.5G` | Bajo, usa swap |
| **Memory Reservation** | `256M` | Mínimo vital |
| **Swap** | `4G` o `8G` | ¡CRÍTICO! |

---

## 📈 Monitoreo: Ver que usa Disco

### Ver uso de swap:
```bash
# En el servidor
free -h
swapon --show

# Ver proceso de swap
vmstat 1

# Ver qué está usando swap
for file in /proc/*/status ; do
  awk '/VmSwap|Name/{printf $2 " " $3}END{print ""}' $file
done | sort -k 2 -n -r | head -10
```

### Ver uso de disco:
```bash
# Espacio usado
du -sh /opt/easypanel/opencode/*

# Dentro del contenedor
docker exec opencode-evolution df -h
```

### Ver memoria real vs swap:
```bash
# En el servidor
ps aux --sort=-%mem | head -10

# Dentro del contenedor
docker stats opencode-evolution
```

---

## 🎛️ Optimizaciones Avanzadas

### 1. ZRAM (Alternativa a Swap en Disco)

Si EasyPanel no permite swap de archivo, usa ZRAM (compresión en RAM):

```bash
# Instalar zram-tools
sudo apt-get install zram-tools

# Configurar: 2GB de RAM comprimida = ~4GB efectivos
echo 'ALGO=lzo
PERCENT=50
PRIORITY=100' | sudo tee /etc/default/zramswap

# Reiniciar servicio
sudo systemctl restart zramswap

# Verificar
zramctl
```

### 2. Cache en Disco para Node.js

El `docker-compose.disk-optimized.yml` ya incluye:

```yaml
environment:
  # Caché de npm en disco
  - NPM_CONFIG_CACHE=/cache/npm
  - PNPM_HOME=/cache/pnpm

volumes:
  # Bind mount a disco
  - /opt/easypanel/opencode/cache:/cache
```

Esto significa que:
- **Sin caché**: Cada reinicio reinstala node_modules (~500MB en RAM)
- **Con caché**: Usa disco, RAM libre para la app

### 3. OOM Killer Desactivado (para contenedores)

```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 256M
# El swap maneja el exceso, no mata el proceso
```

---

## 🚨 Solución de Problemas

### "No se puede crear swap: Operation not permitted"

**Causa**: EasyPanel no da acceso root o está en contenedor LXC.

**Solución**: Contactar soporte de EasyPanel y pedir:
```
"Por favor activen swap de 4GB en mi servidor o denme acceso 
para crear /swapfile"
```

**Alternativa**: Usar el servicio `swap-manager` en el docker-compose:
```bash
docker-compose -f docker-compose.disk-optimized.yml --profile swap up -d
```

### "La app es muy lenta con swap"

**Normal**: Swap en disco es 100x más lento que RAM.

**Soluciones**:
1. Usar SSD (más rápido que HDD)
2. Aumentar RAM física mínima a 512M
3. Usar ZRAM (más rápido que swap en disco)

### "Se llena el disco con caché"

```bash
# Limpiar caché antigua (mayor a 30 días)
find /opt/easypanel/opencode/cache -type f -atime +30 -delete

# O limpiar todo (cuidado, reinicios serán más lentos)
rm -rf /opt/easypanel/opencode/cache/*
```

---

## 📊 Métricas Esperadas

Después de la configuración:

```
$ free -h
              total        used        free      shared  buff/cache   available
Mem:           1.9G        1.5G        120M        100M        280M        150M
Swap:          8.0G        1.2G        6.8G  ← ¡Esto es lo importante!

$ df -h /opt/easypanel/opencode
Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        50G   12G   38G  24% /
```

**Interpretación**:
- RAM: Casi llena (normal)
- Swap: Usando 1.2GB de 8GB disponible ✅
- Disco: 38GB libres para crecer ✅

---

## ✅ Checklist Final

- [ ] Configurar swap de 4-8GB en el servidor
- [ ] Crear directorios en `/opt/easypanel/opencode/`
- [ ] Configurar `vm.swappiness=80`
- [ ] Usar `docker-compose.disk-optimized.yml`
- [ ] Configurar bind volumes en EasyPanel
- [ ] Memory Limit: 1G (no más)
- [ ] Verificar que swap está activo: `swapon --show`
- [ ] Monitorear con `free -h` regularmente

---

## 💰 Comparación de Costos

| Recurso | EasyPanel Costo | Uso Recomendado |
|---------|-----------------|-----------------|
| **RAM** | $$$ (cara) | 1-1.5GB máximo |
| **Disco** | $ (barato) | 10-20GB libremente |
| **Swap** | Gratis | 4-8GB en disco |

**Resultado**: Funciona con planes de 1GB RAM + 20GB disco en lugar de 4GB RAM.

---

**¿Necesitas que te ayude a ejecutar algún paso específico o tienes acceso root a tu servidor EasyPanel?**
