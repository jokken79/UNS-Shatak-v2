# UNS-Shatak v2 - Setup Local

## ⚠️ IMPORTANTE: USO LOCAL SOLAMENTE

Esta aplicación está configurada para **uso local/desarrollo**. **NO está preparada para producción**.

### Seguridad Simplificada

Para facilitar el desarrollo local:
- Las credenciales de base de datos están en `backend/app/core/config.py`
- El SECRET_KEY es un valor de desarrollo
- CORS está abierto para localhost
- Sin rate limiting implementado
- Tokens JWT sin validación estricta

> Si necesitas desplegar a producción, debes implementar las medidas de seguridad documentadas en `SECURITY.md`

---

## 🚀 Quick Start

### 1. Clonar y Instalar

```bash
# Clonar repositorio
git clone https://github.com/jokken79/UNS-Shatak-v2.git
cd UNS-Shatak-v2

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

### 2. Base de Datos (Docker)

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto inicia:
- PostgreSQL en `localhost:5433`
- Redis en `localhost:6379`

### 3. Migrations (si es necesario)

```bash
cd backend
alembic upgrade head
```

### 4. Ejecutar Backend

```bash
cd backend
python -m app.main
# o
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend disponible en: `http://localhost:8000/api/docs`

### 5. Ejecutar Frontend

```bash
cd frontend
npm run dev
```

Frontend disponible en: `http://localhost:3100`

---

## 📋 Nuevas Funcionalidades Implementadas

### 1. Sistema de Seguimiento de Ocupación

**Ubica en:** `/dashboard/occupancy-tracking`

Permite ver:
- ✅ Residentes actuales de cada apartamento
- ✅ **Residentes NUEVOS (últimos 30 días)** destacados con:
  - 🟩 **Color de fondo** (asignado automáticamente)
  - ⭐ **Etiqueta "NUEVO"** en rojo/verde
  - 📅 **Fecha de ingreso** claramente visible
  - 👤 **Nombre, código de empleado e ID**
  - 📊 **Información de fábrica y renta**

### 2. Exportación de Datos (CSV / Excel)

**Ubica en:** `/dashboard/reports` (botón de exportación)

Descarga todos los datos de ocupación en formato:
- ✅ **Excel (.xlsx)** con colores y formato automático
- ✅ **CSV (.csv)** para importar en otras herramientas

**Información incluida:**
- Código de apartamento
- Nombre del apartamento
- Código e ID del empleado ⭐
- Nombre (Romaji y Kanji)
- Email y teléfono
- Fábrica asignada
- Fecha de ingreso/salida
- Estado (Actual/Nuevo)
- Color asignado
- Renta mensual

**Características:**
- Residentes nuevos con fondo verde en Excel
- Exportación de todos los apartamentos o solo uno específico
- Filtrado por mes/año

### 3. Reportes y Análisis de Rotación

**Ubica en:** `/dashboard/reports`

Visualiza:
- 📈 **Gráfico de movimientos mensuales** (ingresos/egresos)
- 📊 **Tendencia de ocupación** por mes
- 💹 **Ocupación promedio** del año
- 🔄 **Movimiento neto** de residentes
- 📋 **Tabla detallada** de todos los meses

Datos estadísticos:
- Total de nuevos residentes (ingresos)
- Total de residentes salientes (egresos)
- Ocupación promedio del año
- Movimiento neto de población
- Tasa de rotación mensual

### 4. Notificaciones de Ocupación

**Ubica en:** Botón de campana (🔔) en la esquina superior

Alertas en tiempo real de:
- 🟢 **Nuevos residentes** que se mudan
- 🔵 **Residentes que se van** del apartamento
- 🟣 **Cambios de ocupación** (apartamento lleno, etc)

Características:
- Contador de notificaciones sin leer
- Historial de cambios recientes
- Marca como leído automáticamente
- Marca todos como leídos de una vez

### 2. Identificación Visual

#### Colores Asignados

Cada residente tiene un color hexadecimal asignado (`assigned_color` en la BD):
- Se usa para **border izquierdo** del card
- Se usa para **fondo semi-transparente**
- Se usa en **indicadores visuales**

#### Iconos de Identificación

- ⭐ **Star icon** = Residente NUEVO (últimos 30 días)
- 👥 **Users icon** = Residentes actuales antiguos
- 📅 **Calendar icon** = Fecha de ingreso

### 3. Estructura de Datos (Backend)

Modelos actualizados en `backend/app/models/models.py`:

```python
class ApartmentAssignment(Base):
    # ... campos existentes ...
    is_recent: bool          # True si entró en últimos 30 días
    assigned_color: str      # Color hex (#RRGGBB) para diferenciación
```

Schemas en `backend/app/schemas/schemas.py`:

```python
class AssignmentResponse(BaseModel):
    # ... campos existentes ...
    is_recent: bool
    assigned_color: str
```

### 4. Componentes Frontend

#### ResidentsList.tsx
```
Ubicación: frontend/components/features/ResidentsList.tsx

Muestra un apartamento con:
- Información del apartamento (código, ocupación%)
- Sección separada: Residentes NUEVOS
- Sección separada: Residentes ACTUALES
- Cada residente con su color y fecha
```

#### OccupancyTracking Page
```
Ubicación: frontend/app/dashboard/occupancy-tracking/page.tsx

Página completa con:
- Estadísticas de ocupación
- Listado de todos los apartamentos
- Filtros (Todos, Ocupados, Disponibles)
- Identificación visual clara de nuevos
```

---

## 📊 Ejemplo de Visualización

```
┌─────────────────────────────────────────────┐
│ APT-001 [Lleno] ████████████░ 100%          │
│ Fábrica: Sony Inc.              4/4 ocupados│
├─────────────────────────────────────────────┤
│ ⭐ RESIDENTES NUEVOS (2)                    │
│                                             │
│ 🟩 Juan García (田中太郎)                    │
│    Ingreso: 2025-11-15                    │
│    [NUEVO]                                 │
│                                             │
│ 🟨 Maria López (鈴木花子)                    │
│    Ingreso: 2025-11-10                    │
│    [NUEVO]                                 │
├─────────────────────────────────────────────┤
│ 👥 RESIDENTES ACTUALES (2)                  │
│                                             │
│ 🔵 Pedro Sánchez (佐藤次郎)                  │
│    Ingreso: 2025-03-20                    │
│                                             │
│ 🟣 Ana Rodríguez (伊藤花美)                  │
│    Ingreso: 2024-12-05                    │
└─────────────────────────────────────────────┘
```

---

## 🔄 Cómo Funciona

### 1. Agregar un Nuevo Residente

Cuando asignas un empleado a un apartamento:

```bash
POST /api/assignments

{
  "apartment_id": "uuid...",
  "employee_id": "uuid...",
  "move_in_date": "2025-11-15",
  "is_recent": true,              # ← Se marca como NUEVO
  "assigned_color": "#FF6B6B"     # ← Color automático
}
```

### 2. Visualización Automática

La página detecta automáticamente:
- Si `move_in_date` está en los últimos 30 días → **Muestra en sección NUEVOS**
- Si `is_recent = true` → **Muestra etiqueta NUEVO**
- Usa `assigned_color` para diferenciación visual

### 3. Al Final del Mes

Cuando se cierra el mes:
- Los residentes nuevos siguen siendo visibles
- El sistema muestra claramente quién entró en ese mes
- El color permite distinguir quién es quién

---

## 🎨 Colores Predeterminados

Si no especificas `assigned_color`, se asigna automáticamente:

```javascript
// En frontend
const RESIDENT_COLORS = [
  '#FF6B6B',  // Rojo
  '#4ECDC4',  // Teal
  '#45B7D1',  // Azul
  '#F7B731',  // Naranja
  '#5F27CD',  // Púrpura
  '#00D2D3',  // Cian
  '#95E1D3'   // Verde claro
];
```

---

## 📋 API Endpoints Relacionados

```bash
# Obtener apartamentos con residentes
GET /api/apartments?limit=500

# Obtener empleados
GET /api/employees?limit=500

# Obtener asignaciones
GET /api/assignments

# Crear asignación (nuevo residente)
POST /api/assignments
{
  "apartment_id": "...",
  "employee_id": "...",
  "move_in_date": "2025-11-15",
  "is_recent": true,
  "assigned_color": "#FF6B6B"
}

# Actualizar asignación
PUT /api/assignments/{id}
{
  "is_recent": false,
  "assigned_color": "#4ECDC4"
}
```

---

## 🧪 Testing Local

### 1. Crear datos de prueba

```python
# backend/scripts/test_data.py
python scripts/test_data.py
```

### 2. Acceder a la página

```
http://localhost:3100/dashboard/occupancy-tracking
```

### 3. Ver apartamentos con residentes

- Los residentes recientes (últimos 30 días) aparecen en verde
- Cada uno tiene su color asignado
- Se muestra claramente cuándo entraron

---

## 📈 Mejoras Futuras

- [ ] Generación de reportes PDF con colores
- [ ] Exportar historial de movimientos
- [ ] Gráficos de rotación de residentes
- [ ] Alertas de cambios (email/notificación)
- [ ] Historial detallado por mes
- [ ] Integración con documentos/contratos

---

## ❌ ADVERTENCIAS DE SEGURIDAD

### Para Producción, Debes:

1. **🔐 Variables de Entorno**
   ```bash
   # NO hagas esto en producción
   DATABASE_URL="postgresql://user:password@localhost/db"
   SECRET_KEY="unsecure-key-change-in-production"

   # Usa esto
   # Archivo .env con variables protegidas
   ```

2. **🛡️ Autenticación**
   - Implementar 2FA
   - Usar OAuth2 con PKCE
   - Validar tokens correctamente

3. **🚫 Endpoints Protegidos**
   - Agregar autenticación a todos los endpoints
   - Implementar roles y permisos
   - Validar cada request

4. **📊 Auditoría**
   - Implementar audit logging
   - Registrar cambios de residentes
   - Mantener historial completo

5. **🔒 Base de Datos**
   - Usar credenciales fuertes
   - Encriptar datos sensibles
   - Backups regulares

6. **📡 Comunicaciones**
   - Usar HTTPS siempre
   - Implementar CSRF protection
   - Validar CORS correctamente

Ver `SECURITY.md` para detalles completos.

---

## 📞 Soporte

- 📧 Email: tu@email.com
- 🐛 Issues: GitHub Issues
- 💬 Discussions: GitHub Discussions

---

## 📄 Licencia

[Tu licencia aquí]

---

**Última actualización:** 2025-11-30
**Versión:** 2.0.0 (Local Development)
