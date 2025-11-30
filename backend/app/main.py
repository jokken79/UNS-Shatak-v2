"""
UNS-Shatak (社宅管理システム) - Apartment Management System
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger
from app.core.config import settings
from app.api import auth_router, apartments_router, employees_router, factories_router, imports_router, data_router, assignments_router, visitors_router, export_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"🚀 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    logger.info(f"👋 Shutting down {settings.APP_NAME}")


app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(apartments_router, prefix="/api")
app.include_router(employees_router, prefix="/api")
app.include_router(factories_router, prefix="/api")
app.include_router(imports_router, prefix="/api")
app.include_router(data_router, prefix="/api")
app.include_router(assignments_router, prefix="/api")
app.include_router(visitors_router, prefix="/api")
app.include_router(export_router, prefix="/api")


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "version": settings.APP_VERSION, "docs": "/api/docs"}


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}


@app.get("/api/dashboard/stats")
async def dashboard_stats():
    from app.core.database import SessionLocal
    from app.models.models import Apartment, Employee, Factory, ApartmentStatus, EmployeeStatus
    from sqlalchemy import func
    
    db = SessionLocal()
    try:
        total_apt = db.query(func.count(Apartment.id)).filter(Apartment.is_active == True).scalar()
        avail_apt = db.query(func.count(Apartment.id)).filter(Apartment.is_active == True, Apartment.status == ApartmentStatus.AVAILABLE).scalar()
        occup_apt = db.query(func.count(Apartment.id)).filter(Apartment.is_active == True, Apartment.status == ApartmentStatus.OCCUPIED).scalar()
        total_emp = db.query(func.count(Employee.id)).filter(Employee.is_active == True).scalar()
        active_emp = db.query(func.count(Employee.id)).filter(Employee.is_active == True, Employee.status == EmployeeStatus.ACTIVE).scalar()
        emp_housed = db.query(func.count(Employee.id)).filter(Employee.is_active == True, Employee.apartment_id.isnot(None)).scalar()
        total_fac = db.query(func.count(Factory.id)).filter(Factory.is_active == True).scalar()
        capacity = db.query(func.sum(Apartment.capacity)).filter(Apartment.is_active == True).scalar() or 0
        occupants = db.query(func.sum(Apartment.current_occupants)).filter(Apartment.is_active == True).scalar() or 0
        rate = round((occupants / capacity * 100) if capacity > 0 else 0, 2)
        
        return {
            "total_apartments": total_apt, "available_apartments": avail_apt, "occupied_apartments": occup_apt,
            "total_employees": total_emp, "active_employees": active_emp, "employees_with_housing": emp_housed,
            "employees_without_housing": active_emp - emp_housed, "total_factories": total_fac, "occupancy_rate": rate
        }
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
