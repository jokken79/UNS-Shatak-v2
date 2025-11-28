"""
Apartments API (社宅)
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Apartment, Employee, ApartmentStatus, User
from app.schemas.schemas import (
    ApartmentCreate, 
    ApartmentUpdate, 
    ApartmentResponse,
    ApartmentWithOccupants,
    ApartmentStatusEnum
)

router = APIRouter(prefix="/apartments", tags=["Apartments (社宅)"])


@router.get("/", response_model=List[ApartmentResponse])
async def list_apartments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    status: Optional[ApartmentStatusEnum] = None,
    city: Optional[str] = None,
    prefecture: Optional[str] = None,
    search: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all apartments with optional filters"""
    query = db.query(Apartment).filter(Apartment.is_active == is_active)
    
    if status:
        query = query.filter(Apartment.status == status.value)
    
    if city:
        query = query.filter(Apartment.city.ilike(f"%{city}%"))
    
    if prefecture:
        query = query.filter(Apartment.prefecture.ilike(f"%{prefecture}%"))
    
    if search:
        query = query.filter(
            or_(
                Apartment.name.ilike(f"%{search}%"),
                Apartment.apartment_code.ilike(f"%{search}%"),
                Apartment.address.ilike(f"%{search}%"),
                Apartment.building_name.ilike(f"%{search}%")
            )
        )
    
    apartments = query.order_by(Apartment.apartment_code).offset(skip).limit(limit).all()
    return apartments


@router.get("/stats")
async def get_apartments_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get apartment statistics"""
    total = db.query(func.count(Apartment.id)).filter(Apartment.is_active == True).scalar()
    available = db.query(func.count(Apartment.id)).filter(
        Apartment.is_active == True,
        Apartment.status == ApartmentStatus.AVAILABLE
    ).scalar()
    occupied = db.query(func.count(Apartment.id)).filter(
        Apartment.is_active == True,
        Apartment.status == ApartmentStatus.OCCUPIED
    ).scalar()
    maintenance = db.query(func.count(Apartment.id)).filter(
        Apartment.is_active == True,
        Apartment.status == ApartmentStatus.MAINTENANCE
    ).scalar()
    reserved = db.query(func.count(Apartment.id)).filter(
        Apartment.is_active == True,
        Apartment.status == ApartmentStatus.RESERVED
    ).scalar()
    
    total_capacity = db.query(func.sum(Apartment.capacity)).filter(
        Apartment.is_active == True
    ).scalar() or 0
    
    total_occupants = db.query(func.sum(Apartment.current_occupants)).filter(
        Apartment.is_active == True
    ).scalar() or 0
    
    occupancy_rate = (total_occupants / total_capacity * 100) if total_capacity > 0 else 0
    
    return {
        "total": total,
        "available": available,
        "occupied": occupied,
        "maintenance": maintenance,
        "reserved": reserved,
        "total_capacity": total_capacity,
        "total_occupants": total_occupants,
        "occupancy_rate": round(occupancy_rate, 2)
    }


@router.get("/{apartment_id}", response_model=ApartmentWithOccupants)
async def get_apartment(
    apartment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get apartment by ID with occupants"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    # Get current occupants
    occupants = db.query(Employee).filter(
        Employee.apartment_id == apartment_id,
        Employee.is_active == True
    ).all()
    
    response = ApartmentWithOccupants.model_validate(apartment)
    response.occupants = occupants
    
    return response


@router.post("/", response_model=ApartmentResponse, status_code=status.HTTP_201_CREATED)
async def create_apartment(
    apartment_data: ApartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new apartment"""
    # Check if apartment_code exists
    existing = db.query(Apartment).filter(
        Apartment.apartment_code == apartment_data.apartment_code
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Apartment with code {apartment_data.apartment_code} already exists"
        )
    
    new_apartment = Apartment(**apartment_data.model_dump())
    db.add(new_apartment)
    db.commit()
    db.refresh(new_apartment)
    
    return new_apartment


@router.put("/{apartment_id}", response_model=ApartmentResponse)
async def update_apartment(
    apartment_id: UUID,
    apartment_data: ApartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an apartment"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    # Check if new apartment_code conflicts
    if apartment_data.apartment_code and apartment_data.apartment_code != apartment.apartment_code:
        existing = db.query(Apartment).filter(
            Apartment.apartment_code == apartment_data.apartment_code
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Apartment with code {apartment_data.apartment_code} already exists"
            )
    
    update_data = apartment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(apartment, key, value)
    
    db.commit()
    db.refresh(apartment)
    
    return apartment


@router.delete("/{apartment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_apartment(
    apartment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Soft delete an apartment"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    
    if not apartment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apartment not found"
        )
    
    # Check if apartment has current occupants
    occupants = db.query(Employee).filter(
        Employee.apartment_id == apartment_id,
        Employee.is_active == True
    ).count()
    
    if occupants > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete apartment with {occupants} current occupant(s)"
        )
    
    apartment.is_active = False
    db.commit()


@router.post("/{apartment_id}/assign/{employee_id}")
async def assign_employee_to_apartment(
    apartment_id: UUID,
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Assign an employee to an apartment"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    # Check capacity
    if apartment.current_occupants >= apartment.capacity:
        raise HTTPException(
            status_code=400, 
            detail=f"Apartment is at full capacity ({apartment.capacity})"
        )
    
    # Update employee
    old_apartment_id = employee.apartment_id
    employee.apartment_id = apartment_id
    
    # Update apartment occupancy
    apartment.current_occupants += 1
    if apartment.current_occupants >= apartment.capacity:
        apartment.status = ApartmentStatus.OCCUPIED
    
    # Update old apartment if exists
    if old_apartment_id:
        old_apartment = db.query(Apartment).filter(Apartment.id == old_apartment_id).first()
        if old_apartment:
            old_apartment.current_occupants = max(0, old_apartment.current_occupants - 1)
            if old_apartment.current_occupants == 0:
                old_apartment.status = ApartmentStatus.AVAILABLE
    
    db.commit()
    
    return {"message": f"Employee {employee.full_name_roman} assigned to {apartment.name}"}


@router.post("/{apartment_id}/unassign/{employee_id}")
async def unassign_employee_from_apartment(
    apartment_id: UUID,
    employee_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove an employee from an apartment"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    if employee.apartment_id != apartment_id:
        raise HTTPException(
            status_code=400, 
            detail="Employee is not assigned to this apartment"
        )
    
    # Update employee
    employee.apartment_id = None
    
    # Update apartment
    apartment.current_occupants = max(0, apartment.current_occupants - 1)
    if apartment.current_occupants == 0:
        apartment.status = ApartmentStatus.AVAILABLE
    
    db.commit()
    
    return {"message": f"Employee {employee.full_name_roman} removed from {apartment.name}"}
