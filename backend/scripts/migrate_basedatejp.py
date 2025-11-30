#!/usr/bin/env python3
"""
Script de migración de datos desde BASEDATEJP/ a PostgreSQL
UNS-Shatak v2 - 社宅管理システム

Este script importa:
- Fábricas (派遣先) desde factories_index.json
- Apartamentos (社宅) desde apartments.json
- Empleados (従業員) desde employees.json
"""

import json
import sys
import os
from pathlib import Path
from datetime import datetime, date
from typing import Dict, List, Optional
import re

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.models import (
    Factory, Apartment, Employee, ApartmentAssignment,
    ApartmentStatus, EmployeeStatus, ContractType, ImportLog
)
from app.core.config import settings

# Configuración
BASEDATEJP_PATH = Path(__file__).parent.parent.parent / "BASEDATEJP"
DRY_RUN = False  # Cambiar a False para ejecutar la migración real


class DataMigrator:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
        self.engine = create_engine(settings.DATABASE_URL)
        self.SessionLocal = sessionmaker(bind=self.engine)
        self.db = self.SessionLocal()

        self.stats = {
            "factories": {"total": 0, "success": 0, "failed": 0, "errors": []},
            "apartments": {"total": 0, "success": 0, "failed": 0, "errors": []},
            "employees": {"total": 0, "success": 0, "failed": 0, "errors": []},
        }

        # Mapeos para relaciones
        self.factory_map = {}  # factory_code -> Factory object
        self.apartment_map = {}  # apartment_code -> Apartment object

    def log(self, message: str, level="INFO"):
        """Log messages con timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = "🔵" if level == "INFO" else "✅" if level == "SUCCESS" else "⚠️" if level == "WARNING" else "❌"
        print(f"{prefix} [{timestamp}] {message}")

    def parse_date(self, date_str: Optional[str]) -> Optional[date]:
        """Parse fecha desde string"""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except:
            return None

    def clean_string(self, text: Optional[str]) -> Optional[str]:
        """Limpia strings, elimina tabs y espacios extras"""
        if not text:
            return None
        return re.sub(r'\s+', ' ', text.strip())

    def extract_prefecture_city(self, address: str) -> tuple:
        """Extrae prefectura y ciudad de una dirección japonesa"""
        if not address:
            return None, None

        # Patrón para prefecturas japonesas
        prefectures = [
            "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
            "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
            "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
            "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
            "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
            "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
            "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
        ]

        prefecture = None
        city = None

        for pref in prefectures:
            if pref in address:
                prefecture = pref
                # Extraer ciudad (texto después de la prefectura hasta el siguiente espacio o número)
                after_pref = address.split(pref)[1] if pref in address else ""
                city_match = re.match(r'^([^0-9]+?)(?:[0-9]|$)', after_pref)
                if city_match:
                    city = city_match.group(1).strip()
                break

        return prefecture, city

    def generate_factory_code(self, factory_name: str, plant_name: str) -> str:
        """Genera código único para fábrica"""
        # Usar los primeros caracteres del nombre
        base = factory_name[:10] if factory_name else "FACTORY"
        suffix = plant_name[:5] if plant_name else "PLANT"
        # Limpiar caracteres especiales
        code = f"{base}_{suffix}".replace(" ", "").replace("　", "")
        return code[:20]  # Limitar a 20 caracteres

    def migrate_factories(self):
        """Migra fábricas desde factories_index.json"""
        self.log("🏭 Iniciando migración de fábricas...")

        file_path = BASEDATEJP_PATH / "factories_index.json"
        if not file_path.exists():
            self.log(f"Archivo no encontrado: {file_path}", "ERROR")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        factories = data.get("factories", [])
        self.stats["factories"]["total"] = len(factories)

        for idx, factory_data in enumerate(factories, 1):
            try:
                factory_id = factory_data.get("factory_id", "")
                client_company = self.clean_string(factory_data.get("client_company", ""))
                plant_name = self.clean_string(factory_data.get("plant_name", ""))
                plant_address = self.clean_string(factory_data.get("plant_address", ""))
                company_phone = self.clean_string(factory_data.get("company_phone", ""))

                # Generar código único
                factory_code = f"FAC{idx:04d}"

                # Verificar si ya existe
                existing = self.db.query(Factory).filter(
                    Factory.factory_code == factory_code
                ).first()

                if existing:
                    self.log(f"  ⏭️  Fábrica ya existe: {factory_code} - {client_company}", "WARNING")
                    self.factory_map[factory_code] = existing
                    continue

                # Extraer prefectura y ciudad
                prefecture, city = self.extract_prefecture_city(plant_address)

                # Crear fábrica
                factory = Factory(
                    factory_code=factory_code,
                    name=f"{client_company} - {plant_name}" if plant_name else client_company,
                    name_japanese=client_company,
                    address=plant_address,
                    city=city,
                    prefecture=prefecture,
                    phone=company_phone,
                    notes=f"Factory ID original: {factory_id}",
                    is_active=True
                )

                if not self.dry_run:
                    self.db.add(factory)
                    self.db.flush()  # Para obtener el ID

                self.factory_map[factory_code] = factory
                self.stats["factories"]["success"] += 1
                self.log(f"  ✅ [{idx}/{len(factories)}] {factory_code}: {client_company} - {plant_name}")

            except Exception as e:
                self.stats["factories"]["failed"] += 1
                error_msg = f"Error en fábrica {idx}: {str(e)}"
                self.stats["factories"]["errors"].append(error_msg)
                self.log(f"  ❌ {error_msg}", "ERROR")

        if not self.dry_run:
            self.db.commit()

        self.log(f"✅ Fábricas migradas: {self.stats['factories']['success']}/{self.stats['factories']['total']}")

    def migrate_apartments(self):
        """Migra apartamentos desde apartments.json"""
        self.log("\n🏠 Iniciando migración de apartamentos...")

        file_path = BASEDATEJP_PATH / "apartments.json"
        if not file_path.exists():
            self.log(f"Archivo no encontrado: {file_path}", "ERROR")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        apartments = data.get("apartments", [])
        self.stats["apartments"]["total"] = len(apartments)

        for idx, apt_data in enumerate(apartments, 1):
            try:
                apartment_code = apt_data.get("apartment_code", f"APT{idx:04d}")
                name = self.clean_string(apt_data.get("name", ""))
                address = self.clean_string(apt_data.get("address", ""))
                postal_code = apt_data.get("postal_code", "")
                capacity = apt_data.get("capacity", 1)
                current_occupants = apt_data.get("current_occupants", 0)
                employee_count = apt_data.get("employee_count", 0)

                # Verificar si ya existe
                existing = self.db.query(Apartment).filter(
                    Apartment.apartment_code == apartment_code
                ).first()

                if existing:
                    self.log(f"  ⏭️  Apartamento ya existe: {apartment_code}", "WARNING")
                    self.apartment_map[apartment_code] = existing
                    continue

                # Extraer prefectura y ciudad del JSON (ya viene)
                prefecture = apt_data.get("prefecture", "")
                city = apt_data.get("city", "")

                # Si no viene, extraer de la dirección
                if not prefecture or not city:
                    prefecture, city = self.extract_prefecture_city(address)

                # Determinar status basado en ocupantes
                if current_occupants > 0 or employee_count > 0:
                    status = ApartmentStatus.OCCUPIED
                else:
                    status = ApartmentStatus.AVAILABLE

                # Crear apartamento
                apartment = Apartment(
                    apartment_code=apartment_code,
                    name=name or apartment_code,
                    address=address,
                    city=city,
                    prefecture=prefecture,
                    postal_code=postal_code,
                    capacity=capacity,
                    current_occupants=current_occupants or employee_count,
                    status=status,
                    is_active=True
                )

                if not self.dry_run:
                    self.db.add(apartment)
                    self.db.flush()

                self.apartment_map[apartment_code] = apartment
                self.stats["apartments"]["success"] += 1
                self.log(f"  ✅ [{idx}/{len(apartments)}] {apartment_code}: {name} ({prefecture})")

            except Exception as e:
                self.stats["apartments"]["failed"] += 1
                error_msg = f"Error en apartamento {idx}: {str(e)}"
                self.stats["apartments"]["errors"].append(error_msg)
                self.log(f"  ❌ {error_msg}", "ERROR")

        if not self.dry_run:
            self.db.commit()

        self.log(f"✅ Apartamentos migrados: {self.stats['apartments']['success']}/{self.stats['apartments']['total']}")

    def migrate_employees(self):
        """Migra empleados desde employees.json"""
        self.log("\n👥 Iniciando migración de empleados...")

        file_path = BASEDATEJP_PATH / "employees.json"
        if not file_path.exists():
            self.log(f"Archivo no encontrado: {file_path}", "ERROR")
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        employees = data.get("employees", [])
        self.stats["employees"]["total"] = len(employees)

        # Crear mapeo de nombres de fábrica a códigos
        factory_name_map = {}
        for factory in self.db.query(Factory).all():
            if factory.name_japanese:
                # Extraer el nombre base de la empresa (sin el nombre de planta)
                base_name = factory.name_japanese.strip()
                factory_name_map[base_name] = factory.factory_code

        for idx, emp_data in enumerate(employees, 1):
            try:
                employee_code = emp_data.get("employee_code", f"EMP{idx:06d}")
                full_name_roman = self.clean_string(emp_data.get("full_name_roman", ""))
                full_name_furigana = self.clean_string(emp_data.get("full_name_furigana", ""))

                # Verificar si ya existe
                existing = self.db.query(Employee).filter(
                    Employee.employee_code == employee_code
                ).first()

                if existing:
                    self.log(f"  ⏭️  Empleado ya existe: {employee_code} - {full_name_roman}", "WARNING")
                    continue

                # Extraer datos
                nationality = emp_data.get("nationality", "")
                gender = emp_data.get("gender", "")
                date_of_birth = self.parse_date(emp_data.get("date_of_birth"))
                address = self.clean_string(emp_data.get("address", ""))
                postal_code = emp_data.get("postal_code", "")
                visa_type = emp_data.get("visa_type", "")
                visa_expiry = self.parse_date(emp_data.get("visa_expiry"))
                employment_start_date = self.parse_date(emp_data.get("employment_start_date"))
                employment_end_date = self.parse_date(emp_data.get("employment_end_date"))
                hourly_rate = emp_data.get("hourly_rate")

                # Contract type
                contract_type_str = emp_data.get("contract_type", "dispatch")
                contract_type = ContractType.DISPATCH
                if contract_type_str == "contract":
                    contract_type = ContractType.CONTRACT
                elif contract_type_str == "permanent":
                    contract_type = ContractType.PERMANENT

                # Status
                status_str = emp_data.get("status", "active")
                status = EmployeeStatus.ACTIVE if status_str == "active" else EmployeeStatus.TERMINATED

                # Buscar fábrica por nombre
                factory_id = None
                factory_name = emp_data.get("factory_name", "")
                if factory_name:
                    # Buscar en el mapeo
                    for base_name, code in factory_name_map.items():
                        if factory_name in base_name or base_name in factory_name:
                            factory_obj = self.factory_map.get(code)
                            if factory_obj:
                                factory_id = factory_obj.id
                            break

                # Buscar apartamento por código
                apartment_id = None
                apartment_code = emp_data.get("apartment_code")
                if apartment_code and apartment_code in self.apartment_map:
                    apartment_id = self.apartment_map[apartment_code].id

                # Crear empleado
                employee = Employee(
                    employee_code=employee_code,
                    full_name_roman=full_name_roman,
                    full_name_furigana=full_name_furigana,
                    nationality=nationality,
                    date_of_birth=date_of_birth,
                    gender=gender,
                    address=address,
                    postal_code=postal_code,
                    visa_type=visa_type,
                    visa_expiry=visa_expiry,
                    employment_start_date=employment_start_date,
                    employment_end_date=employment_end_date,
                    contract_type=contract_type,
                    hourly_rate=hourly_rate,
                    status=status,
                    factory_id=factory_id,
                    apartment_id=apartment_id,
                    is_active=(status == EmployeeStatus.ACTIVE)
                )

                if not self.dry_run:
                    self.db.add(employee)

                    # Crear assignment si tiene apartamento
                    if apartment_id:
                        move_in_date = self.parse_date(emp_data.get("move_in_date"))
                        move_out_date = self.parse_date(emp_data.get("move_out_date"))

                        assignment = ApartmentAssignment(
                            apartment_id=apartment_id,
                            employee_id=employee.id,
                            move_in_date=move_in_date or employment_start_date or date.today(),
                            move_out_date=move_out_date,
                            is_current=(move_out_date is None)
                        )
                        self.db.add(assignment)

                self.stats["employees"]["success"] += 1

                if idx % 50 == 0:
                    self.log(f"  ⏳ Procesados {idx}/{len(employees)} empleados...")

            except Exception as e:
                self.stats["employees"]["failed"] += 1
                error_msg = f"Error en empleado {employee_code}: {str(e)}"
                self.stats["employees"]["errors"].append(error_msg)
                self.log(f"  ❌ {error_msg}", "ERROR")

        if not self.dry_run:
            self.db.commit()

        self.log(f"✅ Empleados migrados: {self.stats['employees']['success']}/{self.stats['employees']['total']}")

    def print_summary(self):
        """Imprime resumen de la migración"""
        self.log("\n" + "="*80)
        self.log("📊 RESUMEN DE MIGRACIÓN")
        self.log("="*80)

        for entity, stats in self.stats.items():
            self.log(f"\n{entity.upper()}:")
            self.log(f"  Total: {stats['total']}")
            self.log(f"  ✅ Exitosos: {stats['success']}")
            self.log(f"  ❌ Fallidos: {stats['failed']}")

            if stats['errors']:
                self.log(f"\n  Errores:")
                for error in stats['errors'][:5]:  # Mostrar primeros 5 errores
                    self.log(f"    - {error}")
                if len(stats['errors']) > 5:
                    self.log(f"    ... y {len(stats['errors']) - 5} errores más")

        self.log("\n" + "="*80)

        if self.dry_run:
            self.log("⚠️  MODO DRY RUN - NO SE GUARDARON CAMBIOS", "WARNING")
        else:
            self.log("✅ MIGRACIÓN COMPLETADA", "SUCCESS")

    def run(self):
        """Ejecuta la migración completa"""
        try:
            self.log("🚀 Iniciando migración de datos BASEDATEJP")
            self.log(f"   Modo: {'DRY RUN (sin guardar)' if self.dry_run else 'PRODUCCIÓN (guardará en BD)'}")
            self.log("="*80)

            self.migrate_factories()
            self.migrate_apartments()
            self.migrate_employees()

            self.print_summary()

        except Exception as e:
            self.log(f"Error fatal en migración: {str(e)}", "ERROR")
            if not self.dry_run:
                self.db.rollback()
        finally:
            self.db.close()


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Migración de datos BASEDATEJP a PostgreSQL")
    parser.add_argument("--dry-run", action="store_true", help="Ejecutar sin guardar cambios")
    parser.add_argument("--production", action="store_true", help="Ejecutar y guardar en base de datos")

    args = parser.parse_args()

    dry_run = not args.production

    if not dry_run:
        confirm = input("⚠️  ¿Está seguro de ejecutar la migración en PRODUCCIÓN? (yes/no): ")
        if confirm.lower() != "yes":
            print("❌ Migración cancelada")
            sys.exit(0)

    migrator = DataMigrator(dry_run=dry_run)
    migrator.run()
