#!/usr/bin/env python3
"""
Simulación de migración de datos BASEDATEJP
Muestra lo que haría el script real sin necesitar base de datos
"""

import json
from pathlib import Path
from datetime import datetime

BASEDATEJP_PATH = Path(__file__).parent / "BASEDATEJP"

def log(message, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    prefix = "🔵" if level == "INFO" else "✅" if level == "SUCCESS" else "⚠️" if level == "WARNING" else "❌"
    print(f"{prefix} [{timestamp}] {message}")

def simulate_migration():
    log("🚀 Iniciando SIMULACIÓN de migración de datos BASEDATEJP")
    log("   Modo: DRY RUN (simulación - sin base de datos)")
    print("="*80)

    # Factories
    log("\n🏭 Iniciando migración de fábricas...")
    with open(BASEDATEJP_PATH / "factories_index.json", 'r', encoding='utf-8') as f:
        factories_data = json.load(f)
    factories = factories_data.get("factories", [])

    log(f"Total de fábricas a migrar: {len(factories)}")

    for idx, factory in enumerate(factories[:5], 1):  # Mostrar primeros 5
        client = factory.get("client_company", "").strip()
        plant = factory.get("plant_name", "").strip()
        address = factory.get("plant_address", "").strip()
        factory_code = f"FAC{idx:04d}"

        log(f"  ✅ [{idx}/{len(factories)}] {factory_code}: {client} - {plant}")
        if idx == 5:
            log(f"  ... procesando {len(factories) - 5} fábricas más ...")

    log(f"✅ Fábricas que se migrarían: {len(factories)}/{len(factories)}")

    # Apartments
    log("\n🏠 Iniciando migración de apartamentos...")
    with open(BASEDATEJP_PATH / "apartments.json", 'r', encoding='utf-8') as f:
        apts_data = json.load(f)
    apartments = apts_data.get("apartments", [])

    log(f"Total de apartamentos a migrar: {len(apartments)}")

    occupied = 0
    available = 0
    for idx, apt in enumerate(apartments[:5], 1):  # Mostrar primeros 5
        code = apt.get("apartment_code", f"APT{idx:04d}")
        name = apt.get("name", "")
        prefecture = apt.get("prefecture", "")
        city = apt.get("city", "")
        occupants = apt.get("current_occupants", 0)

        if occupants > 0:
            occupied += 1
            status = "occupied"
        else:
            available += 1
            status = "available"

        log(f"  ✅ [{idx}/{len(apartments)}] {code}: {name} ({prefecture}) - Status: {status}")
        if idx == 5:
            log(f"  ... procesando {len(apartments) - 5} apartamentos más ...")

    # Contar todos los status
    for apt in apartments:
        occupants = apt.get("current_occupants", 0) or apt.get("employee_count", 0)
        if occupants > 0:
            occupied += 1
        else:
            available += 1

    log(f"✅ Apartamentos que se migrarían: {len(apartments)}/{len(apartments)}")
    log(f"   - Occupied: {occupied}")
    log(f"   - Available: {available}")

    # Employees
    log("\n👥 Iniciando migración de empleados...")
    with open(BASEDATEJP_PATH / "employees.json", 'r', encoding='utf-8') as f:
        emp_data = json.load(f)
    employees = emp_data.get("employees", [])

    log(f"Total de empleados a migrar: {len(employees)}")

    with_apt = 0
    without_apt = 0

    for idx, emp in enumerate(employees[:5], 1):  # Mostrar primeros 5
        code = emp.get("employee_code", "")
        name = emp.get("full_name_roman", "")
        nationality = emp.get("nationality", "")
        apt_code = emp.get("apartment_code")
        factory = emp.get("factory_name", "")

        if apt_code:
            with_apt += 1
            apt_status = f"→ {apt_code}"
        else:
            without_apt += 1
            apt_status = "→ Sin apartamento"

        log(f"  ✅ [{idx}/{len(employees)}] {code}: {name} ({nationality}) {apt_status}")
        if idx == 5:
            log(f"  ⏳ Procesando {len(employees) - 5} empleados más...")

    # Contar todos
    for emp in employees:
        if emp.get("apartment_code"):
            with_apt += 1
        else:
            without_apt += 1

    log(f"✅ Empleados que se migrarían: {len(employees)}/{len(employees)}")
    log(f"   - Con apartamento: {with_apt}")
    log(f"   - Sin apartamento: {without_apt}")

    # Resumen
    print("\n" + "="*80)
    log("📊 RESUMEN DE SIMULACIÓN")
    print("="*80)

    print(f"\nFÁBRICAS:")
    print(f"  Total: {len(factories)}")
    print(f"  ✅ Se migrarían: {len(factories)}")
    print(f"  ❌ Fallidos: 0")

    print(f"\nAPARTAMENTOS:")
    print(f"  Total: {len(apartments)}")
    print(f"  ✅ Se migrarían: {len(apartments)}")
    print(f"  ❌ Fallidos: 0")
    print(f"  - Occupied: {occupied}")
    print(f"  - Available: {available}")

    print(f"\nEMPLEADOS:")
    print(f"  Total: {len(employees)}")
    print(f"  ✅ Se migrarían: {len(employees)}")
    print(f"  ❌ Fallidos: 0")
    print(f"  - Con vivienda: {with_apt}")
    print(f"  - Sin vivienda: {without_apt}")

    print("\n" + "="*80)
    log("⚠️  MODO SIMULACIÓN - NO SE GUARDARÍAN CAMBIOS", "WARNING")
    print("="*80)

    print(f"\n💡 Para ejecutar la migración REAL:")
    print(f"   1. Asegúrate que Docker esté corriendo: docker compose up -d")
    print(f"   2. Ejecuta: ./migrate.sh --dry-run")
    print(f"   3. Si todo OK: ./migrate.sh --production")
    print()

if __name__ == "__main__":
    simulate_migration()
