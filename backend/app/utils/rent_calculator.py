"""
Utilidades para cálculo de renta
UNS-Shatak (社宅管理システム)
"""

from datetime import date
from decimal import Decimal
from calendar import monthrange
from typing import Dict, Optional


def calculate_prorated_rent(
    monthly_rent: Decimal,
    move_in_date: date,
    move_out_date: Optional[date] = None
) -> Dict[str, Decimal]:
    """
    Calcula la renta prorrateada (日割り計算) basada en los días de ocupación.

    Si la fecha de entrada no es el día 1, se calcula la renta proporcional
    desde el día de entrada hasta el final del mes.

    Args:
        monthly_rent: Renta mensual completa
        move_in_date: Fecha de entrada (mudanza)
        move_out_date: Fecha de salida (opcional, si es parcial)

    Returns:
        Dict con:
        - full_month_rent: Renta mensual completa
        - prorated_rent: Renta prorrateada para el primer mes
        - days_occupied: Días ocupados en el primer mes
        - total_days_in_month: Total de días del mes
        - is_full_month: Si es un mes completo o no

    Ejemplo:
        Si la renta mensual es 60,000 yenes y entra el día 15 de un mes de 30 días:
        - Días ocupados: 16 días (del 15 al 30, inclusive)
        - Renta prorrateada: 60,000 × (16/30) = 32,000 yenes
    """

    year = move_in_date.year
    month = move_in_date.month

    # Total de días en el mes
    _, total_days_in_month = monthrange(year, month)

    # Si entra el día 1, es un mes completo
    if move_in_date.day == 1 and (move_out_date is None or move_out_date.day == total_days_in_month):
        return {
            "full_month_rent": monthly_rent,
            "prorated_rent": monthly_rent,
            "days_occupied": total_days_in_month,
            "total_days_in_month": total_days_in_month,
            "is_full_month": True,
            "daily_rate": monthly_rent / Decimal(total_days_in_month)
        }

    # Si hay fecha de salida en el mismo mes
    if move_out_date and move_out_date.year == year and move_out_date.month == month:
        days_occupied = (move_out_date - move_in_date).days + 1
    else:
        # Días desde la entrada hasta el fin de mes (inclusive)
        days_occupied = total_days_in_month - move_in_date.day + 1

    # Cálculo proporcional
    daily_rate = monthly_rent / Decimal(total_days_in_month)
    prorated_rent = daily_rate * Decimal(days_occupied)

    return {
        "full_month_rent": monthly_rent,
        "prorated_rent": prorated_rent.quantize(Decimal('0.01')),
        "days_occupied": days_occupied,
        "total_days_in_month": total_days_in_month,
        "is_full_month": False,
        "daily_rate": daily_rate.quantize(Decimal('0.01'))
    }


def calculate_shared_rent(
    total_rent: Decimal,
    total_occupants: int,
    pricing_type: str = "shared"
) -> Decimal:
    """
    Calcula la renta por persona según el tipo de pricing.

    Args:
        total_rent: Renta total del apartamento
        total_occupants: Número actual de ocupantes
        pricing_type: "shared" (dividido) o "fixed" (fijo)

    Returns:
        Renta por persona

    Ejemplos:
        1. SHARED (Compartido):
           - Renta total: 60,000 yenes
           - 4 ocupantes: 60,000 ÷ 4 = 15,000 yenes por persona
           - 3 ocupantes: 60,000 ÷ 3 = 20,000 yenes por persona

        2. FIXED (Precio Fijo):
           - Renta por persona: 15,000 yenes
           - Sin importar si hay 1, 2, 3 o 4 ocupantes: siempre 15,000 yenes
    """

    if pricing_type == "shared":
        # Precio compartido: divide la renta total entre los ocupantes
        if total_occupants <= 0:
            return total_rent
        return (total_rent / Decimal(total_occupants)).quantize(Decimal('0.01'))

    else:  # pricing_type == "fixed"
        # Precio fijo: cada persona paga la renta completa (monthly_rent ya es el precio por persona)
        return total_rent


def calculate_total_monthly_cost(
    base_rent: Decimal,
    management_fee: Decimal = Decimal('0'),
    utilities_included: bool = True,
    parking_included: bool = True,
    parking_fee: Decimal = Decimal('0'),
    estimated_utilities: Decimal = Decimal('8000')
) -> Dict[str, Decimal]:
    """
    Calcula el costo mensual total incluyendo todos los componentes.

    Args:
        base_rent: Renta base (ya calculada según shared/fixed)
        management_fee: Tarifa de gestión (管理費)
        utilities_included: Si las utilidades están incluidas
        parking_included: Si el parking está incluido
        parking_fee: Tarifa de parking (駐車場)
        estimated_utilities: Utilidades estimadas (光熱費) si no están incluidas

    Returns:
        Dict con el desglose completo de costos
    """

    utilities_cost = Decimal('0') if utilities_included else estimated_utilities
    parking_cost = Decimal('0') if parking_included else parking_fee

    total = base_rent + management_fee + utilities_cost + parking_cost

    return {
        "base_rent": base_rent.quantize(Decimal('0.01')),
        "management_fee": management_fee.quantize(Decimal('0.01')),
        "utilities": utilities_cost.quantize(Decimal('0.01')),
        "parking": parking_cost.quantize(Decimal('0.01')),
        "total_monthly": total.quantize(Decimal('0.01'))
    }


def calculate_initial_costs(
    deposit: Decimal = Decimal('0'),
    key_money: Decimal = Decimal('0'),
    first_month_rent: Decimal = Decimal('0')
) -> Dict[str, Decimal]:
    """
    Calcula los costos iniciales al mudarse.

    Args:
        deposit: Depósito (敷金) - usualmente reembolsable
        key_money: Key money (礼金) - no reembolsable
        first_month_rent: Renta del primer mes (puede ser prorrateada)

    Returns:
        Dict con el desglose de costos iniciales
    """

    total = deposit + key_money + first_month_rent

    return {
        "deposit": deposit.quantize(Decimal('0.01')),
        "key_money": key_money.quantize(Decimal('0.01')),
        "first_month_rent": first_month_rent.quantize(Decimal('0.01')),
        "total_initial": total.quantize(Decimal('0.01'))
    }


def calculate_assignment_costs(
    apartment_monthly_rent: Decimal,
    apartment_deposit: Decimal,
    apartment_key_money: Decimal,
    apartment_management_fee: Decimal,
    apartment_pricing_type: str,
    apartment_current_occupants: int,
    apartment_utilities_included: bool,
    apartment_parking_included: bool,
    apartment_parking_fee: Decimal,
    move_in_date: date,
    custom_monthly_rate: Optional[Decimal] = None
) -> Dict[str, any]:
    """
    Calcula todos los costos para una asignación de apartamento.

    Esta es la función principal que combina todos los cálculos anteriores.

    Args:
        apartment_monthly_rent: Renta mensual del apartamento
        apartment_deposit: Depósito
        apartment_key_money: Key money
        apartment_management_fee: Tarifa de gestión
        apartment_pricing_type: "shared" o "fixed"
        apartment_current_occupants: Número actual de ocupantes (después de agregar al nuevo)
        apartment_utilities_included: Si incluye utilidades
        apartment_parking_included: Si incluye parking
        apartment_parking_fee: Tarifa de parking
        move_in_date: Fecha de entrada
        custom_monthly_rate: Precio personalizado (opcional, sobrescribe el cálculo)

    Returns:
        Dict completo con todos los cálculos
    """

    # 1. Calcular renta base por persona
    if custom_monthly_rate:
        # Si hay precio personalizado, usar ese
        base_rent_per_person = custom_monthly_rate
    else:
        # Calcular según el tipo de pricing
        base_rent_per_person = calculate_shared_rent(
            apartment_monthly_rent,
            apartment_current_occupants,
            apartment_pricing_type
        )

    # 2. Calcular costo mensual total
    monthly_costs = calculate_total_monthly_cost(
        base_rent=base_rent_per_person,
        management_fee=apartment_management_fee / Decimal(apartment_current_occupants)
            if apartment_pricing_type == "shared" else apartment_management_fee,
        utilities_included=apartment_utilities_included,
        parking_included=apartment_parking_included,
        parking_fee=apartment_parking_fee / Decimal(apartment_current_occupants)
            if apartment_pricing_type == "shared" else apartment_parking_fee
    )

    # 3. Calcular renta prorrateada para el primer mes
    prorated_info = calculate_prorated_rent(
        monthly_costs["total_monthly"],
        move_in_date
    )

    # 4. Calcular costos iniciales
    initial_costs = calculate_initial_costs(
        deposit=apartment_deposit / Decimal(apartment_current_occupants)
            if apartment_pricing_type == "shared" else apartment_deposit,
        key_money=apartment_key_money / Decimal(apartment_current_occupants)
            if apartment_pricing_type == "shared" else apartment_key_money,
        first_month_rent=prorated_info["prorated_rent"]
    )

    # 5. Calcular costo anual (primer año)
    # Primer mes prorrateado + 11 meses completos
    annual_cost = initial_costs["total_initial"] + (monthly_costs["total_monthly"] * Decimal('11'))

    return {
        "pricing_type": apartment_pricing_type,
        "is_custom_rate": custom_monthly_rate is not None,
        "base_rent_per_person": base_rent_per_person.quantize(Decimal('0.01')),
        "monthly_costs": monthly_costs,
        "prorated_first_month": prorated_info,
        "initial_costs": initial_costs,
        "annual_cost_first_year": annual_cost.quantize(Decimal('0.01')),
        "occupants": apartment_current_occupants
    }
