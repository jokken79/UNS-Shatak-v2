#!/bin/bash
# Script para verificar los datos de BASEDATEJP
# UNS-Shatak v2

echo "📊 Verificación de Datos BASEDATEJP"
echo "===================================="
echo ""

# Función para contar registros en JSON
count_json_records() {
    FILE=$1
    KEY=$2

    if [ -f "$FILE" ]; then
        COUNT=$(jq ".$KEY | length" "$FILE" 2>/dev/null || echo "0")
        echo "$COUNT"
    else
        echo "0"
    fi
}

# Verificar archivos
echo "📁 Archivos disponibles:"
echo ""

if [ -f "BASEDATEJP/employees.json" ]; then
    EMP_COUNT=$(count_json_records "BASEDATEJP/employees.json" "employees")
    echo "  ✅ employees.json - $EMP_COUNT empleados"
else
    echo "  ❌ employees.json - No encontrado"
fi

if [ -f "BASEDATEJP/apartments.json" ]; then
    APT_COUNT=$(count_json_records "BASEDATEJP/apartments.json" "apartments")
    echo "  ✅ apartments.json - $APT_COUNT apartamentos"
else
    echo "  ❌ apartments.json - No encontrado"
fi

if [ -f "BASEDATEJP/factories_index.json" ]; then
    FAC_COUNT=$(count_json_records "BASEDATEJP/factories_index.json" "factories")
    echo "  ✅ factories_index.json - $FAC_COUNT fábricas"
else
    echo "  ❌ factories_index.json - No encontrado"
fi

if [ -f "BASEDATEJP/company.json" ]; then
    echo "  ✅ company.json - Información de UNS-KIKAKU"
else
    echo "  ❌ company.json - No encontrado"
fi

echo ""
echo "📊 Resumen de datos a migrar:"
echo ""
echo "  • Fábricas (派遣先):      ${FAC_COUNT:-0}"
echo "  • Apartamentos (社宅):     ${APT_COUNT:-0}"
echo "  • Empleados (従業員):      ${EMP_COUNT:-0}"
echo ""

# Mostrar algunos ejemplos si jq está disponible
if command -v jq &> /dev/null; then
    echo "👥 Ejemplo de empleados:"
    echo ""
    jq -r '.employees[0:3] | .[] | "  • \(.employee_code) - \(.full_name_roman) (\(.nationality))"' BASEDATEJP/employees.json 2>/dev/null || echo "  (No disponible)"

    echo ""
    echo "🏠 Ejemplo de apartamentos:"
    echo ""
    jq -r '.apartments[0:3] | .[] | "  • \(.apartment_code) - \(.name) (\(.prefecture))"' BASEDATEJP/apartments.json 2>/dev/null || echo "  (No disponible)"

    echo ""
    echo "🏭 Ejemplo de fábricas:"
    echo ""
    jq -r '.factories[0:3] | .[] | "  • \(.client_company) - \(.plant_name)"' BASEDATEJP/factories_index.json 2>/dev/null || echo "  (No disponible)"
fi

echo ""
echo "======================================"
echo "Para migrar estos datos, ejecuta:"
echo "  ./migrate.sh --dry-run      # Probar primero"
echo "  ./migrate.sh --production   # Migración real"
echo ""
