# -*- coding: utf-8 -*-
"""
Data Management API - Gestión de datos de todas las tablas
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text, inspect
from typing import List, Optional, Any
import json
import csv
import io
from datetime import datetime, date
from decimal import Decimal
from uuid import UUID

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.models import (
    User, Factory, Apartment, Employee,
    ApartmentAssignment, ImportLog, AuditLog
)

router = APIRouter(prefix="/data", tags=["Data Management"])

# Mapeo de nombres de tabla a modelos
TABLE_MODELS = {
    "factories": Factory,
    "apartments": Apartment,
    "employees": Employee,
    "apartment_assignments": ApartmentAssignment,
    "import_logs": ImportLog,
    "users": User,
}

def serialize_value(value):
    """Serializar valores para JSON"""
    if value is None:
        return None
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, dict) or isinstance(value, list):
        return value
    return value

def row_to_dict(row):
    """Convertir una fila SQLAlchemy a diccionario"""
    if hasattr(row, '__table__'):
        return {c.name: serialize_value(getattr(row, c.name)) for c in row.__table__.columns}
    return dict(row._mapping) if hasattr(row, '_mapping') else dict(row)


@router.get("/tables")
async def list_tables(
    current_user: User = Depends(get_current_user)
):
    """Listar todas las tablas disponibles"""
    tables = []
    for name, model in TABLE_MODELS.items():
        tables.append({
            "name": name,
            "display_name": name.replace("_", " ").title(),
            "model": model.__name__
        })
    return {"tables": tables}


@router.get("/tables/{table_name}")
async def get_table_info(
    table_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener información de una tabla (columnas, tipos)"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]
    inspector = inspect(model)

    columns = []
    for column in model.__table__.columns:
        col_type = str(column.type)
        columns.append({
            "name": column.name,
            "type": col_type,
            "nullable": column.nullable,
            "primary_key": column.primary_key,
            "foreign_key": bool(column.foreign_keys),
            "default": str(column.default.arg) if column.default else None
        })

    # Contar registros
    count = db.query(model).count()

    return {
        "table_name": table_name,
        "columns": columns,
        "total_records": count
    }


@router.get("/tables/{table_name}/records")
async def get_table_records(
    table_name: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener registros de una tabla con paginación"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]
    query = db.query(model)

    # Búsqueda simple en campos de texto
    if search:
        search_filter = []
        for column in model.__table__.columns:
            if 'VARCHAR' in str(column.type).upper() or 'TEXT' in str(column.type).upper():
                search_filter.append(column.ilike(f"%{search}%"))
        if search_filter:
            from sqlalchemy import or_
            query = query.filter(or_(*search_filter))

    total = query.count()
    records = query.offset(skip).limit(limit).all()

    return {
        "table_name": table_name,
        "total": total,
        "skip": skip,
        "limit": limit,
        "records": [row_to_dict(r) for r in records]
    }


@router.get("/tables/{table_name}/records/{record_id}")
async def get_record(
    table_name: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener un registro específico"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]
    record = db.query(model).filter(model.id == record_id).first()

    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    return row_to_dict(record)


@router.post("/tables/{table_name}/records")
async def create_record(
    table_name: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Crear un nuevo registro"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]

    # Remover campos que no deben ser establecidos manualmente
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)

    try:
        record = model(**data)
        db.add(record)
        db.commit()
        db.refresh(record)
        return row_to_dict(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/tables/{table_name}/records/{record_id}")
async def update_record(
    table_name: str,
    record_id: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Actualizar un registro"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]
    record = db.query(model).filter(model.id == record_id).first()

    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    # Remover campos que no deben ser actualizados
    data.pop('id', None)
    data.pop('created_at', None)
    data.pop('updated_at', None)

    try:
        for key, value in data.items():
            if hasattr(record, key):
                setattr(record, key, value)
        db.commit()
        db.refresh(record)
        return row_to_dict(record)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/tables/{table_name}/records/{record_id}")
async def delete_record(
    table_name: str,
    record_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un registro"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]
    record = db.query(model).filter(model.id == record_id).first()

    if not record:
        raise HTTPException(status_code=404, detail="Registro no encontrado")

    try:
        db.delete(record)
        db.commit()
        return {"message": "Registro eliminado", "id": record_id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/tables/{table_name}/records")
async def delete_all_records(
    table_name: str,
    confirm: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar TODOS los registros de una tabla"""
    if not confirm:
        raise HTTPException(status_code=400, detail="Debes confirmar con ?confirm=true")

    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    if table_name == "users":
        raise HTTPException(status_code=403, detail="No se puede vaciar la tabla de usuarios")

    model = TABLE_MODELS[table_name]

    try:
        count = db.query(model).delete()
        db.commit()
        return {"message": f"Eliminados {count} registros de {table_name}"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tables/{table_name}/export")
async def export_table(
    table_name: str,
    format: str = Query("json", regex="^(json|csv)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exportar tabla a JSON o CSV"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    model = TABLE_MODELS[table_name]
    records = db.query(model).all()
    data = [row_to_dict(r) for r in records]

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{table_name}_{timestamp}"

    if format == "json":
        content = json.dumps(data, ensure_ascii=False, indent=2, default=str)
        return StreamingResponse(
            io.BytesIO(content.encode('utf-8')),
            media_type="application/json",
            headers={"Content-Disposition": f"attachment; filename={filename}.json"}
        )
    else:  # CSV
        if not data:
            return StreamingResponse(
                io.BytesIO(b""),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
            )

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=data[0].keys())
        writer.writeheader()
        writer.writerows(data)

        return StreamingResponse(
            io.BytesIO(output.getvalue().encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )


@router.post("/tables/{table_name}/import")
async def import_to_table(
    table_name: str,
    file: UploadFile = File(...),
    mode: str = Query("append", regex="^(append|replace)$"),
    sheet_name: Optional[str] = Query(None, description="Nombre de la hoja Excel"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Importar datos a una tabla desde JSON, CSV o Excel (solo columnas que existen en la tabla)"""
    if table_name not in TABLE_MODELS:
        raise HTTPException(status_code=404, detail=f"Tabla '{table_name}' no encontrada")

    if table_name == "users":
        raise HTTPException(status_code=403, detail="No se puede importar a la tabla de usuarios")

    model = TABLE_MODELS[table_name]

    # Obtener columnas válidas de la tabla
    valid_columns = {col.name for col in model.__table__.columns}
    # Excluir campos auto-generados
    excluded_columns = {'id', 'created_at', 'updated_at'}
    valid_columns = valid_columns - excluded_columns

    # Leer archivo
    content = await file.read()
    filename = file.filename.lower()

    try:
        data = []

        if filename.endswith('.json'):
            data = json.loads(content.decode('utf-8'))
            # Si es un objeto con key 'records' o similar, extraer la lista
            if isinstance(data, dict):
                for key in ['records', 'data', 'employees', 'apartments', 'factories', 'assignments']:
                    if key in data:
                        data = data[key]
                        break

        elif filename.endswith('.csv'):
            reader = csv.DictReader(io.StringIO(content.decode('utf-8')))
            data = list(reader)

        elif filename.endswith(('.xlsx', '.xls', '.xlsm')):
            # Importar Excel con pandas
            import pandas as pd

            # Guardar temporalmente el archivo
            temp_path = f"/tmp/{file.filename}"
            with open(temp_path, 'wb') as f:
                f.write(content)

            try:
                # Leer Excel
                if sheet_name:
                    df = pd.read_excel(temp_path, sheet_name=sheet_name)
                else:
                    # Si no se especifica hoja, usar la primera
                    xl = pd.ExcelFile(temp_path)
                    df = pd.read_excel(temp_path, sheet_name=xl.sheet_names[0])

                # Convertir a lista de diccionarios
                df = df.where(pd.notnull(df), None)
                data = df.to_dict('records')
            finally:
                import os
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa JSON, CSV o Excel (.xlsx, .xls, .xlsm)")

        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="Los datos deben ser una lista de registros")

        # Si mode es replace, eliminar todos los registros existentes
        if mode == "replace":
            db.query(model).delete()

        # Importar registros
        success = 0
        errors = []
        skipped_columns = set()

        for i, row in enumerate(data):
            try:
                # Filtrar solo columnas válidas
                filtered_row = {}
                for key, value in row.items():
                    # Normalizar nombre de columna (quitar espacios, etc)
                    clean_key = str(key).strip().lower().replace(' ', '_').replace('-', '_')

                    # Buscar coincidencia exacta o similar
                    matched_col = None
                    if clean_key in valid_columns:
                        matched_col = clean_key
                    else:
                        # Buscar en columnas válidas
                        for valid_col in valid_columns:
                            if valid_col.lower() == clean_key:
                                matched_col = valid_col
                                break

                    if matched_col:
                        # Convertir valores
                        if value == '' or value == 'null' or value == 'None' or (isinstance(value, float) and pd.isna(value) if 'pd' in dir() else False):
                            filtered_row[matched_col] = None
                        else:
                            filtered_row[matched_col] = value
                    else:
                        skipped_columns.add(str(key))

                if filtered_row:  # Solo crear si hay datos válidos
                    record = model(**filtered_row)
                    db.add(record)
                    success += 1

            except Exception as e:
                errors.append({"row": i + 1, "error": str(e)[:200]})

        db.commit()

        # Log de importación
        log = ImportLog(
            import_type=f"data_import_{table_name}",
            file_name=file.filename,
            total_rows=len(data),
            successful_rows=success,
            failed_rows=len(errors),
            errors=errors[:50],
            imported_by=current_user.id
        )
        db.add(log)
        db.commit()

        return {
            "message": f"Importación completada",
            "table": table_name,
            "mode": mode,
            "total": len(data),
            "success": success,
            "failed": len(errors),
            "columns_used": list(valid_columns),
            "columns_skipped": list(skipped_columns)[:20],
            "errors": errors[:10]
        }

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Error al parsear JSON")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/import-from-basedatejp")
async def import_from_basedatejp(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Importar todos los datos desde BASEDATEJP/*.json"""
    import os

    base_path = "/app/BASEDATEJP" if os.path.exists("/app/BASEDATEJP") else "BASEDATEJP"

    results = {
        "factories": {"success": 0, "errors": []},
        "apartments": {"success": 0, "errors": []},
        "employees": {"success": 0, "errors": []},
        "assignments": {"success": 0, "errors": []}
    }

    try:
        # 1. Importar fábricas desde factories_index.json
        factories_file = os.path.join(base_path, "factories_index.json")
        if os.path.exists(factories_file):
            with open(factories_file, 'r', encoding='utf-8') as f:
                factories_data = json.load(f)

            factories_list = factories_data.get('factories', [])
            for fac in factories_list:
                try:
                    factory = Factory(
                        factory_code=fac.get('factory_id', '').replace(' ', '_')[:20],
                        name=fac.get('client_company', '').strip()[:100],
                        name_japanese=fac.get('client_company', '').strip()[:100],
                        address=fac.get('plant_address', '')[:255],
                        phone=fac.get('plant_phone', '')[:20]
                    )
                    db.add(factory)
                    results["factories"]["success"] += 1
                except Exception as e:
                    results["factories"]["errors"].append(str(e)[:100])
            db.commit()

        # 2. Importar apartamentos
        apartments_file = os.path.join(base_path, "apartments.json")
        if os.path.exists(apartments_file):
            with open(apartments_file, 'r', encoding='utf-8') as f:
                apartments_data = json.load(f)

            apartments_list = apartments_data.get('apartments', [])
            for apt in apartments_list:
                try:
                    apartment = Apartment(
                        apartment_code=apt.get('apartment_code', '')[:20],
                        name=apt.get('name', '')[:100],
                        address=apt.get('address', '')[:255],
                        prefecture=apt.get('prefecture', '')[:50],
                        city=apt.get('city', '')[:50],
                        postal_code=apt.get('postal_code', '')[:10],
                        capacity=apt.get('capacity', 1),
                        current_occupants=apt.get('current_occupants', 0),
                        status=apt.get('status', 'available')
                    )
                    db.add(apartment)
                    results["apartments"]["success"] += 1
                except Exception as e:
                    results["apartments"]["errors"].append(str(e)[:100])
            db.commit()

        # 3. Importar empleados
        employees_file = os.path.join(base_path, "employees.json")
        if os.path.exists(employees_file):
            with open(employees_file, 'r', encoding='utf-8') as f:
                employees_data = json.load(f)

            employees_list = employees_data.get('employees', [])

            # Crear mapeo de códigos a IDs
            factory_map = {f.factory_code: f.id for f in db.query(Factory).all()}
            apartment_map = {a.apartment_code: a.id for a in db.query(Apartment).all()}

            for emp in employees_list:
                try:
                    # Buscar factory_id
                    factory_id = None
                    factory_name = emp.get('factory_name', '')
                    for code, fid in factory_map.items():
                        if factory_name and factory_name in code:
                            factory_id = fid
                            break

                    # Buscar apartment_id
                    apartment_id = apartment_map.get(emp.get('apartment_code'))

                    employee = Employee(
                        employee_code=emp.get('employee_code', '')[:20],
                        full_name_roman=emp.get('full_name_roman', '')[:100],
                        full_name_furigana=emp.get('full_name_furigana', '')[:100],
                        nationality=emp.get('nationality', '')[:50],
                        gender=emp.get('gender'),
                        date_of_birth=emp.get('date_of_birth'),
                        address=emp.get('address', '')[:255],
                        postal_code=emp.get('postal_code', '')[:10],
                        visa_type=emp.get('visa_type', '')[:50],
                        visa_expiry=emp.get('visa_expiry'),
                        employment_start_date=emp.get('employment_start_date'),
                        employment_end_date=emp.get('employment_end_date'),
                        contract_type=emp.get('contract_type', 'dispatch'),
                        hourly_rate=emp.get('hourly_rate'),
                        status=emp.get('status', 'active'),
                        factory_id=factory_id,
                        apartment_id=apartment_id
                    )
                    db.add(employee)
                    results["employees"]["success"] += 1
                except Exception as e:
                    results["employees"]["errors"].append(f"{emp.get('employee_code')}: {str(e)[:80]}")
            db.commit()

        # 4. Importar asignaciones
        assignments_file = os.path.join(base_path, "apartment_assignments.json")
        if os.path.exists(assignments_file):
            with open(assignments_file, 'r', encoding='utf-8') as f:
                assignments_data = json.load(f)

            assignments_list = assignments_data.get('assignments', [])

            # Actualizar mapeos
            employee_map = {e.employee_code: e.id for e in db.query(Employee).all()}
            apartment_map = {a.apartment_code: a.id for a in db.query(Apartment).all()}

            for asn in assignments_list:
                try:
                    emp_id = employee_map.get(asn.get('employee_code'))
                    apt_id = apartment_map.get(asn.get('apartment_code'))

                    if emp_id and apt_id:
                        assignment = ApartmentAssignment(
                            employee_id=emp_id,
                            apartment_id=apt_id,
                            move_in_date=asn.get('move_in_date') or datetime.now().date(),
                            is_current=asn.get('is_current', True)
                        )
                        db.add(assignment)
                        results["assignments"]["success"] += 1
                except Exception as e:
                    results["assignments"]["errors"].append(str(e)[:100])
            db.commit()

        return {
            "message": "Importación desde BASEDATEJP completada",
            "results": results
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
