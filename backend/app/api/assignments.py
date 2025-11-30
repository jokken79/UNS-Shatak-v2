# -*- coding: utf-8 -*-
"""
Apartment Assignments API - Gestión de asignaciones con cálculos de precio
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from ..core.database import get_db
from ..core.security import get_current_user
from ..models.models import (
    User, Apartment, Employee, ApartmentAssignment,
    ApartmentStatus, EmployeeStatus, PricingType
)
from ..schemas.schemas import (
    AssignmentCreate, AssignmentUpdate, AssignmentResponse, EmployeeSimple
)
from ..utils.rent_calculator import calculate_assignment_costs

router = APIRouter(prefix="/assignments", tags=["Assignments"])


@router.get("", response_model=List[AssignmentResponse])
async def list_assignments(
    employee_id: Optional[UUID] = None,
    apartment_id: Optional[UUID] = None,
    is_current: Optional[bool] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Listar asignaciones de apartamentos con filtros opcionales
    """
    query = db.query(ApartmentAssignment)

    if employee_id:
        query = query.filter(ApartmentAssignment.employee_id == employee_id)
    if apartment_id:
        query = query.filter(ApartmentAssignment.apartment_id == apartment_id)
    if is_current is not None:
        query = query.filter(ApartmentAssignment.is_current == is_current)

    # Ordenar por fecha de entrada (más reciente primero)
    query = query.order_by(ApartmentAssignment.move_in_date.desc())

    total = query.count()
    assignments = query.offset(skip).limit(limit).all()

    return assignments


@router.get("/{assignment_id}", response_model=AssignmentResponse)
async def get_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener una asignación específica
    """
    assignment = db.query(ApartmentAssignment).filter(
        ApartmentAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    return assignment


@router.post("/calculate", response_model=dict)
async def calculate_assignment_price(
    apartment_id: UUID,
    employee_id: UUID,
    move_in_date: date,
    custom_monthly_rate: Optional[Decimal] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Calcular el precio de una asignación sin crearla.
    Útil para preview antes de confirmar.
    """
    apartment = db.query(Apartment).filter(Apartment.id == apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartamento no encontrado")

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # Calcular los ocupantes después de agregar al nuevo empleado
    future_occupants = apartment.current_occupants + 1

    # Usar el calculador de renta
    costs = calculate_assignment_costs(
        apartment_monthly_rent=apartment.monthly_rent or Decimal('0'),
        apartment_deposit=apartment.deposit or Decimal('0'),
        apartment_key_money=apartment.key_money or Decimal('0'),
        apartment_management_fee=apartment.management_fee or Decimal('0'),
        apartment_pricing_type=apartment.pricing_type.value,
        apartment_current_occupants=future_occupants,
        apartment_utilities_included=apartment.utilities_included,
        apartment_parking_included=apartment.parking_included,
        apartment_parking_fee=apartment.parking_fee or Decimal('0'),
        move_in_date=move_in_date,
        custom_monthly_rate=custom_monthly_rate
    )

    return {
        "apartment": {
            "id": str(apartment.id),
            "name": apartment.name,
            "apartment_code": apartment.apartment_code,
            "pricing_type": apartment.pricing_type.value,
            "current_occupants": apartment.current_occupants,
            "future_occupants": future_occupants,
            "capacity": apartment.capacity
        },
        "employee": {
            "id": str(employee.id),
            "employee_code": employee.employee_code,
            "full_name_roman": employee.full_name_roman
        },
        "move_in_date": move_in_date.isoformat(),
        "costs": costs
    }


@router.post("", response_model=AssignmentResponse)
async def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Crear una nueva asignación de apartamento.

    FLUJO COMPLETO:
    1. Validar que el apartamento existe y tiene capacidad
    2. Validar que el empleado existe
    3. Calcular el precio según el tipo de apartamento (shared/fixed)
    4. Crear la asignación con el precio calculado
    5. Actualizar el apartamento (incrementar ocupantes)
    6. Si el empleado tenía apartamento anterior, liberarlo
    7. Actualizar el empleado con el nuevo apartamento_id
    """
    # 1. Obtener el apartamento
    apartment = db.query(Apartment).filter(Apartment.id == data.apartment_id).first()
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartamento no encontrado")

    # 2. Validar capacidad
    if apartment.current_occupants >= apartment.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"El apartamento está lleno ({apartment.current_occupants}/{apartment.capacity})"
        )

    # 3. Obtener el empleado
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")

    # 4. Si el empleado ya tiene un apartamento, marcar la asignación anterior como no actual
    if employee.apartment_id:
        old_assignment = db.query(ApartmentAssignment).filter(
            and_(
                ApartmentAssignment.employee_id == employee.id,
                ApartmentAssignment.is_current == True
            )
        ).first()

        if old_assignment:
            old_assignment.is_current = False
            old_assignment.move_out_date = data.move_in_date

        # Liberar el apartamento anterior
        old_apartment = db.query(Apartment).filter(Apartment.id == employee.apartment_id).first()
        if old_apartment:
            old_apartment.current_occupants = max(0, old_apartment.current_occupants - 1)
            if old_apartment.current_occupants < old_apartment.capacity:
                old_apartment.status = ApartmentStatus.AVAILABLE

    # 5. Calcular future occupants (después de agregar al nuevo)
    future_occupants = apartment.current_occupants + 1

    # 6. Calcular el precio mensual según el tipo de apartamento
    if data.custom_monthly_rate:
        # Si se especificó un precio personalizado, usarlo
        monthly_charge = data.custom_monthly_rate
    else:
        # Calcular usando la calculadora de renta
        costs = calculate_assignment_costs(
            apartment_monthly_rent=apartment.monthly_rent or Decimal('0'),
            apartment_deposit=apartment.deposit or Decimal('0'),
            apartment_key_money=apartment.key_money or Decimal('0'),
            apartment_management_fee=apartment.management_fee or Decimal('0'),
            apartment_pricing_type=apartment.pricing_type.value,
            apartment_current_occupants=future_occupants,
            apartment_utilities_included=apartment.utilities_included,
            apartment_parking_included=apartment.parking_included,
            apartment_parking_fee=apartment.parking_fee or Decimal('0'),
            move_in_date=data.move_in_date,
            custom_monthly_rate=None
        )

        monthly_charge = costs["monthly_costs"]["total_monthly"]
        deposit_amount = costs["initial_costs"]["deposit"]

    # 7. Crear la asignación
    assignment = ApartmentAssignment(
        apartment_id=data.apartment_id,
        employee_id=data.employee_id,
        move_in_date=data.move_in_date,
        move_out_date=data.move_out_date,
        monthly_charge=monthly_charge,
        custom_monthly_rate=data.custom_monthly_rate,
        deposit_paid=data.deposit_paid if data.deposit_paid else deposit_amount if not data.custom_monthly_rate else Decimal('0'),
        is_current=True,
        notes=data.notes
    )

    db.add(assignment)

    # 8. Actualizar el apartamento
    apartment.current_occupants = future_occupants
    if apartment.current_occupants >= apartment.capacity:
        apartment.status = ApartmentStatus.OCCUPIED

    # 9. Actualizar el empleado
    employee.apartment_id = data.apartment_id

    # 10. Commit
    db.commit()
    db.refresh(assignment)

    return assignment


@router.put("/{assignment_id}", response_model=AssignmentResponse)
async def update_assignment(
    assignment_id: UUID,
    data: AssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Actualizar una asignación existente.
    Principalmente usado para:
    - Establecer fecha de salida (move_out_date)
    - Actualizar el precio personalizado (custom_monthly_rate)
    - Marcar como no actual (is_current = False)
    """
    assignment = db.query(ApartmentAssignment).filter(
        ApartmentAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    # Actualizar campos
    if data.move_out_date is not None:
        assignment.move_out_date = data.move_out_date

        # Si se establece fecha de salida, marcar como no actual
        if assignment.is_current:
            assignment.is_current = False

            # Liberar el apartamento
            apartment = db.query(Apartment).filter(Apartment.id == assignment.apartment_id).first()
            if apartment:
                apartment.current_occupants = max(0, apartment.current_occupants - 1)
                if apartment.current_occupants < apartment.capacity:
                    apartment.status = ApartmentStatus.AVAILABLE

            # Actualizar el empleado
            employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
            if employee and employee.apartment_id == assignment.apartment_id:
                employee.apartment_id = None

    if data.monthly_charge is not None:
        assignment.monthly_charge = data.monthly_charge

    if data.custom_monthly_rate is not None:
        assignment.custom_monthly_rate = data.custom_monthly_rate

        # Recalcular monthly_charge basado en el nuevo custom rate
        apartment = db.query(Apartment).filter(Apartment.id == assignment.apartment_id).first()
        if apartment:
            costs = calculate_assignment_costs(
                apartment_monthly_rent=apartment.monthly_rent or Decimal('0'),
                apartment_deposit=apartment.deposit or Decimal('0'),
                apartment_key_money=apartment.key_money or Decimal('0'),
                apartment_management_fee=apartment.management_fee or Decimal('0'),
                apartment_pricing_type=apartment.pricing_type.value,
                apartment_current_occupants=apartment.current_occupants,
                apartment_utilities_included=apartment.utilities_included,
                apartment_parking_included=apartment.parking_included,
                apartment_parking_fee=apartment.parking_fee or Decimal('0'),
                move_in_date=assignment.move_in_date,
                custom_monthly_rate=data.custom_monthly_rate
            )
            assignment.monthly_charge = costs["monthly_costs"]["total_monthly"]

    if data.notes is not None:
        assignment.notes = data.notes

    if data.is_current is not None:
        assignment.is_current = data.is_current

    db.commit()
    db.refresh(assignment)

    return assignment


@router.delete("/{assignment_id}")
async def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar una asignación.
    IMPORTANTE: Esto también libera el apartamento y actualiza el empleado.
    """
    assignment = db.query(ApartmentAssignment).filter(
        ApartmentAssignment.id == assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    # Si es la asignación actual, liberar el apartamento
    if assignment.is_current:
        apartment = db.query(Apartment).filter(Apartment.id == assignment.apartment_id).first()
        if apartment:
            apartment.current_occupants = max(0, apartment.current_occupants - 1)
            if apartment.current_occupants < apartment.capacity:
                apartment.status = ApartmentStatus.AVAILABLE

        employee = db.query(Employee).filter(Employee.id == assignment.employee_id).first()
        if employee and employee.apartment_id == assignment.apartment_id:
            employee.apartment_id = None

    db.delete(assignment)
    db.commit()

    return {"message": "Asignación eliminada", "id": str(assignment_id)}
