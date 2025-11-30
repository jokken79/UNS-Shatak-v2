# Implementación de Sistema de Precios y Cálculo Proporcional

## 📋 Resumen

Este documento describe la implementación completa del sistema de pricing flexible y cálculo proporcional de renta para UNS-Shatak v2.

## ✅ Características Implementadas

### 1. Tipos de Pricing de Apartamentos

El sistema ahora soporta dos tipos de cálculo de precio:

- **SHARED (Compartido)**: El precio total del apartamento se divide entre todos los ocupantes
  - Ejemplo: Apartamento de ¥60,000 con 4 ocupantes = ¥15,000 por persona
  - Si un ocupante se va, el precio por persona aumenta: ¥60,000 ÷ 3 = ¥20,000

- **FIXED (Precio Fijo)**: Cada persona paga un precio fijo sin importar cuántos ocupantes haya
  - Ejemplo: Cada persona paga ¥15,000, sin importar si hay 1, 2, 3 o 4 ocupantes

### 2. Cálculo Proporcional (Pro-rated Rent / 日割り計算)

Cuando un empleado se muda en cualquier día que no sea el 1 del mes:

```
Ejemplo:
- Renta mensual: ¥60,000
- Fecha de entrada: 15 de marzo (mes de 31 días)
- Días ocupados: 17 días (del 15 al 31, inclusive)
- Renta prorrateada: ¥60,000 × (17/31) = ¥32,903
```

### 3. Precio Personalizado por Empleado

Los administradores pueden establecer un precio personalizado para cualquier empleado, sobrescribiendo el cálculo automático.

---

## 🗄️ Cambios en la Base de Datos

### Nuevos Campos

#### Tabla `apartments`
```sql
pricing_type ENUM('shared', 'fixed') NOT NULL DEFAULT 'shared'
```

#### Tabla `apartment_assignments`
```sql
custom_monthly_rate NUMERIC(10, 2) NULL
```

### Migración

Ejecutar la migración SQL:

```bash
cd backend/migrations
chmod +x run_migration.sh
./run_migration.sh
```

O manualmente:
```bash
docker exec -i <container_name> psql -U postgres -d shatak_db < 001_add_pricing_fields.sql
```

---

## 🔧 Backend - Cambios Implementados

### 1. Modelos (`backend/app/models/models.py`)

**Nuevo Enum:**
```python
class PricingType(str, enum.Enum):
    SHARED = "shared"  # Precio compartido
    FIXED = "fixed"    # Precio fijo por persona
```

**Apartment Model:**
- Agregado campo `pricing_type`

**ApartmentAssignment Model:**
- Agregado campo `custom_monthly_rate`

### 2. Schemas (`backend/app/schemas/schemas.py`)

**Nuevo Enum:**
```python
class PricingTypeEnum(str, Enum):
    SHARED = "shared"
    FIXED = "fixed"
```

**ApartmentBase:**
- Agregado `pricing_type: Optional[PricingTypeEnum]`

**AssignmentBase:**
- Agregado `custom_monthly_rate: Optional[Decimal]`

### 3. Calculadora de Renta (`backend/app/utils/rent_calculator.py`)

Nuevas funciones utilities:

- `calculate_prorated_rent()` - Cálculo proporcional basado en días
- `calculate_shared_rent()` - Cálculo según tipo (shared/fixed)
- `calculate_total_monthly_cost()` - Costo total mensual
- `calculate_initial_costs()` - Costos iniciales (depósito + key money)
- `calculate_assignment_costs()` - Función principal que combina todos los cálculos

### 4. API de Asignaciones (`backend/app/api/assignments.py`)

Nuevos endpoints:

```
GET    /api/assignments                  - Listar asignaciones
GET    /api/assignments/{id}             - Obtener asignación
POST   /api/assignments                  - Crear asignación
PUT    /api/assignments/{id}             - Actualizar asignación
DELETE /api/assignments/{id}             - Eliminar asignación
POST   /api/assignments/calculate        - Calcular precio (preview)
```

**Endpoint `/api/assignments/calculate`:**

Request:
```json
{
  "apartment_id": "uuid",
  "employee_id": "uuid",
  "move_in_date": "2025-03-15",
  "custom_monthly_rate": 15000  // opcional
}
```

Response:
```json
{
  "apartment": {...},
  "employee": {...},
  "costs": {
    "pricing_type": "shared",
    "is_custom_rate": false,
    "base_rent_per_person": 15000,
    "monthly_costs": {
      "base_rent": 15000,
      "management_fee": 2500,
      "utilities": 8000,
      "parking": 0,
      "total_monthly": 25500
    },
    "prorated_first_month": {
      "full_month_rent": 25500,
      "prorated_rent": 13968,
      "days_occupied": 17,
      "total_days_in_month": 31,
      "is_full_month": false,
      "daily_rate": 823
    },
    "initial_costs": {
      "deposit": 15000,
      "key_money": 15000,
      "first_month_rent": 13968,
      "total_initial": 43968
    },
    "annual_cost_first_year": 324468
  }
}
```

---

## 🎨 Frontend - Cambios Implementados

### 1. Calculadora de Renta (`frontend/lib/rent-calculator.ts`)

Versión TypeScript de todas las funciones de cálculo:

- `calculateProratedRent()` - Cálculo proporcional
- `calculateSharedRent()` - Shared vs Fixed
- `calculateTotalMonthlyCost()` - Costos mensuales
- `calculateInitialCosts()` - Costos iniciales
- `calculateAssignmentCosts()` - Cálculo completo

Helpers:
- `formatCurrency()` - Formato JPY
- `formatDate()` - Formato japonés

### 2. API Client (`frontend/lib/api.ts`)

Nuevas funciones:

```typescript
export const getAssignments = (params?: any) => ...
export const createAssignment = (data: any) => ...
export const updateAssignment = (id: string, data: any) => ...
export const calculateAssignmentPrice = (data) => ...
```

---

## 📝 Componentes a Implementar (Pendientes)

### 1. Actualizar `ApartmentAssignment.tsx`

Cambios necesarios:

```typescript
// 1. Integrar con API real
import { calculateAssignmentPrice, createAssignment } from "@/lib/api";
import { calculateAssignmentCosts } from "@/lib/rent-calculator";

// 2. Agregar selector de fecha de entrada
const [moveInDate, setMoveInDate] = useState<Date>(new Date());

// 3. Llamar a la API para calcular precios
const fetchPricing = async () => {
  const result = await calculateAssignmentPrice({
    apartment_id: selectedApartment.id,
    employee_id: selectedEmployee.id,
    move_in_date: moveInDate.toISOString().split('T')[0]
  });
  setFinancials(result.data.costs);
};

// 4. Mostrar información de pro-rated rent
{financials.proratedFirstMonth && !financials.proratedFirstMonth.isFullMonth && (
  <div className="p-3 rounded-lg bg-blue-500/10">
    <p className="text-sm font-medium mb-1">Primer Mes (Prorrateado)</p>
    <p className="text-xs text-muted-foreground">
      {financials.proratedFirstMonth.daysOccupied} días de {financials.proratedFirstMonth.totalDaysInMonth}
    </p>
    <p className="text-lg font-bold text-blue-600">
      ¥{financials.proratedFirstMonth.proratedRent.toLocaleString()}
    </p>
  </div>
)}

// 5. Crear asignación al confirmar
const handleCreateAssignment = async () => {
  await createAssignment({
    apartment_id: selectedApartment.id,
    employee_id: selectedEmployee.id,
    move_in_date: moveInDate.toISOString().split('T')[0],
    monthly_charge: financials.monthly_costs.total_monthly,
    deposit_paid: financials.initial_costs.deposit
  });
};
```

### 2. Crear `EmployeePriceEditor.tsx`

Componente para editar el precio de un empleado:

```tsx
export function EmployeePriceEditor({
  employeeId,
  assignmentId,
  currentRate,
  apartmentPricingType
}: {
  employeeId: string;
  assignmentId: string;
  currentRate: number;
  apartmentPricingType: "shared" | "fixed";
}) {
  const [customRate, setCustomRate] = useState(currentRate);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = async () => {
    await updateAssignment(assignmentId, {
      custom_monthly_rate: customRate
    });
    setIsEditing(false);
  };

  return (
    <GlassCard>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h4 className="font-semibold">Precio Mensual</h4>
            <p className="text-xs text-muted-foreground">
              Tipo: {apartmentPricingType === "shared" ? "Compartido" : "Fijo"}
            </p>
          </div>
          {!isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="w-4 h-4 mr-1" />
              Editar
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <input
              type="number"
              value={customRate}
              onChange={(e) => setCustomRate(Number(e.target.value))}
              className="w-full p-2 border rounded-lg"
              placeholder="Precio personalizado (¥)"
            />
            <div className="flex gap-2">
              <Button onClick={handleSave} className="flex-1">
                Guardar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCustomRate(currentRate);
                  setIsEditing(false);
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <p className="text-3xl font-bold text-green-600">
              ¥{currentRate.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">por mes</p>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
```

### 3. Actualizar `MovementTimeline.tsx`

Agregar indicador de precio personalizado:

```tsx
{assignment.custom_monthly_rate && (
  <div className="px-2 py-1 rounded-full bg-purple-500/20 text-purple-600 text-xs font-medium inline-flex items-center gap-1">
    <Star className="w-3 h-3" />
    Precio Personalizado
  </div>
)}
```

---

## 🧪 Testing

### 1. Probar Cálculos

```python
# Backend test
from app.utils.rent_calculator import calculate_assignment_costs
from decimal import Decimal
from datetime import date

costs = calculate_assignment_costs(
    apartment_monthly_rent=Decimal('60000'),
    apartment_deposit=Decimal('60000'),
    apartment_key_money=Decimal('60000'),
    apartment_management_fee=Decimal('10000'),
    apartment_pricing_type='shared',
    apartment_current_occupants=4,
    apartment_utilities_included=False,
    apartment_parking_included=True,
    apartment_parking_fee=Decimal('0'),
    move_in_date=date(2025, 3, 15)
)

print(costs)
```

### 2. Probar API

```bash
# Calcular precio
curl -X POST http://localhost:8100/api/assignments/calculate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": "uuid-here",
    "employee_id": "uuid-here",
    "move_in_date": "2025-03-15"
  }'

# Crear asignación
curl -X POST http://localhost:8100/api/assignments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "apartment_id": "uuid-here",
    "employee_id": "uuid-here",
    "move_in_date": "2025-03-15",
    "deposit_paid": 15000,
    "monthly_charge": 13968
  }'
```

---

## 📊 Ejemplos de Uso

### Caso 1: Apartamento Compartido (SHARED)

```
Apartamento: ¥60,000/mes, capacidad 4 personas
Pricing Type: SHARED
Ocupantes actuales: 3 (después de agregar nuevo empleado)
Fecha de entrada: 15 de marzo (mes de 31 días)

CÁLCULOS:
1. Renta base por persona: ¥60,000 ÷ 3 = ¥20,000
2. Management fee: ¥10,000 ÷ 3 = ¥3,333
3. Total mensual: ¥20,000 + ¥3,333 + ¥8,000 (utilities) = ¥31,333
4. Días ocupados: 31 - 15 + 1 = 17 días
5. Renta prorrateada: ¥31,333 × (17/31) = ¥17,181
6. Costos iniciales: ¥20,000 (deposit) + ¥20,000 (key) + ¥17,181 = ¥57,181
7. Costo anual: ¥57,181 + (¥31,333 × 11) = ¥401,844
```

### Caso 2: Apartamento Precio Fijo (FIXED)

```
Apartamento: ¥15,000/persona
Pricing Type: FIXED
Ocupantes: 3 personas
Fecha de entrada: 1 de abril (mes completo)

CÁLCULOS:
1. Renta por persona: ¥15,000 (fijo)
2. Management fee: ¥5,000 (fijo)
3. Total mensual: ¥15,000 + ¥5,000 = ¥20,000
4. Es mes completo, no hay prorrateo
5. Costos iniciales: ¥15,000 (deposit) + ¥15,000 (key) + ¥20,000 = ¥50,000
6. Costo anual: ¥50,000 + (¥20,000 × 11) = ¥270,000
```

### Caso 3: Precio Personalizado

```
Apartamento: ¥60,000/mes, SHARED
Custom Rate: ¥12,000 (precio especial para este empleado)
Fecha de entrada: 20 de mayo (mes de 31 días)

CÁLCULOS:
1. Renta base: ¥12,000 (personalizado, no dividido)
2. Management fee: ¥10,000 ÷ 4 = ¥2,500 (sí se divide)
3. Total mensual: ¥12,000 + ¥2,500 = ¥14,500
4. Días ocupados: 31 - 20 + 1 = 12 días
5. Renta prorrateada: ¥14,500 × (12/31) = ¥5,613
6. Costos iniciales: ¥15,000 + ¥15,000 + ¥5,613 = ¥35,613
7. Costo anual: ¥35,613 + (¥14,500 × 11) = ¥195,113
```

---

## 🚀 Próximos Pasos

1. ✅ Backend completamente implementado
2. ✅ Frontend utilities creados
3. ✅ API client actualizado
4. ⏳ Finalizar integración del componente ApartmentAssignment
5. ⏳ Crear componente EmployeePriceEditor
6. ⏳ Actualizar MovementTimeline
7. ⏳ Testing completo
8. ⏳ Documentación de usuario

---

## 📚 Referencias

- **日割り計算 (Prorated Rent)**: Cálculo estándar en Japón para rentas parciales
- **敷金 (Shikikin)**: Depósito reembolsable
- **礼金 (Reikin)**: Key money, no reembolsable
- **管理費 (Kanrihi)**: Management fee
- **光熱費 (Kōnetsuhi)**: Utilities (agua, luz, gas)

---

**Fecha de Implementación**: 2025-11-30
**Versión**: 2.0.0
**Estado**: Backend Completo, Frontend Parcial
