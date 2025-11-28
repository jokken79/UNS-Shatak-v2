"""API module"""
from app.api.auth import router as auth_router
from app.api.apartments import router as apartments_router
from app.api.employees import router as employees_router
from app.api.factories import router as factories_router
from app.api.imports import router as imports_router

__all__ = [
    "auth_router",
    "apartments_router",
    "employees_router",
    "factories_router",
    "imports_router"
]
