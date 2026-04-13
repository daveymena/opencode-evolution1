#!/bin/bash
# ============================================================
# OpenCode Evolution - Memory Optimizer
# Script de monitoreo y optimización de memoria para EasyPanel
# ============================================================

set -e

# Configuración
MEMORY_THRESHOLD=80          # Porcentaje de memoria para alerta
CRITICAL_THRESHOLD=90        # Porcentaje crítico de memoria
CLEANUP_INTERVAL=300         # Segundos entre limpiezas (5 min)
LOG_FILE="/var/log/opencode-memory.log"
PID_FILE="/var/run/opencode-memory.pid"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función de logging
log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Obtener uso de memoria actual
get_memory_usage() {
    free | grep Mem | awk '{printf "%.0f", ($3/$2) * 100.0}'
}

# Obtener memoria disponible en MB
get_free_memory_mb() {
    free -m | grep Mem | awk '{print $7}'
}

# Limpiar caché del sistema
clean_system_cache() {
    log "${YELLOW}🧹 Limpiando caché del sistema...${NC}"

    # Limpiar caché de página (requiere privilegios)
    if [ -f /proc/sys/vm/drop_caches ]; then
        echo 1 > /proc/sys/vm/drop_caches 2>/dev/null || true
        echo 2 > /proc/sys/vm/drop_caches 2>/dev/null || true
    fi

    # Limpiar buffers
    sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

    log "${GREEN}✅ Caché limpiada${NC}"
}

# Limpiar procesos zombie
clean_zombie_processes() {
    log "${YELLOW}🧹 Limpiando procesos zombie...${NC}"

    # Encontrar y matar procesos node zombie
    local zombie_pids=$(ps aux | grep node | grep -v grep | grep "<defunct>" | awk '{print $2}')
    if [ -n "$zombie_pids" ]; then
        echo "$zombie_pids" | xargs kill -9 2>/dev/null || true
        log "${GREEN}✅ Eliminados $(echo "$zombie_pids" | wc -l) procesos zombie${NC}"
    fi
}

# Optimizar Node.js processes
optimize_node_processes() {
    log "${YELLOW}🔧 Optimizando procesos Node.js...${NC}"

    # Forzar garbage collection en procesos node (si están en modo debug)
    # Esto es un "hack" para sugerir al V8 que haga GC
    local node_pids=$(pgrep -f node)
    for pid in $node_pids; do
        # Enviar señal USR1 para activar modo debug (triggers GC en algunos casos)
        kill -USR1 "$pid" 2>/dev/null || true
    done
}

# Limpiar archivos temporales
clean_temp_files() {
    log "${YELLOW}🗑️  Limpiando archivos temporales...${NC}"

    # Limpiar /tmp
    find /tmp -type f -atime +1 -delete 2>/dev/null || true

    # Limpiar caché de npm/pnpm
    if command -v pnpm &> /dev/null; then
        pnpm store prune 2>/dev/null || true
    fi

    npm cache clean --force 2>/dev/null || true

    # Limpiar logs antiguos
    find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true

    log "${GREEN}✅ Archivos temporales limpiados${NC}"
}

# Monitorear y reportar
monitor_memory() {
    while true; do
        local usage=$(get_memory_usage)
        local free_mb=$(get_free_memory_mb)

        log "📊 Memoria: ${usage}% usado (${free_mb}MB libres)"

        if [ "$usage" -gt "$CRITICAL_THRESHOLD" ]; then
            log "${RED}🚨 MEMORIA CRÍTICA: ${usage}%${NC}"
            clean_system_cache
            clean_zombie_processes
            optimize_node_processes
            clean_temp_files

        elif [ "$usage" -gt "$MEMORY_THRESHOLD" ]; then
            log "${YELLOW}⚠️  Memoria alta: ${usage}%${NC}"
            clean_system_cache
            clean_temp_files
        fi

        sleep "$CLEANUP_INTERVAL"
    done
}

# Comandos
show_status() {
    local usage=$(get_memory_usage)
    local total=$(free -h | grep Mem | awk '{print $2}')
    local used=$(free -h | grep Mem | awk '{print $3}')
    local free=$(free -h | grep Mem | awk '{print $7}')

    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║           Estado de Memoria - OpenCode Evolution          ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo ""
    echo "📊 Uso actual: ${usage}%"
    echo "💾 Total: $total"
    echo "📝 Usado: $used"
    echo "✅ Libre: $free"
    echo ""

    if [ "$usage" -gt "$CRITICAL_THRESHOLD" ]; then
        echo -e "${RED}⚠️  ESTADO: CRÍTICO${NC}"
    elif [ "$usage" -gt "$MEMORY_THRESHOLD" ]; then
        echo -e "${YELLOW}⚠️  ESTADO: ALTO${NC}"
    else
        echo -e "${GREEN}✅ ESTADO: NORMAL${NC}"
    fi
}

cleanup_now() {
    log "${YELLOW}🧹 Limpieza manual iniciada...${NC}"
    clean_system_cache
    clean_zombie_processes
    optimize_node_processes
    clean_temp_files
    log "${GREEN}✅ Limpieza completada${NC}"
    show_status
}

# Iniciar daemon
start_daemon() {
    if [ -f "$PID_FILE" ] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "El monitor ya está corriendo (PID: $(cat "$PID_FILE"))"
        exit 1
    fi

    echo "🚀 Iniciando monitor de memoria..."
    nohup "$0" monitor > /dev/null 2>&1 &
    echo $! > "$PID_FILE"
    echo "✅ Monitor iniciado (PID: $(cat "$PID_FILE"))"
}

stop_daemon() {
    if [ -f "$PID_FILE" ]; then
        kill $(cat "$PID_FILE") 2>/dev/null || true
        rm -f "$PID_FILE"
        echo "🛑 Monitor detenido"
    else
        echo "El monitor no está corriendo"
    fi
}

# Menú principal
case "${1:-status}" in
    start)
        start_daemon
        ;;
    stop)
        stop_daemon
        ;;
    restart)
        stop_daemon
        sleep 2
        start_daemon
        ;;
    status)
        show_status
        ;;
    monitor)
        monitor_memory
        ;;
    cleanup)
        cleanup_now
        ;;
    *)
        echo "Uso: $0 {start|stop|restart|status|cleanup}"
        echo ""
        echo "Comandos:"
        echo "  start   - Iniciar monitor de memoria en background"
        echo "  stop    - Detener monitor"
        echo "  restart - Reiniciar monitor"
        echo "  status  - Ver estado actual de memoria"
        echo "  cleanup - Ejecutar limpieza inmediata"
        exit 1
        ;;
esac
