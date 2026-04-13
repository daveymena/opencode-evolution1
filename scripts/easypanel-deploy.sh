#!/bin/bash
# ============================================================
# OpenCode Evolution - EasyPanel Deployment Script
# Script completo para desplegar en EasyPanel con optimización de recursos
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
echo "║  OpenCode Evolution - EasyPanel Deployment               ║"
echo "║  Optimizado para bajo consumo de memoria                 ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Variables
ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.production.yml"
MEMORY_LIMIT="2G"
CPU_LIMIT="2"

# Función para detectar recursos del sistema
detect_resources() {
    echo -e "${BLUE}🔍 Detectando recursos del sistema...${NC}"

    # Detectar memoria total
    TOTAL_MEM_MB=$(free -m | awk '/^Mem:/{print $2}')
    TOTAL_MEM_GB=$((TOTAL_MEM_MB / 1024))

    echo -e "   💾 Memoria detectada: ${TOTAL_MEM_GB}GB (${TOTAL_MEM_MB}MB)"

    # Sugerir límites basados en memoria disponible
    if [ "$TOTAL_MEM_GB" -lt 4 ]; then
        echo -e "${YELLOW}   ⚠️  Memoria limitada detectada. Ajustando configuración...${NC}"
        MEMORY_LIMIT="1536M"
        CPU_LIMIT="1"
    elif [ "$TOTAL_MEM_GB" -lt 8 ]; then
        echo -e "   ℹ️  Memoria moderada. Configurando para 4GB...${NC}"
        MEMORY_LIMIT="3G"
        CPU_LIMIT="2"
    else
        echo -e "   ✅ Memoria suficiente. Configuración óptima.${NC}"
        MEMORY_LIMIT="4G"
        CPU_LIMIT="4"
    fi

    echo ""
}

# Función para crear archivo .env
create_env_file() {
    echo -e "${BLUE}📝 Creando archivo de configuración...${NC}"

    cat > "$ENV_FILE" << EOF
# ============================================================
# OpenCode Evolution - Configuración de Producción
# EasyPanel Optimizado
# ============================================================

# Base de datos (REQUERIDO)
# Formato: postgresql://usuario:password@host:puerto/db
DATABASE_URL=

# Supabase (opcional)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# APIs - Modelos Gratuitos (obtener de):
# Groq: https://console.groq.com
GROQ_API_KEY=

# OpenRouter: https://openrouter.ai
OPENROUTER_API_KEY=

# Cerebras: https://cerebras.ai
CEREBRAS_API_KEY=

# Together AI: https://together.ai
TOGETHER_AI_API_KEY=

# APIs de Pago (opcional)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
GOOGLE_GENERATIVE_AI_API_KEY=

# Ollama (modelos locales)
OLLAMA_HOST=http://localhost:11434

# ============================================================
# Configuración de Recursos (auto-detectado)
# ============================================================
MEMORY_LIMIT=$MEMORY_LIMIT
MEMORY_RESERVATION=512M
CPU_LIMIT=$CPU_LIMIT
CPU_RESERVATION=1

# Directorio para workspace persistente
WORKSPACE_PATH=/opt/opencode/workspace
EOF

    if [ ! -f ".env" ]; then
        cp "$ENV_FILE" .env
        echo -e "${GREEN}✅ Archivo .env creado${NC}"
    else
        echo -e "${YELLOW}⚠️  El archivo .env ya existe. No se sobrescribió.${NC}"
        echo -e "   Revisa $ENV_FILE para las configuraciones sugeridas."
    fi

    echo ""
}

# Función para crear directorios necesarios
setup_directories() {
    echo -e "${BLUE}📁 Configurando directorios...${NC}"

    # Crear directorio para workspace
    WORKSPACE_DIR=$(grep WORKSPACE_PATH "$ENV_FILE" 2>/dev/null | cut -d= -f2 || echo "/opt/opencode/workspace")

    if [ ! -d "$WORKSPACE_DIR" ]; then
        sudo mkdir -p "$WORKSPACE_DIR"
        sudo chmod 755 "$WORKSPACE_DIR"
        echo -e "   ✅ Creado: $WORKSPACE_DIR"
    else
        echo -e "   ✅ Ya existe: $WORKSPACE_DIR"
    fi

    # Crear directorio para logs
    if [ ! -d "/var/log/opencode" ]; then
        sudo mkdir -p /var/log/opencode
        sudo chmod 755 /var/log/opencode
    fi

    echo ""
}

# Función para verificar Docker
verify_docker() {
    echo -e "${BLUE}🐳 Verificando Docker...${NC}"

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker no está instalado${NC}"
        echo "   Instala Docker primero: https://docs.docker.com/get-docker/"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        echo -e "${RED}❌ Docker Compose no está instalado${NC}"
        echo "   Instala Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    echo -e "   ✅ Docker disponible"
    echo ""
}

# Función para construir imágenes
build_images() {
    echo -e "${BLUE}🔨 Construyendo imágenes Docker...${NC}"

    # Usar BuildKit para builds más eficientes
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1

    docker-compose -f "$COMPOSE_FILE" build --no-cache

    echo -e "${GREEN}✅ Imágenes construidas${NC}"
    echo ""
}

# Función para iniciar servicios
start_services() {
    echo -e "${BLUE}🚀 Iniciando servicios...${NC}"

    # Iniciar solo el servicio principal (sin sandbox opcional)
    docker-compose -f "$COMPOSE_FILE" up -d opencode

    echo -e "${GREEN}✅ Servicios iniciados${NC}"
    echo ""
}

# Función para mostrar instrucciones finales
show_final_instructions() {
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║  ¡Despliegue completado!                                  ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${BLUE}📋 Próximos pasos:${NC}"
    echo ""
    echo "1. ${YELLOW}Configurar variables de entorno:${NC}"
    echo "   Edita el archivo .env y agrega tu DATABASE_URL"
    echo "   y al menos una API key (GROQ_API_KEY recomendada)"
    echo ""
    echo "2. ${YELLOW}Reiniciar servicios:${NC}"
    echo "   docker-compose -f $COMPOSE_FILE down"
    echo "   docker-compose -f $COMPOSE_FILE up -d"
    echo ""
    echo "3. ${YELLOW}Verificar estado:${NC}"
    echo "   docker-compose -f $COMPOSE_FILE ps"
    echo "   docker-compose -f $COMPOSE_FILE logs -f"
    echo ""
    echo "4. ${YELLOW}Iniciar monitor de memoria:${NC}"
    echo "   chmod +x scripts/memory-optimizer.sh"
    echo "   sudo ./scripts/memory-optimizer.sh start"
    echo ""
    echo -e "${BLUE}📊 Comandos útiles:${NC}"
    echo "   Ver logs:      docker-compose -f $COMPOSE_FILE logs -f"
    echo "   Reiniciar:     docker-compose -f $COMPOSE_FILE restart"
    echo "   Detener:       docker-compose -f $COMPOSE_FILE down"
    echo "   Ver recursos:  docker stats"
    echo ""
    echo -e "${BLUE}🌐 La aplicación estará disponible en:${NC}"
    echo "   http://localhost:3000"
    echo ""
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  setup       - Configuración inicial completa"
    echo "  deploy      - Desplegar/actualizar servicios"
    echo "  build       - Reconstruir imágenes Docker"
    echo "  stop        - Detener todos los servicios"
    echo "  logs        - Ver logs en tiempo real"
    echo "  status      - Ver estado de los servicios"
    echo "  cleanup     - Limpiar recursos no utilizados"
    echo "  help        - Mostrar esta ayuda"
}

# Menú principal
case "${1:-setup}" in
    setup)
        detect_resources
        verify_docker
        create_env_file
        setup_directories
        show_final_instructions
        ;;

    deploy)
        detect_resources
        verify_docker
        echo -e "${BLUE}🚀 Desplegando servicios...${NC}"
        docker-compose -f "$COMPOSE_FILE" pull
        docker-compose -f "$COMPOSE_FILE" up -d
        echo -e "${GREEN}✅ Despliegue completado${NC}"
        ;;

    build)
        verify_docker
        build_images
        ;;

    stop)
        echo -e "${BLUE}🛑 Deteniendo servicios...${NC}"
        docker-compose -f "$COMPOSE_FILE" down
        echo -e "${GREEN}✅ Servicios detenidos${NC}"
        ;;

    logs)
        docker-compose -f "$COMPOSE_FILE" logs -f
        ;;

    status)
        echo -e "${BLUE}📊 Estado de los servicios:${NC}"
        docker-compose -f "$COMPOSE_FILE" ps
        echo ""
        echo -e "${BLUE}💾 Uso de recursos:${NC}"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
        ;;

    cleanup)
        echo -e "${BLUE}🧹 Limpiando recursos...${NC}"
        docker system prune -f
        docker volume prune -f
        echo -e "${GREEN}✅ Limpieza completada${NC}"
        ;;

    help|--help|-h)
        show_help
        ;;

    *)
        echo -e "${RED}Comando desconocido: $1${NC}"
        show_help
        exit 1
        ;;
esac
