"""
Visitors API (訪問者)
Tracking de visitantes a apartamentos
"""

from typing import List, Optional
from uuid import UUID
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.models import Visitor, VisitorAccess, Apartment, Employee, User, VisitorType
from app.schemas.schemas import (
    VisitorCreate, VisitorUpdate, VisitorResponse,
    VisitorAccessCreate, VisitorAccessUpdate, VisitorAccessResponse
)

router = APIRouter(prefix="/visitors", tags=["Visitors (訪問者)"])

# Color mapping for visitor types
VISITOR_TYPE_COLORS = {
    VisitorType.FAMILY: "#FF6B6B",        # Red
    VisitorType.FRIEND: "#4ECDC4",        # Teal
    VisitorType.BUSINESS: "#45B7D1",      # Blue
    VisitorType.MAINTENANCE: "#F7B731",   # Orange
    VisitorType.INSPECTION: "#5F27CD",    # Purple
    VisitorType.DELIVERY: "#00D2D3",      # Cyan
    VisitorType.OTHER: "#95E1D3"          # Light green
}


# ===========================================
# Visitor Management
# ===========================================

@router.get("/", response_model=List[VisitorResponse])
async def list_visitors(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    search: Optional[str] = None,
    visitor_type: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all visitors"""
    query = db.query(Visitor).filter(Visitor.is_active == is_active)

    if visitor_type:
        query = query.filter(Visitor.visitor_type == visitor_type)
    if search:
        query = query.filter(or_(
            Visitor.visitor_name.ilike(f"%{search}%"),
            Visitor.phone.ilike(f"%{search}%"),
            Visitor.email.ilike(f"%{search}%")
        ))

    visitors = query.order_by(Visitor.visitor_name).offset(skip).limit(limit).all()
    return visitors


@router.get("/{visitor_id}", response_model=VisitorResponse)
async def get_visitor(
    visitor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get visitor by ID"""
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")
    return visitor


@router.post("/", response_model=VisitorResponse, status_code=201)
async def create_visitor(
    data: VisitorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new visitor"""
    visitor = Visitor(**data.model_dump())
    db.add(visitor)
    db.commit()
    db.refresh(visitor)
    return visitor


@router.put("/{visitor_id}", response_model=VisitorResponse)
async def update_visitor(
    visitor_id: UUID,
    data: VisitorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update visitor"""
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(visitor, field, value)

    db.commit()
    db.refresh(visitor)
    return visitor


@router.delete("/{visitor_id}", status_code=204)
async def delete_visitor(
    visitor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete visitor (soft delete)"""
    visitor = db.query(Visitor).filter(Visitor.id == visitor_id).first()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    visitor.is_active = False
    db.commit()


# ===========================================
# Visitor Access Management
# ===========================================

@router.get("/accesses/", response_model=List[VisitorAccessResponse])
async def list_visitor_accesses(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    apartment_id: Optional[UUID] = None,
    employee_id: Optional[UUID] = None,
    visitor_type: Optional[str] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List visitor accesses with filters.

    month: 1-12 (if provided, filters by month)
    year: YYYY (if provided, filters by year)
    """
    query = db.query(VisitorAccess)

    if apartment_id:
        query = query.filter(VisitorAccess.apartment_id == apartment_id)
    if employee_id:
        query = query.filter(VisitorAccess.employee_id == employee_id)
    if visitor_type:
        query = query.filter(VisitorAccess.visitor_type == visitor_type)

    # Filter by month and year if provided
    if month and year:
        query = query.filter(
            func.extract('month', VisitorAccess.entry_time) == month,
            func.extract('year', VisitorAccess.entry_time) == year
        )
    elif year:
        query = query.filter(func.extract('year', VisitorAccess.entry_time) == year)

    accesses = query.order_by(VisitorAccess.entry_time.desc()).offset(skip).limit(limit).all()
    return accesses


@router.get("/apartment/{apartment_id}", response_model=List[VisitorAccessResponse])
async def get_apartment_visitor_accesses(
    apartment_id: UUID,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all visitor accesses for a specific apartment, optionally filtered by month/year"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    query = db.query(VisitorAccess).filter(VisitorAccess.apartment_id == apartment_id)

    # Filter by month and year if provided
    if month and year:
        query = query.filter(
            func.extract('month', VisitorAccess.entry_time) == month,
            func.extract('year', VisitorAccess.entry_time) == year
        )
    elif year:
        query = query.filter(func.extract('year', VisitorAccess.entry_time) == year)

    accesses = query.order_by(VisitorAccess.entry_time.desc()).all()
    return accesses


@router.get("/employee/{employee_id}", response_model=List[VisitorAccessResponse])
async def get_employee_visitor_accesses(
    employee_id: UUID,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all visitor accesses for a specific employee, optionally filtered by month/year"""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    query = db.query(VisitorAccess).filter(VisitorAccess.employee_id == employee_id)

    # Filter by month and year if provided
    if month and year:
        query = query.filter(
            func.extract('month', VisitorAccess.entry_time) == month,
            func.extract('year', VisitorAccess.entry_time) == year
        )
    elif year:
        query = query.filter(func.extract('year', VisitorAccess.entry_time) == year)

    accesses = query.order_by(VisitorAccess.entry_time.desc()).all()
    return accesses


@router.post("/accesses/", response_model=VisitorAccessResponse, status_code=201)
async def create_visitor_access(
    data: VisitorAccessCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new visitor access record.

    color_code will be auto-assigned based on visitor_type if not provided
    """
    # Validate apartment and employee exist
    apartment = db.query(Apartment).filter(Apartment.id == data.apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Create access record
    access_data = data.model_dump()

    # Auto-assign color if not provided
    if not access_data.get("color_code"):
        access_data["color_code"] = VISITOR_TYPE_COLORS.get(
            data.visitor_type,
            VISITOR_TYPE_COLORS[VisitorType.OTHER]
        )

    access = VisitorAccess(**access_data)
    db.add(access)
    db.commit()
    db.refresh(access)
    return access


@router.get("/accesses/{access_id}", response_model=VisitorAccessResponse)
async def get_visitor_access(
    access_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get visitor access by ID"""
    access = db.query(VisitorAccess).filter(VisitorAccess.id == access_id).first()
    if not access:
        raise HTTPException(status_code=404, detail="Visitor access not found")
    return access


@router.put("/accesses/{access_id}", response_model=VisitorAccessResponse)
async def update_visitor_access(
    access_id: UUID,
    data: VisitorAccessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update visitor access (typically to mark exit time)"""
    access = db.query(VisitorAccess).filter(VisitorAccess.id == access_id).first()
    if not access:
        raise HTTPException(status_code=404, detail="Visitor access not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(access, field, value)

    db.commit()
    db.refresh(access)
    return access


@router.delete("/accesses/{access_id}", status_code=204)
async def delete_visitor_access(
    access_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete visitor access record"""
    access = db.query(VisitorAccess).filter(VisitorAccess.id == access_id).first()
    if not access:
        raise HTTPException(status_code=404, detail="Visitor access not found")

    db.delete(access)
    db.commit()


# ===========================================
# Statistics & Analytics
# ===========================================

@router.get("/stats/monthly/", response_model=dict)
async def get_monthly_visitor_stats(
    apartment_id: Optional[UUID] = None,
    month: Optional[int] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get visitor statistics for a specific month.
    Returns count of visitors by type and colors for visualization
    """
    query = db.query(VisitorAccess)

    if apartment_id:
        query = query.filter(VisitorAccess.apartment_id == apartment_id)

    # Default to current month if not specified
    if not (month and year):
        now = datetime.now()
        month = month or now.month
        year = year or now.year

    query = query.filter(
        func.extract('month', VisitorAccess.entry_time) == month,
        func.extract('year', VisitorAccess.entry_time) == year
    )

    accesses = query.all()

    # Group by visitor type
    stats_by_type = {}
    for visitor_type in VisitorType:
        count = sum(1 for a in accesses if a.visitor_type == visitor_type)
        if count > 0:
            stats_by_type[visitor_type.value] = {
                "count": count,
                "color": VISITOR_TYPE_COLORS[visitor_type]
            }

    return {
        "month": month,
        "year": year,
        "total_visits": len(accesses),
        "stats_by_type": stats_by_type,
        "visits": accesses
    }


@router.get("/stats/apartment/{apartment_id}", response_model=dict)
async def get_apartment_visitor_stats(
    apartment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get visitor statistics for an apartment"""
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")

    accesses = db.query(VisitorAccess).filter(VisitorAccess.apartment_id == apartment_id).all()

    # Statistics
    total_visits = len(accesses)
    by_type = {}
    by_visitor = {}

    for access in accesses:
        # By type
        type_key = access.visitor_type.value
        if type_key not in by_type:
            by_type[type_key] = {"count": 0, "color": VISITOR_TYPE_COLORS[access.visitor_type]}
        by_type[type_key]["count"] += 1

        # By visitor
        visitor_key = access.visitor_name
        if visitor_key not in by_visitor:
            by_visitor[visitor_key] = {"count": 0, "color": access.color_code}
        by_visitor[visitor_key]["count"] += 1

    return {
        "apartment_id": apartment_id,
        "apartment_code": apartment.apartment_code,
        "total_visits": total_visits,
        "by_type": by_type,
        "by_visitor": by_visitor
    }
