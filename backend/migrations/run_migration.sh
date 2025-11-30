#!/bin/bash

# Migration Runner Script
# Ejecuta las migraciones SQL en la base de datos

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  UNS-Shatak Migration Runner${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Verificar si Docker está corriendo
if ! docker ps &> /dev/null; then
    echo -e "${RED}❌ Error: Docker no está corriendo${NC}"
    exit 1
fi

# Verificar si el contenedor de PostgreSQL existe
CONTAINER_NAME="uns-shatak-v2-db-1"
if ! docker ps | grep -q "$CONTAINER_NAME"; then
    CONTAINER_NAME="uns-shatak-postgres-1"
    if ! docker ps | grep -q "$CONTAINER_NAME"; then
        echo -e "${RED}❌ Error: Contenedor PostgreSQL no encontrado${NC}"
        echo "Buscando contenedores de PostgreSQL disponibles:"
        docker ps --filter "ancestor=postgres" --format "{{.Names}}"
        exit 1
    fi
fi

echo -e "${GREEN}✓${NC} Contenedor PostgreSQL encontrado: ${CONTAINER_NAME}"

# Archivo de migración
MIGRATION_FILE="001_add_pricing_fields.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Error: Archivo de migración no encontrado: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${YELLOW}📄 Migrando:${NC} $MIGRATION_FILE"
echo ""

# Ejecutar la migración
echo -e "${YELLOW}⏳ Ejecutando migración...${NC}"

docker exec -i "$CONTAINER_NAME" psql -U postgres -d shatak_db < "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ Migración ejecutada exitosamente${NC}"
    echo ""
    echo -e "${GREEN}Cambios aplicados:${NC}"
    echo "  • Agregado campo 'pricing_type' a la tabla apartments"
    echo "  • Agregado campo 'custom_monthly_rate' a la tabla apartment_assignments"
    echo "  • Creado enum 'pricingtype' (shared, fixed)"
    echo ""
else
    echo -e "${RED}❌ Error al ejecutar la migración${NC}"
    exit 1
fi

# Verificar los cambios
echo -e "${YELLOW}Verificando cambios en la base de datos...${NC}"
docker exec -i "$CONTAINER_NAME" psql -U postgres -d shatak_db -c "\d apartments" | grep -E "pricing_type|Column"
docker exec -i "$CONTAINER_NAME" psql -U postgres -d shatak_db -c "\d apartment_assignments" | grep -E "custom_monthly_rate|Column"

echo ""
echo -e "${GREEN}✅ Todo listo!${NC}"
