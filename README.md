# UNS-Shatak 社宅管理システム

Sistema de Gestión de Apartamentos para Empresas de Staffing Japonesas

## 🏠 Características

- **Gestión de Apartamentos (社宅)** - CRUD completo, asignación de empleados
- **Gestión de Empleados (従業員)** - Control de trabajadores con/sin vivienda
- **Gestión de Fábricas (派遣先)** - Empresas cliente
- **Importación Masiva** - Excel/CSV para empleados y fábricas
- **Dashboard** - Estadísticas en tiempo real

## 🚀 Inicio Rápido

### Requisitos
- Docker Desktop
- Git

### Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/jokken79/UNS-Shatak.git
cd UNS-Shatak

# 2. Iniciar servicios
docker compose up -d

# 3. Esperar ~30 segundos y acceder
```

### URLs

| Servicio | URL | Credenciales |
|----------|-----|--------------|
| Frontend | http://localhost:3100 | admin / admin123 |
| API Docs | http://localhost:8100/api/docs | - |
| Adminer | http://localhost:8180 | shatak_admin / shatak_secret_2024 |

## 📁 Estructura

```
UNS-Shatak/
├── backend/                 # FastAPI
│   ├── app/
│   │   ├── api/            # Endpoints
│   │   ├── core/           # Config, security
│   │   ├── models/         # SQLAlchemy
│   │   └── schemas/        # Pydantic
│   └── scripts/            # DB init
├── frontend/               # Next.js 14
│   ├── app/
│   │   ├── dashboard/      # Main pages
│   │   └── login/          # Auth
│   └── components/         # UI components
├── config/                 # Sample CSV files
│   ├── factories_sample.csv
│   └── employees_sample.csv
├── scripts/                # Windows batch
│   ├── START.bat
│   └── STOP.bat
└── docker-compose.yml
```

## 📊 Importación de Datos

### Fábricas (派遣先)
Columnas requeridas:
- `factory_code` - Código único (ej: FAC001)
- `name` - Nombre en inglés

Columnas opcionales:
- `name_japanese`, `address`, `city`, `prefecture`, `postal_code`, `phone`, `contact_person`, `contact_email`, `notes`

### Empleados (従業員)
Columnas requeridas:
- `employee_code` - Código único (ej: EMP001)
- `full_name_roman` - Nombre en romaji

Columnas opcionales:
- `full_name_kanji`, `nationality`, `date_of_birth`, `gender`, `phone`, `email`, `visa_type`, `visa_expiry`, `employment_start_date`, `contract_type`, `hourly_rate`, `factory_code`, `notes`

## 🔧 Stack Tecnológico

### Backend
- FastAPI 0.115.6
- SQLAlchemy 2.0
- PostgreSQL 15
- Redis 7

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Shadcn/ui

## 📝 API Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/apartments/ | Listar apartamentos |
| POST | /api/apartments/ | Crear apartamento |
| POST | /api/apartments/{id}/assign/{emp_id} | Asignar empleado |
| GET | /api/employees/ | Listar empleados |
| GET | /api/employees/without-apartment | Sin vivienda |
| GET | /api/factories/ | Listar fábricas |
| POST | /api/import/factories | Importar fábricas |
| POST | /api/import/employees | Importar empleados |
| GET | /api/dashboard/stats | Estadísticas |

## 🐳 Docker Commands

```bash
# Iniciar
docker compose up -d

# Ver logs
docker compose logs -f

# Detener
docker compose down

# Reiniciar
docker compose restart

# Rebuild
docker compose up -d --build
```

## 📄 Licencia

MIT License

---

Desarrollado para UNS Kikaku (ユニバーサル企画株式会社)
