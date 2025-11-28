"""
SQLAlchemy Models
UNS-Shatak (社宅管理システム)
"""

import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, Date, 
    ForeignKey, Text, Numeric, Enum as SQLEnum, JSON
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base


# ===========================================
# Enums
# ===========================================

class ApartmentStatus(str, enum.Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    PENDING = "pending"


class ContractType(str, enum.Enum):
    DISPATCH = "dispatch"
    CONTRACT = "contract"
    PERMANENT = "permanent"
    PART_TIME = "part_time"


# ===========================================
# Models
# ===========================================

class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), unique=True, nullable=False, index=True)
    email = Column(String(100), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100))
    role = Column(String(20), default="user")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class Factory(Base):
    """Factory model (派遣先)"""
    __tablename__ = "factories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    factory_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    name_japanese = Column(String(100))
    address = Column(String(255))
    city = Column(String(50))
    prefecture = Column(String(50))
    postal_code = Column(String(10))
    phone = Column(String(20))
    contact_person = Column(String(100))
    contact_email = Column(String(100))
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = relationship("Employee", back_populates="factory")


class Apartment(Base):
    """Apartment model (社宅)"""
    __tablename__ = "apartments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_code = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    city = Column(String(50))
    prefecture = Column(String(50))
    postal_code = Column(String(10))
    building_name = Column(String(100))
    room_number = Column(String(20))
    floor = Column(Integer)
    area_sqm = Column(Numeric(8, 2))
    num_rooms = Column(Integer, default=1)
    monthly_rent = Column(Numeric(10, 2))
    deposit = Column(Numeric(10, 2))
    key_money = Column(Numeric(10, 2))
    management_fee = Column(Numeric(10, 2))
    utilities_included = Column(Boolean, default=False)
    internet_included = Column(Boolean, default=False)
    parking_included = Column(Boolean, default=False)
    parking_fee = Column(Numeric(10, 2))
    nearest_station = Column(String(100))
    walking_minutes = Column(Integer)
    contract_start_date = Column(Date)
    contract_end_date = Column(Date)
    landlord_name = Column(String(100))
    landlord_phone = Column(String(20))
    landlord_company = Column(String(100))
    status = Column(SQLEnum(ApartmentStatus), default=ApartmentStatus.AVAILABLE)
    capacity = Column(Integer, default=1)
    current_occupants = Column(Integer, default=0)
    notes = Column(Text)
    photos = Column(JSONB, default=list)
    amenities = Column(JSONB, default=list)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    employees = relationship("Employee", back_populates="apartment")
    assignments = relationship("ApartmentAssignment", back_populates="apartment")


class Employee(Base):
    """Employee model (従業員)"""
    __tablename__ = "employees"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_code = Column(String(20), unique=True, nullable=False, index=True)
    full_name_roman = Column(String(100), nullable=False)
    full_name_kanji = Column(String(100))
    full_name_furigana = Column(String(100))
    nationality = Column(String(50))
    date_of_birth = Column(Date)
    gender = Column(String(10))
    phone = Column(String(20))
    email = Column(String(100))
    address = Column(String(255))
    visa_type = Column(String(50))
    visa_expiry = Column(Date)
    zairyu_card_number = Column(String(20))
    passport_number = Column(String(20))
    passport_expiry = Column(Date)
    employment_start_date = Column(Date)
    employment_end_date = Column(Date)
    contract_type = Column(SQLEnum(ContractType), default=ContractType.DISPATCH)
    hourly_rate = Column(Numeric(10, 2))
    monthly_salary = Column(Numeric(12, 2))
    bank_name = Column(String(100))
    bank_branch = Column(String(100))
    bank_account_number = Column(String(20))
    bank_account_holder = Column(String(100))
    emergency_contact_name = Column(String(100))
    emergency_contact_phone = Column(String(20))
    emergency_contact_relation = Column(String(50))
    factory_id = Column(UUID(as_uuid=True), ForeignKey("factories.id", ondelete="SET NULL"))
    apartment_id = Column(UUID(as_uuid=True), ForeignKey("apartments.id", ondelete="SET NULL"))
    status = Column(SQLEnum(EmployeeStatus), default=EmployeeStatus.ACTIVE)
    photo_url = Column(String(255))
    notes = Column(Text)
    metadata = Column(JSONB, default=dict)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    factory = relationship("Factory", back_populates="employees")
    apartment = relationship("Apartment", back_populates="employees")
    assignments = relationship("ApartmentAssignment", back_populates="employee")


class ApartmentAssignment(Base):
    """Apartment assignment history (入居履歴)"""
    __tablename__ = "apartment_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    apartment_id = Column(UUID(as_uuid=True), ForeignKey("apartments.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    move_in_date = Column(Date, nullable=False)
    move_out_date = Column(Date)
    monthly_charge = Column(Numeric(10, 2))
    deposit_paid = Column(Numeric(10, 2))
    is_current = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    apartment = relationship("Apartment", back_populates="assignments")
    employee = relationship("Employee", back_populates="assignments")


class ImportLog(Base):
    """Import log (インポート履歴)"""
    __tablename__ = "import_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    import_type = Column(String(50), nullable=False)
    file_name = Column(String(255))
    total_rows = Column(Integer)
    successful_rows = Column(Integer)
    failed_rows = Column(Integer)
    errors = Column(JSONB, default=list)
    imported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)


class AuditLog(Base):
    """Audit log"""
    __tablename__ = "audit_log"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    table_name = Column(String(50), nullable=False)
    record_id = Column(UUID(as_uuid=True))
    action = Column(String(20), nullable=False)
    old_data = Column(JSONB)
    new_data = Column(JSONB)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    ip_address = Column(String(45))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
