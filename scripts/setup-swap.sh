#!/bin/bash
# ============================================================
# OpenCode Evolution - Setup Swap para EasyPanel
# Configura swap en disco para extender RAM limitada
# ============================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  OpenCode Evolution - Configuración de Swap              ║"
echo "║  Para EasyPanel (extiende RAM con disco)                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Detectar usuario
if [ "$EUID" -ne 0 ]; then
   echo -e "${RED}❌ Este script necesita ejecutarse como root${NC}"
   echo "   Ejecuta: sudo ./scripts/setup-swap.sh"
   exit 1
fi

# Detectar espacio disponible
echo -e "${BLUE}🔍 Analizando sistema...${NC}"

TOTAL_DISK=$(df / | tail -1 | awk '{print $2}')
AVAILABLE_DISK=$(df / | tail -1 | awk '{print $4}')
TOTAL_RAM=$(free -m | awk '/^Mem:/{print $2}')

TOTAL_DISK_GB=$((TOTAL_DISK / 1024 / 1024))
AVAILABLE_DISK_GB=$((AVAILABLE_DISK / 1024 / 1024))
TOTAL_RAM_GB=$((TOTAL_RAM / 1024))

echo -e "   💾 Disco total: ${TOTAL_DISK_GB}GB"
echo -e "   ✅ Disco disponible: ${AVAILABLE_DISK_GB}GB"
echo -e "   📝 RAM física: ${TOTAL_RAM_GB}GB"
echo ""

# Verificar swap existente
echo -e "${BLUE}🔍 Verificando swap actual...${NC}"
SWAP_TOTAL=$(free -m | awk '/^Swap:/{print $2}')

if [ "$SWAP_TOTAL" -gt "0" ]; then
    SWAP_USED=$(free -m | awk '/^Swap:/{print $3}')
    echo -e "   ✅ Swap ya configurado: ${SWAP_TOTAL}MB total, ${SWAP_USED}MB usado"

    read -p "   ¿Quieres reconfigurar el swap? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${GREEN}✅ Manteniendo swap actual${NC}"
        exit 0
    fi
fi

# Calcular tamaño de swap recomendado
echo -e "${BLUE}📊 Calculando swap óptimo...${NC}"

# Reglas de swap según RAM:
# - Si RAM < 2GB: Swap = 2x RAM
# - Si RAM 2-8GB: Swap = RAM
# - Si RAM > 8GB: Swap = 4GB (máximo)

if [ "$TOTAL_RAM_GB" -lt "2" ]; then
    SWAP_SIZE_GB=$((TOTAL_RAM_GB * 2))
    RECOMMENDATION="2x RAM (poca RAM detectada)"
elif [ "$TOTAL_RAM_GB" -lt "8" ]; then
    SWAP_SIZE_GB=$TOTAL_RAM_GB
    RECOMMENDATION="1x RAM (configuración estándar)"
else
    SWAP_SIZE_GB=4
    RECOMMENDATION="4GB (suficiente RAM)"
fi

# Asegurar que no pida más swap del disco disponible
MAX_SWAP=$((AVAILABLE_DISK_GB / 2))
if [ "$SWAP_SIZE_GB" -gt "$MAX_SWAP" ]; then
    SWAP_SIZE_GB=$MAX_SWAP
    RECOMMENDATION="Ajustado al 50% del disco disponible"
fi

echo -e "   📊 Recomendación: ${SWAP_SIZE_GB}GB (${RECOMMENDATION})"
echo ""

# Preguntar tamaño
read -p "   Tamaño de swap en GB [${SWAP_SIZE_GB}]: " INPUT_SIZE
SWAP_SIZE_GB=${INPUT_SIZE:-$SWAP_SIZE_GB}

# Convertir a MB para cálculos
SWAP_SIZE_MB=$((SWAP_SIZE_GB * 1024))

echo ""
echo -e "${BLUE}⚙️ Configurando swap de ${SWAP_SIZE_GB}GB...${NC}"

# Desactivar swap existente si hay
echo -e "   🔄 Desactivando swap existente..."
swapoff -a 2>/dev/null || true

# Eliminar swapfile anterior si existe
if [ -f /swapfile ]; then
    echo -e "   🗑️ Eliminando swapfile anterior..."
    rm -f /swapfile
fi

# Crear nuevo swapfile
echo -e "   📝 Creando archivo de swap (${SWAP_SIZE_GB}GB)..."
if command -v fallocate > /dev/null; then
    fallocate -l ${SWAP_SIZE_GB}G /swapfile
else
    dd if=/dev/zero of=/swapfile bs=1M count=${SWAP_SIZE_MB} status=progress
fi

# Configurar permisos
echo -e "   🔒 Configurando permisos..."
chmod 600 /swapfile

# Formatear como swap
echo -e "   💿 Formateando como swap..."
mkswap /swapfile

# Activar swap
echo -e "   ✅ Activando swap..."
swapon /swapfile

# Hacer permanente
echo -e "   💾 Haciendo permanente en /etc/fstab..."
# Eliminar entrada anterior si existe
sed -i '/swapfile/d' /etc/fstab
# Agregar nueva entrada
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# Configurar swappiness (usar swap más agresivamente)
echo -e "   🔧 Optimizando configuración de swap..."
echo 'vm.swappiness=80' > /etc/sysctl.d/99-swap.conf
echo 'vm.vfs_cache_pressure=50' >> /etc/sysctl.d/99-swap.conf
echo 'vm.dirty_ratio=15' >> /etc/sysctl.d/99-swap.conf
echo 'vm.dirty_background_ratio=5' >> /etc/sysctl.d/99-swap.conf

# Aplicar configuración
sysctl --system > /dev/null

echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ SWAP CONFIGURADO EXITOSAMENTE                        ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Mostrar resultado
echo -e "${BLUE}📊 Estado actual:${NC}"
free -h | grep -E "(Mem|Swap)"
echo ""
swapon --show

echo ""
echo -e "${BLUE}📋 Configuración aplicada:${NC}"
echo -e "   • Archivo: /swapfile (${SWAP_SIZE_GB}GB)"
echo -e "   • Swappiness: 80 (usar swap activamente)"
echo -e "   • Persistente: Sí (en /etc/fstab)"
echo ""
echo -e "${GREEN}✅ Ahora puedes usar el docker-compose.disk-optimized.yml${NC}"
echo -e "   con MEMORY_LIMIT=1G y dejar que el swap haga el trabajo pesado.${NC}"
echo ""
echo -e "${YELLOW}💡 Tip: Monitorea el uso con 'free -h' y 'htop'${NC}"
