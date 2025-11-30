# 📦 Guía de Migración de Datos BASEDATEJP

Esta guía te ayudará a importar los datos desde `BASEDATEJP/` a la base de datos PostgreSQL de UNS-Shatak v2.

## 📊 Datos que se Migrarán

- **39 Fábricas** (派遣先) desde `factories_index.json`
- **256 Apartamentos** (社宅) desde `apartments.json`
- **435 Empleados** (従業員) desde `employees.json`
- **Relaciones**: Empleados ↔ Apartamentos, Empleados ↔ Fábricas

---

## 🚀 Método 1: Migración con Docker (Recomendado)

### Paso 1: Asegúrate que los servicios estén corriendo

```bash
docker compose up -d
```

### Paso 2: Ejecutar en modo DRY RUN (sin guardar)

Primero, prueba la migración sin guardar cambios:

```bash
docker compose exec backend python scripts/migrate_basedatejp.py --dry-run
```

Esto te mostrará:
- ✅ Cuántos registros se procesarán
- ⚠️ Errores potenciales
- 📊 Resumen de la migración

### Paso 3: Ejecutar migración REAL

Si todo se ve bien, ejecuta la migración real:

```bash
docker compose exec backend python scripts/migrate_basedatejp.py --production
```

⚠️ **Importante**: Se te pedirá confirmación antes de guardar.

---

## 🛠️ Método 2: Migración Local (Sin Docker)

Si tienes Python y PostgreSQL instalados localmente:

### Requisitos

```bash
cd backend
pip install -r requirements.txt
```

### Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://shatak_admin:shatak_secret_2024@localhost:5433/uns_shatak
```

### Ejecutar migración

```bash
# Dry run
python backend/scripts/migrate_basedatejp.py --dry-run

# Producción
python backend/scripts/migrate_basedatejp.py --production
```

---

## 📋 Qué hace el Script

### 1. **Migración de Fábricas**
- Lee `BASEDATEJP/factories_index.json`
- Genera códigos únicos: `FAC0001`, `FAC0002`, etc.
- Extrae prefectura y ciudad de las direcciones
- Guarda nombre en japonés y romanizado

### 2. **Migración de Apartamentos**
- Lee `BASEDATEJP/apartments.json`
- Usa los `apartment_code` originales (APT0008, APT0011, etc.)
- Determina `status` basado en ocupantes:
  - `occupied` si tiene empleados
  - `available` si está vacío
- Mantiene `capacity` y `current_occupants`

### 3. **Migración de Empleados**
- Lee `BASEDATEJP/employees.json`
- Usa los `employee_code` originales (EMP200901, etc.)
- Asigna a fábricas basado en `factory_name`
- Asigna a apartamentos basado en `apartment_code`
- Crea registros de `ApartmentAssignment` con fechas de entrada/salida
- Respeta el `status` (active/terminated)

---

## 🔍 Verificar la Migración

### Opción 1: Usar Adminer (Interfaz Web)

1. Ir a http://localhost:8180
2. Login:
   - Sistema: PostgreSQL
   - Servidor: db
   - Usuario: shatak_admin
   - Contraseña: shatak_secret_2024
   - Base de datos: uns_shatak

3. Verificar tablas:
   - `factories` - Debe tener ~39 registros
   - `apartments` - Debe tener ~256 registros
   - `employees` - Debe tener ~435 registros
   - `apartment_assignments` - Registros de asignaciones

### Opción 2: Usar psql (Terminal)

```bash
docker compose exec db psql -U shatak_admin -d uns_shatak

-- Contar registros
SELECT COUNT(*) FROM factories;
SELECT COUNT(*) FROM apartments;
SELECT COUNT(*) FROM employees;
SELECT COUNT(*) FROM apartment_assignments;

-- Ver empleados con apartamento
SELECT
  e.employee_code,
  e.full_name_roman,
  a.apartment_code,
  a.name
FROM employees e
LEFT JOIN apartments a ON e.apartment_id = a.id
LIMIT 10;
```

### Opción 3: Usar el Frontend

1. Ir a http://localhost:3100
2. Login: admin / admin123
3. Verificar:
   - Dashboard debe mostrar las estadísticas actualizadas
   - `/dashboard/factories` - Lista de 39 fábricas
   - `/dashboard/apartments` - Lista de 256 apartamentos
   - `/dashboard/employees` - Lista de 435 empleados

---

## 🐛 Solución de Problemas

### Error: "File does not exist"

Asegúrate que los archivos JSON estén en `BASEDATEJP/`:
```bash
ls -la BASEDATEJP/
# Debe mostrar: employees.json, apartments.json, factories_index.json
```

### Error: "Database connection failed"

Verifica que PostgreSQL esté corriendo:
```bash
docker compose ps
# El servicio 'db' debe estar 'healthy'
```

### Error: "Duplicate key violation"

Algunos datos ya existen. Puedes:
1. Limpiar la base de datos:
```bash
docker compose down -v
docker compose up -d
# Esperar ~30 segundos para inicialización
```

2. O ejecutar el script que saltará duplicados automáticamente

### Ver logs del backend

```bash
docker compose logs -f backend
```

---

## 🔄 Re-ejecutar la Migración

Si necesitas ejecutar la migración nuevamente:

### Opción 1: Limpiar y empezar de nuevo
```bash
# Detener y eliminar volúmenes (BORRA TODO)
docker compose down -v

# Iniciar de nuevo
docker compose up -d

# Esperar ~30 segundos

# Ejecutar migración
docker compose exec backend python scripts/migrate_basedatejp.py --production
```

### Opción 2: Solo eliminar datos migrados

```bash
docker compose exec db psql -U shatak_admin -d uns_shatak

-- Eliminar datos (mantiene estructura)
DELETE FROM apartment_assignments;
DELETE FROM employees WHERE employee_code LIKE 'EMP%';
DELETE FROM apartments WHERE apartment_code LIKE 'APT%';
DELETE FROM factories WHERE factory_code LIKE 'FAC%';
```

---

## 📊 Estadísticas Esperadas Después de la Migración

Después de una migración exitosa deberías ver:

**Dashboard:**
- Total Apartments: ~256
- Total Employees: ~435
- Total Factories: ~39
- Occupancy Rate: ~85% (396 empleados con apartamento de 435)

**Distribución:**
- Empleados con vivienda: ~396
- Empleados sin vivienda: ~39
- Apartamentos ocupados: ~256
- Apartamentos disponibles: 0 (todos tienen al menos 1 empleado)

---

## 💡 Tips

1. **Siempre ejecuta --dry-run primero** para ver qué se va a importar
2. **Verifica los logs** para detectar errores o advertencias
3. **Usa Adminer** para inspeccionar los datos importados
4. **Haz backup** si tienes datos importantes antes de migrar

---

## 📞 Soporte

Si tienes problemas con la migración:
1. Revisa los logs: `docker compose logs backend`
2. Verifica que los archivos JSON existan en `BASEDATEJP/`
3. Asegúrate que PostgreSQL esté corriendo correctamente
