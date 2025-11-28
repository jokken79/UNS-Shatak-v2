"""
Factories API (派遣先)
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Factory, Employee, User
from app.schemas.schemas import FactoryCreate, FactoryUpdate, FactoryResponse

router = APIRouter(prefix="/factories", tags=["Factories (派遣先)"])


@router.get("/", response_model=List[FactoryResponse])
async def list_factories(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    prefecture: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all factories"""
    query = db.query(Factory).filter(Factory.is_active == is_active)
    
    if prefecture:
        query = query.filter(Factory.prefecture.ilike(f"%{prefecture}%"))
    if search:
        query = query.filter(or_(
            Factory.name.ilike(f"%{search}%"),
            Factory.name_japanese.ilike(f"%{search}%"),
            Factory.factory_code.ilike(f"%{search}%")
        ))
    
    factories = query.order_by(Factory.factory_code).offset(skip).limit(limit).all()
    
    result = []
    for f in factories:
        r = FactoryResponse.model_validate(f)
        r.employee_count = db.query(func.count(Employee.id)).filter(
            Employee.factory_id == f.id, Employee.is_active == True
        ).scalar()
        result.append(r)
    return result


@router.get("/stats")
async def get_factories_stats(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total = db.query(func.count(Factory.id)).filter(Factory.is_active == True).scalar()
    by_prefecture = dict(db.query(Factory.prefecture, func.count(Factory.id)).filter(
        Factory.is_active == True, Factory.prefecture.isnot(None)
    ).group_by(Factory.prefecture).all())
    return {"total": total, "by_prefecture": by_prefecture}


@router.get("/{factory_id}", response_model=FactoryResponse)
async def get_factory(factory_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    result = FactoryResponse.model_validate(factory)
    result.employee_count = db.query(func.count(Employee.id)).filter(
        Employee.factory_id == factory.id, Employee.is_active == True
    ).scalar()
    return result


@router.post("/", response_model=FactoryResponse, status_code=201)
async def create_factory(data: FactoryCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if db.query(Factory).filter(Factory.factory_code == data.factory_code).first():
        raise HTTPException(status_code=400, detail=f"Factory code {data.factory_code} exists")
    factory = Factory(**data.model_dump())
    db.add(factory)
    db.commit()
    db.refresh(factory)
    result = FactoryResponse.model_validate(factory)
    result.employee_count = 0
    return result


@router.put("/{factory_id}", response_model=FactoryResponse)
async def update_factory(factory_id: UUID, data: FactoryUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(factory, k, v)
    db.commit()
    db.refresh(factory)
    result = FactoryResponse.model_validate(factory)
    result.employee_count = db.query(func.count(Employee.id)).filter(
        Employee.factory_id == factory.id, Employee.is_active == True
    ).scalar()
    return result


@router.delete("/{factory_id}", status_code=204)
async def delete_factory(factory_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    factory = db.query(Factory).filter(Factory.id == factory_id).first()
    if not factory:
        raise HTTPException(status_code=404, detail="Factory not found")
    factory.is_active = False
    db.commit()
