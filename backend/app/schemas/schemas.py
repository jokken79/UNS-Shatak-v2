"""
Pydantic Schemas
UNS-Shatak (社宅管理システム)
"""

from datetime import date, datetime
from typing import Optional, List, Any
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field
from decimal import Decimal
from enum import Enum


# ===========================================
# Enums
# ===========================================

class ApartmentStatusEnum(str, Enum):
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    MAINTENANCE = "maintenance"
    RESERVED = "reserved"


class EmployeeStatusEnum(str, Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    PENDING = "pending"


class ContractTypeEnum(str, Enum):
    DISPATCH = "dispatch"
    CONTRACT = "contract"
    PERMANENT = "permanent"
    PART_TIME = "part_time"


class PricingTypeEnum(str, Enum):
    """Tipo de cálculo de precio del apartamento"""
    SHARED = "shared"  # Precio compartido (dividido entre ocupantes)
    FIXED = "fixed"    # Precio fijo por persona


class VisitorTypeEnum(str, Enum):
    """Tipo de visitante"""
    FAMILY = "family"
    FRIEND = "friend"
    BUSINESS = "business"
    MAINTENANCE = "maintenance"
    INSPECTION = "inspection"
    DELIVERY = "delivery"
    OTHER = "other"


# ===========================================
# Auth Schemas
# ===========================================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    id: UUID
    role: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


# ===========================================
# Factory Schemas (派遣先)
# ===========================================

class FactoryBase(BaseModel):
    factory_code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=100)
    name_japanese: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=50)
    prefecture: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None


class FactoryCreate(FactoryBase):
    pass


class FactoryUpdate(BaseModel):
    factory_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    name_japanese: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=50)
    prefecture: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)
    contact_person: Optional[str] = Field(None, max_length=100)
    contact_email: Optional[EmailStr] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class FactoryResponse(FactoryBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    employee_count: Optional[int] = 0
    
    class Config:
        from_attributes = True


# ===========================================
# Apartment Schemas (社宅)
# ===========================================

class ApartmentBase(BaseModel):
    apartment_code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=100)
    address: str = Field(..., max_length=255)
    city: Optional[str] = Field(None, max_length=50)
    prefecture: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=10)
    building_name: Optional[str] = Field(None, max_length=100)
    room_number: Optional[str] = Field(None, max_length=20)
    floor: Optional[int] = None
    area_sqm: Optional[Decimal] = None
    num_rooms: Optional[int] = 1
    monthly_rent: Optional[Decimal] = None
    deposit: Optional[Decimal] = None
    key_money: Optional[Decimal] = None
    management_fee: Optional[Decimal] = None
    utilities_included: Optional[bool] = False
    internet_included: Optional[bool] = False
    parking_included: Optional[bool] = False
    parking_fee: Optional[Decimal] = None
    nearest_station: Optional[str] = Field(None, max_length=100)
    walking_minutes: Optional[int] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    landlord_name: Optional[str] = Field(None, max_length=100)
    landlord_phone: Optional[str] = Field(None, max_length=20)
    landlord_company: Optional[str] = Field(None, max_length=100)
    status: Optional[ApartmentStatusEnum] = ApartmentStatusEnum.AVAILABLE
    capacity: Optional[int] = 1
    pricing_type: Optional[PricingTypeEnum] = PricingTypeEnum.SHARED
    notes: Optional[str] = None
    amenities: Optional[List[str]] = []


class ApartmentCreate(ApartmentBase):
    pass


class ApartmentUpdate(BaseModel):
    apartment_code: Optional[str] = Field(None, max_length=20)
    name: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=50)
    prefecture: Optional[str] = Field(None, max_length=50)
    postal_code: Optional[str] = Field(None, max_length=10)
    building_name: Optional[str] = Field(None, max_length=100)
    room_number: Optional[str] = Field(None, max_length=20)
    floor: Optional[int] = None
    area_sqm: Optional[Decimal] = None
    num_rooms: Optional[int] = None
    monthly_rent: Optional[Decimal] = None
    deposit: Optional[Decimal] = None
    key_money: Optional[Decimal] = None
    management_fee: Optional[Decimal] = None
    utilities_included: Optional[bool] = None
    internet_included: Optional[bool] = None
    parking_included: Optional[bool] = None
    parking_fee: Optional[Decimal] = None
    nearest_station: Optional[str] = Field(None, max_length=100)
    walking_minutes: Optional[int] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    landlord_name: Optional[str] = Field(None, max_length=100)
    landlord_phone: Optional[str] = Field(None, max_length=20)
    landlord_company: Optional[str] = Field(None, max_length=100)
    status: Optional[ApartmentStatusEnum] = None
    capacity: Optional[int] = None
    pricing_type: Optional[PricingTypeEnum] = None
    notes: Optional[str] = None
    amenities: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ApartmentResponse(ApartmentBase):
    id: UUID
    current_occupants: int
    photos: List[str]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ApartmentWithOccupants(ApartmentResponse):
    occupants: List["EmployeeSimple"] = []


# ===========================================
# Employee Schemas (従業員)
# ===========================================

class EmployeeBase(BaseModel):
    employee_code: str = Field(..., max_length=20)
    full_name_roman: str = Field(..., max_length=100)
    full_name_kanji: Optional[str] = Field(None, max_length=100)
    full_name_furigana: Optional[str] = Field(None, max_length=100)
    nationality: Optional[str] = Field(None, max_length=50)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=255)
    visa_type: Optional[str] = Field(None, max_length=50)
    visa_expiry: Optional[date] = None
    zairyu_card_number: Optional[str] = Field(None, max_length=20)
    passport_number: Optional[str] = Field(None, max_length=20)
    passport_expiry: Optional[date] = None
    employment_start_date: Optional[date] = None
    employment_end_date: Optional[date] = None
    contract_type: Optional[ContractTypeEnum] = ContractTypeEnum.DISPATCH
    hourly_rate: Optional[Decimal] = None
    monthly_salary: Optional[Decimal] = None
    bank_name: Optional[str] = Field(None, max_length=100)
    bank_branch: Optional[str] = Field(None, max_length=100)
    bank_account_number: Optional[str] = Field(None, max_length=20)
    bank_account_holder: Optional[str] = Field(None, max_length=100)
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relation: Optional[str] = Field(None, max_length=50)
    factory_id: Optional[UUID] = None
    apartment_id: Optional[UUID] = None
    status: Optional[EmployeeStatusEnum] = EmployeeStatusEnum.ACTIVE
    notes: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    employee_code: Optional[str] = Field(None, max_length=20)
    full_name_roman: Optional[str] = Field(None, max_length=100)
    full_name_kanji: Optional[str] = Field(None, max_length=100)
    full_name_furigana: Optional[str] = Field(None, max_length=100)
    nationality: Optional[str] = Field(None, max_length=50)
    date_of_birth: Optional[date] = None
    gender: Optional[str] = Field(None, max_length=10)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    address: Optional[str] = Field(None, max_length=255)
    visa_type: Optional[str] = Field(None, max_length=50)
    visa_expiry: Optional[date] = None
    zairyu_card_number: Optional[str] = Field(None, max_length=20)
    passport_number: Optional[str] = Field(None, max_length=20)
    passport_expiry: Optional[date] = None
    employment_start_date: Optional[date] = None
    employment_end_date: Optional[date] = None
    contract_type: Optional[ContractTypeEnum] = None
    hourly_rate: Optional[Decimal] = None
    monthly_salary: Optional[Decimal] = None
    bank_name: Optional[str] = Field(None, max_length=100)
    bank_branch: Optional[str] = Field(None, max_length=100)
    bank_account_number: Optional[str] = Field(None, max_length=20)
    bank_account_holder: Optional[str] = Field(None, max_length=100)
    emergency_contact_name: Optional[str] = Field(None, max_length=100)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relation: Optional[str] = Field(None, max_length=50)
    factory_id: Optional[UUID] = None
    apartment_id: Optional[UUID] = None
    status: Optional[EmployeeStatusEnum] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class EmployeeSimple(BaseModel):
    id: UUID
    employee_code: str
    full_name_roman: str
    full_name_kanji: Optional[str] = None
    status: EmployeeStatusEnum
    
    class Config:
        from_attributes = True


class EmployeeResponse(EmployeeBase):
    id: UUID
    photo_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    factory: Optional[FactoryResponse] = None
    apartment: Optional[ApartmentResponse] = None
    
    class Config:
        from_attributes = True


# ===========================================
# Assignment Schemas (入居履歴)
# ===========================================

class AssignmentBase(BaseModel):
    apartment_id: UUID
    employee_id: UUID
    move_in_date: date
    move_out_date: Optional[date] = None
    monthly_charge: Optional[Decimal] = None
    custom_monthly_rate: Optional[Decimal] = None  # Precio personalizado para este empleado
    deposit_paid: Optional[Decimal] = None
    is_recent: Optional[bool] = False
    assigned_color: Optional[str] = "#3B82F6"
    notes: Optional[str] = None


class AssignmentCreate(AssignmentBase):
    pass


class AssignmentUpdate(BaseModel):
    move_out_date: Optional[date] = None
    monthly_charge: Optional[Decimal] = None
    custom_monthly_rate: Optional[Decimal] = None
    is_current: Optional[bool] = None
    is_recent: Optional[bool] = None
    assigned_color: Optional[str] = None
    notes: Optional[str] = None


class AssignmentResponse(AssignmentBase):
    id: UUID
    is_current: bool
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeSimple] = None
    apartment: Optional[ApartmentResponse] = None

    class Config:
        from_attributes = True


# ===========================================
# Import Schemas
# ===========================================

class ImportResult(BaseModel):
    total_rows: int
    successful_rows: int
    failed_rows: int
    errors: List[dict] = []
    imported_ids: List[UUID] = []


class ImportLogResponse(BaseModel):
    id: UUID
    import_type: str
    file_name: Optional[str]
    total_rows: int
    successful_rows: int
    failed_rows: int
    errors: List[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ===========================================
# Dashboard / Stats
# ===========================================

class DashboardStats(BaseModel):
    total_apartments: int
    available_apartments: int
    occupied_apartments: int
    total_employees: int
    active_employees: int
    employees_with_housing: int
    total_factories: int
    active_factories: int
    occupancy_rate: float


# ===========================================
# Visitor Schemas (訪問者)
# ===========================================

class VisitorBase(BaseModel):
    visitor_name: str = Field(..., max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    relationship: Optional[str] = Field(None, max_length=50)
    visitor_type: Optional[VisitorTypeEnum] = VisitorTypeEnum.OTHER
    notes: Optional[str] = None


class VisitorCreate(VisitorBase):
    pass


class VisitorUpdate(BaseModel):
    visitor_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = None
    relationship: Optional[str] = Field(None, max_length=50)
    visitor_type: Optional[VisitorTypeEnum] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None


class VisitorResponse(VisitorBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ===========================================
# Visitor Access Schemas (訪問者アクセス履歴)
# ===========================================

class VisitorAccessBase(BaseModel):
    apartment_id: UUID
    employee_id: UUID
    visitor_id: Optional[UUID] = None
    visitor_name: str = Field(..., max_length=100)
    visitor_type: Optional[VisitorTypeEnum] = VisitorTypeEnum.OTHER
    entry_time: datetime
    exit_time: Optional[datetime] = None
    purpose: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    color_code: Optional[str] = Field(None, max_length=7)


class VisitorAccessCreate(VisitorAccessBase):
    pass


class VisitorAccessUpdate(BaseModel):
    exit_time: Optional[datetime] = None
    purpose: Optional[str] = Field(None, max_length=255)
    notes: Optional[str] = None
    color_code: Optional[str] = Field(None, max_length=7)


class VisitorAccessResponse(VisitorAccessBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    visitor: Optional[VisitorResponse] = None
    employee: Optional[EmployeeSimple] = None

    class Config:
        from_attributes = True


# Update forward references
ApartmentWithOccupants.model_rebuild()
