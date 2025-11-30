#!/bin/bash
# Script de migración de datos BASEDATEJP a PostgreSQL
# UNS-Shatak v2 - 社宅管理システム

set -e

echo "🏠 UNS-Shatak v2 - Migración de Datos"
echo "======================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar si Docker está corriendo
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    exit 1
fi

# Verificar si docker compose está disponible
if ! docker compose version > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: docker compose no está disponible${NC}"
    exit 1
fi

# Verificar si los servicios están corriendo
if ! docker compose ps | grep -q "uns-shatak-backend.*running"; then
    echo -e "${YELLOW}⚠️  Los servicios no están corriendo. Iniciando...${NC}"
    docker compose up -d
    echo "⏳ Esperando 30 segundos para que los servicios inicien..."
    sleep 30
fi

# Función para mostrar ayuda
show_help() {
    echo "Uso: ./migrate.sh [OPCIÓN]"
    echo ""
    echo "Opciones:"
    echo "  --dry-run      Simular migración sin guardar cambios (recomendado primero)"
    echo "  --production   Ejecutar migración real y guardar en base de datos"
    echo "  --help         Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  ./migrate.sh --dry-run      # Probar primero"
    echo "  ./migrate.sh --production   # Migración real"
    echo ""
}

# Función para ejecutar migración
run_migration() {
    MODE=$1

    if [ "$MODE" = "--production" ]; then
        echo -e "${YELLOW}⚠️  ATENCIÓN: Esta operación guardará datos en la base de datos${NC}"
        echo ""
        read -p "¿Estás seguro de continuar? (yes/no): " CONFIRM
        if [ "$CONFIRM" != "yes" ]; then
            echo -e "${RED}❌ Migración cancelada${NC}"
            exit 0
        fi
    fi

    echo ""
    echo "🚀 Ejecutando migración en modo: $MODE"
    echo "======================================"
    echo ""

    # Ejecutar script de migración en el contenedor
    docker compose exec backend python scripts/migrate_basedatejp.py $MODE

    if [ $? -eq 0 ]; then
        echo ""
        echo -e "${GREEN}✅ Migración completada exitosamente${NC}"

        if [ "$MODE" = "--production" ]; then
            echo ""
            echo "📊 Verificar resultados:"
            echo "  • Frontend: http://localhost:3100"
            echo "  • Adminer:  http://localhost:8180"
            echo "  • API Docs: http://localhost:8100/api/docs"
        fi
    else
        echo ""
        echo -e "${RED}❌ Error en la migración${NC}"
        exit 1
    fi
}

# Verificar archivos de datos
check_data_files() {
    echo "🔍 Verificando archivos de datos..."

    FILES=(
        "BASEDATEJP/employees.json"
        "BASEDATEJP/apartments.json"
        "BASEDATEJP/factories_index.json"
    )

    ALL_OK=true
    for FILE in "${FILES[@]}"; do
        if [ -f "$FILE" ]; then
            echo -e "  ${GREEN}✓${NC} $FILE"
        else
            echo -e "  ${RED}✗${NC} $FILE (no encontrado)"
            ALL_OK=false
        fi
    done

    if [ "$ALL_OK" = false ]; then
        echo ""
        echo -e "${RED}❌ Error: Faltan archivos de datos en BASEDATEJP/${NC}"
        exit 1
    fi

    echo ""
}

# Main
case "$1" in
    --dry-run)
        check_data_files
        run_migration "--dry-run"
        ;;
    --production)
        check_data_files
        run_migration "--production"
        ;;
    --help|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Opción no válida: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
