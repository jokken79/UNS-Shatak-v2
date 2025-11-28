"""
Employees API (従業員)
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Employee, Factory, Apartment, EmployeeStatus, User
from app.schemas.schemas import (
    EmployeeCreate, 
    EmployeeUpdate, 
    EmployeeResponse,
    EmployeeStatusEnum
)

router = APIRouter(prefix="/employees", tags=["Employees (従業員)"])


@router.get("/", response_model=List[EmployeeResponse])
async def list_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[EmployeeStatusEnum] = None,
    factory_id: Optional[UUID] = None,
    apartment_id: Optional[UUID] = None,
    has_apartment: Optional[bool] = None,
    search: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all employees with optional filters"""
    query = db.query(Employee).options(
        joinedload(Employee.factory),
        joinedload(Employee.apartment)
    ).filter(Employee.is_active == is_active)
    
    if status:
        query = query.filter(Employee.status == status.value)
    
    if factory_id:
        query = query.filter(Employee.factory_id == factory_id)
    
    if apartment_id:
        query = query.filter(Employee.apartment_id == apartment_id)
    
    if has_apartment is not None:
        if has_apartment:
            query = query.filter(Employee.apartment_id.isnot(None))
        else:
            query = query.filter(Employee.apartment_id.is_(None))
    
    if search:
        query = query.filter(
            or_(
                Employee.full_name_roman.ilike(f"%{search}%"),
                Employee.full_name_kanji.ilike(f"%{search}%"),
                Employee.employee_code.ilike(f"%{search}%"),
                Employee.phone.ilike(f"%{search}%")
            )
        )
    
    employees = query.order_by(Employee.employee_code).offset(skip).limit(limit).all()
    return employees


@router.get("/stats")
async def get_employees_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee statistics"""
    total = db.query(func.count(Employee.id)).filter(Employee.is_active == True).scalar()
    active = db.query(func.count(Employee.id)).filter(
        Employee.is_active == True,
        Employee.status == EmployeeStatus.ACTIVE
    ).scalar()
    with_apartment = db.query(func.count(Employee.id)).filter(
        Employee.is_active == True,
        Employee.apartment_id.isnot(None)
    ).scalar()
    without_apartment = db.query(func.count(Employee.id)).filter(
        Employee.is_active == True,
        Employee.apartment_id.is_(None)
    ).scalar()
    
    # By nationality
    by_nationality = db.query(
        Employee.nationality,
        func.count(Employee.id)
    ).filter(
        Employee.is_active == True
    ).group_by(Employee.nationality).all()
    
    # By factory
    by_factory = db.query(
        Factory.name,
        func.count(Employee.id)
    ).join(Factory, Employee.factory_id == Factory.id).filter(
        Employee.is_active == True
    ).group_by(Factory.name).all()
    
    return {
        "total": total,
        "active": active,
        "with_apartment": with_apartment,
        "without_apartment": without_apartment,
        "by_nationality": dict(by_nationality),
        "by_factory": dict(by_factory)
    }


@router.get("/without-apartment", response_model=List[EmployeeResponse])
async def list_employees_without_apartment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all active employees without an apartment"""
    employees = db.query(Employee).options(
        joinedload(Employee.factory)
    ).filter(
        Employee.is_active == True,
        Employee.status == EmployeeStatus.ACTIVE,
        Employee.apartment_id.is_(None)
    ).order_by(Employee.full_name_roman).all()
    
    return employees


@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get employee by ID"""
    employee = db.query(Employee).options(
        joinedload(Employee.factory),
        joinedload(Employee.apartment)
    ).filter(Employee.id == employee_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    return employee


@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new employee"""
    # Check if employee_code exists
    existing = db.query(Employee).filter(
        Employee.employee_code == employee_data.employee_code
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee with code {employee_data.employee_code} already exists"
        )
    
    # Validate factory_id if provided
    if employee_data.factory_id:
        factory = db.query(Factory).filter(Factory.id == employee_data.factory_id).first()
        if not factory:
            raise HTTPException(status_code=400, detail="Factory not found")
    
    # Validate apartment_id if provided
    if employee_data.apartment_id:
        apartment = db.query(Apartment).filter(Apartment.id == employee_data.apartment_id).first()
        if not apartment:
            raise HTTPException(status_code=400, detail="Apartment not found")
    
    new_employee = Employee(**employee_data.model_dump())
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)
    
    return new_employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: UUID,
    employee_data: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Check if new employee_code conflicts
    if employee_data.employee_code and employee_data.employee_code != employee.employee_code:
        existing = db.query(Employee).filter(
            Employee.employee_code == employee_data.employee_code
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with code {employee_data.employee_code} already exists"
            )
    
    update_data = employee_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(employee, key, value)
    
    db.commit()
    db.refresh(employee)
    
    return employee


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete an employee"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )
    
    # Remove from apartment if assigned
    if employee.apartment_id:
        apartment = db.query(Apartment).filter(Apartment.id == employee.apartment_id).first()
        if apartment:
            apartment.current_occupants = max(0, apartment.current_occupants - 1)
            if apartment.current_occupants == 0:
                from app.models.models import ApartmentStatus
                apartment.status = ApartmentStatus.AVAILABLE
    
    employee.is_active = False
    employee.apartment_id = None
    db.commit()
