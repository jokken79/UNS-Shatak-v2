"""
Import API - Importar Empleados y Fábricas desde Excel/CSV
"""

import io
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import pandas as pd
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Factory, Employee, ImportLog, User, ContractType
from app.schemas.schemas import ImportResult, ImportLogResponse

router = APIRouter(prefix="/import", tags=["Import (インポート)"])


def parse_date(value):
    if pd.isna(value) or value is None or value == '':
        return None
    if isinstance(value, datetime):
        return value.date()
    try:
        return pd.to_datetime(value).date()
    except:
        return None


def clean_string(value):
    if pd.isna(value) or value is None:
        return None
    return str(value).strip() if str(value).strip() else None


@router.post("/factories", response_model=ImportResult)
async def import_factories(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import factories from Excel/CSV"""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    
    if 'factory_code' not in df.columns or 'name' not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required columns: factory_code, name")
    
    total, successful, failed, errors, imported_ids = len(df), 0, 0, [], []
    
    for idx, row in df.iterrows():
        try:
            factory_code = clean_string(row.get('factory_code'))
            name = clean_string(row.get('name'))
            
            if not factory_code or not name:
                errors.append({"row": idx + 2, "error": "Missing factory_code or name"})
                failed += 1
                continue
            
            existing = db.query(Factory).filter(Factory.factory_code == factory_code).first()
            data = {
                'factory_code': factory_code, 'name': name,
                'name_japanese': clean_string(row.get('name_japanese')),
                'address': clean_string(row.get('address')),
                'city': clean_string(row.get('city')),
                'prefecture': clean_string(row.get('prefecture')),
                'postal_code': clean_string(row.get('postal_code')),
                'phone': clean_string(row.get('phone')),
                'contact_person': clean_string(row.get('contact_person')),
                'contact_email': clean_string(row.get('contact_email')),
                'notes': clean_string(row.get('notes')),
            }
            
            if existing:
                for k, v in data.items():
                    if v is not None:
                        setattr(existing, k, v)
                existing.is_active = True
                imported_ids.append(existing.id)
            else:
                factory = Factory(**data)
                db.add(factory)
                db.flush()
                imported_ids.append(factory.id)
            successful += 1
        except Exception as e:
            errors.append({"row": idx + 2, "error": str(e)})
            failed += 1
    
    db.commit()
    db.add(ImportLog(import_type="factories", file_name=file.filename, total_rows=total, 
                     successful_rows=successful, failed_rows=failed, errors=errors, imported_by=current_user.id))
    db.commit()
    
    return ImportResult(total_rows=total, successful_rows=successful, failed_rows=failed, errors=errors, imported_ids=imported_ids)


@router.post("/employees", response_model=ImportResult)
async def import_employees(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Import employees from Excel/CSV"""
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content)) if file.filename.endswith('.csv') else pd.read_excel(io.BytesIO(content))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
    
    df.columns = df.columns.str.strip().str.lower().str.replace(' ', '_')
    
    if 'employee_code' not in df.columns or 'full_name_roman' not in df.columns:
        raise HTTPException(status_code=400, detail="Missing required columns: employee_code, full_name_roman")
    
    factory_lookup = {f.factory_code: f.id for f in db.query(Factory).filter(Factory.is_active == True).all()}
    total, successful, failed, errors, imported_ids = len(df), 0, 0, [], []
    
    for idx, row in df.iterrows():
        try:
            employee_code = clean_string(row.get('employee_code'))
            full_name_roman = clean_string(row.get('full_name_roman'))
            
            if not employee_code or not full_name_roman:
                errors.append({"row": idx + 2, "error": "Missing employee_code or full_name_roman"})
                failed += 1
                continue
            
            existing = db.query(Employee).filter(Employee.employee_code == employee_code).first()
            contract_type_str = clean_string(row.get('contract_type'))
            contract_type = {'dispatch': ContractType.DISPATCH, 'contract': ContractType.CONTRACT,
                            'permanent': ContractType.PERMANENT, 'part_time': ContractType.PART_TIME
                            }.get(contract_type_str.lower() if contract_type_str else '', ContractType.DISPATCH)
            
            factory_code = clean_string(row.get('factory_code'))
            factory_id = factory_lookup.get(factory_code) if factory_code else None
            
            data = {
                'employee_code': employee_code, 'full_name_roman': full_name_roman,
                'full_name_kanji': clean_string(row.get('full_name_kanji')),
                'full_name_furigana': clean_string(row.get('full_name_furigana')),
                'nationality': clean_string(row.get('nationality')),
                'date_of_birth': parse_date(row.get('date_of_birth')),
                'gender': clean_string(row.get('gender')),
                'phone': clean_string(row.get('phone')),
                'email': clean_string(row.get('email')),
                'address': clean_string(row.get('address')),
                'visa_type': clean_string(row.get('visa_type')),
                'visa_expiry': parse_date(row.get('visa_expiry')),
                'employment_start_date': parse_date(row.get('employment_start_date')),
                'contract_type': contract_type, 'factory_id': factory_id,
                'notes': clean_string(row.get('notes')),
            }
            
            hourly = row.get('hourly_rate')
            if pd.notna(hourly):
                try:
                    data['hourly_rate'] = float(hourly)
                except:
                    pass
            
            if existing:
                for k, v in data.items():
                    if v is not None:
                        setattr(existing, k, v)
                existing.is_active = True
                imported_ids.append(existing.id)
            else:
                emp = Employee(**data)
                db.add(emp)
                db.flush()
                imported_ids.append(emp.id)
            successful += 1
        except Exception as e:
            errors.append({"row": idx + 2, "error": str(e)})
            failed += 1
    
    db.commit()
    db.add(ImportLog(import_type="employees", file_name=file.filename, total_rows=total,
                     successful_rows=successful, failed_rows=failed, errors=errors, imported_by=current_user.id))
    db.commit()
    
    return ImportResult(total_rows=total, successful_rows=successful, failed_rows=failed, errors=errors, imported_ids=imported_ids)


@router.get("/logs", response_model=List[ImportLogResponse])
async def get_import_logs(skip: int = 0, limit: int = 50, import_type: Optional[str] = None,
                          db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ImportLog)
    if import_type:
        query = query.filter(ImportLog.import_type == import_type)
    return query.order_by(ImportLog.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/template/{type}")
async def get_import_template(type: str):
    templates = {
        "factories": {
            "columns": ["factory_code*", "name*", "name_japanese", "address", "city", "prefecture", "postal_code", "phone", "contact_person", "contact_email", "notes"],
            "example": {"factory_code": "FAC001", "name": "Toyota Kariya Plant", "name_japanese": "トヨタ刈谷工場", "prefecture": "Aichi"}
        },
        "employees": {
            "columns": ["employee_code*", "full_name_roman*", "full_name_kanji", "nationality", "date_of_birth", "gender", "phone", "email", "visa_type", "visa_expiry", "employment_start_date", "contract_type", "hourly_rate", "factory_code", "notes"],
            "example": {"employee_code": "EMP001", "full_name_roman": "NGUYEN VAN ANH", "nationality": "Vietnamese", "contract_type": "dispatch", "factory_code": "FAC001"}
        }
    }
    if type not in templates:
        raise HTTPException(status_code=400, detail="Invalid type. Use 'factories' or 'employees'")
    return templates[type]
