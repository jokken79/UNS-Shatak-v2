# 🔐 Guía de Seguridad - UNS-Shatak v2

## ⚠️ ESTADO ACTUAL: NO APTO PARA PRODUCCIÓN

Esta aplicación tiene **22 vulnerabilidades/bugs** identificados que DEBEN ser corregidos antes de cualquier despliegue en producción.

---

## 🔴 VULNERABILIDADES CRÍTICAS (5)

### 1. Credenciales Hardcoded en el Código
**Ubicación:** `backend/app/core/config.py:22,28`

❌ **Código Inseguro:**
```python
DATABASE_URL: str = "postgresql://shatak_admin:shatak_secret_2024@localhost:5433/uns_shatak"
SECRET_KEY: str = "uns-shatak-secret-key-change-in-production-2024"
```

✅ **Solución:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY = os.getenv("SECRET_KEY")

if not DATABASE_URL or not SECRET_KEY:
    raise ValueError("DATABASE_URL y SECRET_KEY deben estar en variables de entorno")
```

**Archivo `.env` (nunca comprometer):**
```
DATABASE_URL=postgresql://usuario:contrasena@localhost:5432/db_production
SECRET_KEY=una-clave-muy-larga-y-aleatoria-de-al-menos-32-caracteres
```

**Pasos:**
1. Rotar credenciales de base de datos
2. Generar nuevo SECRET_KEY con `secrets.token_urlsafe(32)`
3. Usar python-dotenv para cargar variables

---

### 2. Endpoint de Registro SIN Protección
**Ubicación:** `backend/app/api/auth.py:88-121`

❌ **Código Inseguro:**
```python
@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user (admin only in production)"""
    # Cualquiera puede crear usuarios!
```

✅ **Solución:**
```python
@router.post("/register", response_model=UserResponse)
async def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)  # ← AGREGAR
):
    """Register a new user (admin only)"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acceso denegado")
```

**Pasos:**
1. Crear función `get_current_admin_user`
2. Verificar que el usuario sea admin
3. Registrar en audit log

---

### 3. Eliminación Masiva de Datos SIN Validación
**Ubicación:** `backend/app/api/data.py:255-280`

❌ **Código Inseguro:**
```python
@router.delete("/tables/{table_name}/records")
async def delete_all_records(table_name: str, confirm: bool = Query(False)):
    # Cualquier usuario autenticado puede borrar TODA la tabla
    db.query(get_model(table_name)).delete()
```

✅ **Solución:**
```python
@router.delete("/tables/{table_name}/records")
async def delete_all_records(
    table_name: str,
    confirm: bool = Query(False),
    current_user: User = Depends(get_current_admin_user)  # ← AGREGAR
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    # Log de auditoría
    audit_log = AuditLog(
        table_name=table_name,
        action="DELETE_ALL",
        user_id=current_user.id,
        new_data={"confirm": confirm}
    )
    db.add(audit_log)
    db.commit()
```

---

### 4. Potencial SQL Injection en Búsquedas
**Ubicación:** `backend/app/api/apartments.py:43-56`

❌ **Código Inseguro:**
```python
if search:
    query = query.filter(
        or_(
            Apartment.name.ilike(f"%{search}%"),  # ← Potencial inyección
        )
    )
```

✅ **Solución:**
```python
if search:
    # Validar input
    if len(search) > 100:
        raise HTTPException(status_code=400, detail="Búsqueda muy larga")

    # SQLAlchemy escapa automáticamente, pero ser explícito
    safe_search = f"%{search}%"
    query = query.filter(Apartment.name.ilike(safe_search))
```

---

### 5. Tokens JWT en localStorage (XSS Vulnerability)
**Ubicación:** `frontend/lib/api.ts:12,22`

❌ **Código Inseguro:**
```typescript
const token = localStorage.getItem('token');  // ← Accesible a XSS
```

✅ **Solución:**

**Opción A: Cookies httpOnly (RECOMENDADO)**
```typescript
// Backend
from fastapi.responses import Response

@router.post("/login")
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(credentials.username, credentials.password, db)
    token = create_access_token({"sub": user.username})

    response = JSONResponse({"message": "Login successful"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,  # ← No accesible desde JS
        secure=True,    # ← Solo HTTPS en producción
        samesite="strict",  # ← CSRF protection
        max_age=3600
    )
    return response

# Frontend
const response = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',  # ← Incluir cookies
    body: JSON.stringify(credentials)
});
// Token se envía automáticamente en headers
```

**Opción B: SessionStorage con corta expiración**
```typescript
const token = sessionStorage.getItem('token');  // ← Solo en sesión
// Se elimina al cerrar el navegador
```

---

## 🟠 VULNERABILIDADES ALTAS (5)

### 6. Sin Rate Limiting
**Ubicación:** Todos los endpoints

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@router.post("/auth/login")
@limiter.limit("5/minute")  # ← Max 5 intentos por minuto
async def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    pass
```

### 7. datetime.utcnow() Deprecated
```python
from datetime import datetime, timezone

# Reemplazar todos:
datetime.utcnow()  # ❌ Deprecated
datetime.now(timezone.utc)  # ✅ Correcto
```

### 8. Race Condition en Asignaciones
```python
# Use row-level locking
apartment = db.query(Apartment)\
    .with_for_update()\
    .filter(Apartment.id == apartment_id)\
    .first()
```

### 9. Sin Refresh Tokens
```python
# Implementar refresh token rotation
@router.post("/token/refresh")
async def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    # Validar refresh token
    # Generar nuevo access token
    # Invalidar refresh token anterior
    pass
```

### 10. Sin Audit Logging
```python
# Decorator para auditoría
def audit_log(action: str, table: str):
    def decorator(func):
        async def wrapper(*args, **kwargs):
            result = await func(*args, **kwargs)
            log = AuditLog(
                action=action,
                table_name=table,
                user_id=current_user.id,
                new_data=result.__dict__
            )
            db.add(log)
            db.commit()
            return result
        return wrapper
    return decorator
```

---

## 🟡 VULNERABILIDADES MEDIAS (8)

### 11-15. Validación Insuficiente, Missing Headers, Transacciones, useEffect bugs, window.reload()

**Soluciones generales:**
```python
# Usar Pydantic para validación estricta
class CreateApartmentRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=5, max_length=255)
    capacity: int = Field(..., ge=1, le=100)

# Headers de seguridad
from fastapi import FastAPI
from starlette.middleware.headers import RawHeaderMiddleware

app.add_middleware(
    RawHeaderMiddleware,
    raw_headers=[
        ("X-Content-Type-Options", "nosniff"),
        ("X-Frame-Options", "DENY"),
        ("X-XSS-Protection", "1; mode=block"),
        ("Strict-Transport-Security", "max-age=31536000; includeSubDomains"),
    ]
)

# Transacciones explícitas
try:
    # operaciones
    db.commit()
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail="Error en transacción")
```

---

## ✅ Checklist para Producción

- [ ] Mover credenciales a `.env`
- [ ] Rotar SECRET_KEY y contraseñas BD
- [ ] Proteger endpoint `/register` con admin check
- [ ] Agregar autenticación a endpoints de eliminación
- [ ] Implementar rate limiting en login
- [ ] Cambiar tokens a httpOnly cookies
- [ ] Validar todos los inputs con Pydantic
- [ ] Agregar security headers
- [ ] Implementar audit logging en operaciones críticas
- [ ] Actualizar datetime.utcnow() a datetime.now(timezone.utc)
- [ ] Agregar row-level locking en asignaciones
- [ ] Implementar refresh tokens
- [ ] Agregar error boundaries en frontend
- [ ] Validar file size en importaciones
- [ ] Implementar CSRF protection
- [ ] Usar HTTPS obligatorio
- [ ] Configurar CORS correctamente
- [ ] Implementar WAF (Web Application Firewall)
- [ ] Auditoría de dependencias (pip install safety)
- [ ] Tests de seguridad (OWASP ZAP, Burp Suite)

---

## 🔒 Configuración Recomendada para Producción

### .env (ejemplo)
```env
# Database
DATABASE_URL=postgresql://user:strong_password@prod-db.example.com:5432/shatak_prod

# Security
SECRET_KEY=<generar con: secrets.token_urlsafe(32)>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
CORS_ORIGINS=https://app.example.com,https://www.example.com

# Redis
REDIS_URL=redis://prod-redis.example.com:6379

# Email (para alertas)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alerts@example.com
SMTP_PASSWORD=<app_password>

# Environment
ENVIRONMENT=production
DEBUG=false
```

### docker-compose.prod.yml
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: shatak_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - backend

  redis:
    image: redis:7-alpine
    networks:
      - backend

volumes:
  postgres_data:

networks:
  backend:
```

---

## 📊 Herramientas de Auditoría

```bash
# Verificar dependencias vulnerables
pip install safety
safety check

# SAST (Static Application Security Testing)
pip install bandit
bandit -r backend/

# Análisis de código
pip install flake8 pylint
flake8 backend/
pylint backend/

# Tests de seguridad
pip install pytest-security
pytest --security backend/

# Frontend
npm audit
npm audit fix
```

---

## 📞 Reporte de Vulnerabilidades

Si encuentras vulnerabilidades:
1. NO publiques en GitHub
2. Contacta: security@example.com
3. Proporciona: descripción, pasos de reproducción, impacto
4. Espera respuesta en 48 horas

---

**Última actualización:** 2025-11-30
**Estado:** DESARROLLO SOLAMENTE - NO PRODUCCIÓN
