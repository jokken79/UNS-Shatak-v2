/**
 * Utilidades para cálculo de renta - Frontend
 * UNS-Shatak (社宅管理システム)
 */

export interface ProratedRentResult {
  fullMonthRent: number;
  proratedRent: number;
  daysOccupied: number;
  totalDaysInMonth: number;
  isFullMonth: boolean;
  dailyRate: number;
}

export interface MonthlyCosts {
  baseRent: number;
  managementFee: number;
  utilities: number;
  parking: number;
  totalMonthly: number;
}

export interface InitialCosts {
  deposit: number;
  keyMoney: number;
  firstMonthRent: number;
  totalInitial: number;
}

export interface AssignmentCosts {
  pricingType: "shared" | "fixed";
  isCustomRate: boolean;
  baseRentPerPerson: number;
  monthlyCosts: MonthlyCosts;
  proratedFirstMonth: ProratedRentResult;
  initialCosts: InitialCosts;
  annualCostFirstYear: number;
  occupants: number;
}

const ESTIMATED_UTILITIES = 8000; // Promedio mensual en JPY

/**
 * Calcula los días en un mes
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Calcula la renta prorrateada (日割り計算)
 */
export function calculateProratedRent(
  monthlyRent: number,
  moveInDate: Date,
  moveOutDate?: Date
): ProratedRentResult {
  const year = moveInDate.getFullYear();
  const month = moveInDate.getMonth() + 1;
  const day = moveInDate.getDate();

  const totalDaysInMonth = getDaysInMonth(year, month);

  // Si entra el día 1, es un mes completo
  if (day === 1 && (!moveOutDate || moveOutDate.getDate() === totalDaysInMonth)) {
    return {
      fullMonthRent: monthlyRent,
      proratedRent: monthlyRent,
      daysOccupied: totalDaysInMonth,
      totalDaysInMonth,
      isFullMonth: true,
      dailyRate: monthlyRent / totalDaysInMonth
    };
  }

  // Calcular días ocupados
  let daysOccupied: number;
  if (moveOutDate && moveOutDate.getFullYear() === year && (moveOutDate.getMonth() + 1) === month) {
    daysOccupied = moveOutDate.getDate() - day + 1;
  } else {
    daysOccupied = totalDaysInMonth - day + 1;
  }

  const dailyRate = monthlyRent / totalDaysInMonth;
  const proratedRent = dailyRate * daysOccupied;

  return {
    fullMonthRent: monthlyRent,
    proratedRent: Math.round(proratedRent),
    daysOccupied,
    totalDaysInMonth,
    isFullMonth: false,
    dailyRate: Math.round(dailyRate)
  };
}

/**
 * Calcula la renta por persona según el tipo
 */
export function calculateSharedRent(
  totalRent: number,
  totalOccupants: number,
  pricingType: "shared" | "fixed"
): number {
  if (pricingType === "shared") {
    if (totalOccupants <= 0) return totalRent;
    return Math.round(totalRent / totalOccupants);
  } else {
    // Precio fijo
    return totalRent;
  }
}

/**
 * Calcula el costo mensual total
 */
export function calculateTotalMonthlyCost(params: {
  baseRent: number;
  managementFee?: number;
  utilitiesIncluded?: boolean;
  parkingIncluded?: boolean;
  parkingFee?: number;
  estimatedUtilities?: number;
}): MonthlyCosts {
  const {
    baseRent,
    managementFee = 0,
    utilitiesIncluded = true,
    parkingIncluded = true,
    parkingFee = 0,
    estimatedUtilities = ESTIMATED_UTILITIES
  } = params;

  const utilities = utilitiesIncluded ? 0 : estimatedUtilities;
  const parking = parkingIncluded ? 0 : parkingFee;
  const total = baseRent + managementFee + utilities + parking;

  return {
    baseRent,
    managementFee,
    utilities,
    parking,
    totalMonthly: Math.round(total)
  };
}

/**
 * Calcula los costos iniciales
 */
export function calculateInitialCosts(
  deposit: number = 0,
  keyMoney: number = 0,
  firstMonthRent: number = 0
): InitialCosts {
  const total = deposit + keyMoney + firstMonthRent;

  return {
    deposit,
    keyMoney,
    firstMonthRent,
    totalInitial: Math.round(total)
  };
}

/**
 * Calcula todos los costos para una asignación de apartamento
 */
export function calculateAssignmentCosts(params: {
  apartmentMonthlyRent: number;
  apartmentDeposit: number;
  apartmentKeyMoney: number;
  apartmentManagementFee: number;
  apartmentPricingType: "shared" | "fixed";
  apartmentCurrentOccupants: number;
  apartmentUtilitiesIncluded: boolean;
  apartmentParkingIncluded: boolean;
  apartmentParkingFee: number;
  moveInDate: Date;
  customMonthlyRate?: number;
}): AssignmentCosts {
  const {
    apartmentMonthlyRent,
    apartmentDeposit,
    apartmentKeyMoney,
    apartmentManagementFee,
    apartmentPricingType,
    apartmentCurrentOccupants,
    apartmentUtilitiesIncluded,
    apartmentParkingIncluded,
    apartmentParkingFee,
    moveInDate,
    customMonthlyRate
  } = params;

  // 1. Calcular renta base por persona
  const baseRentPerPerson = customMonthlyRate || calculateSharedRent(
    apartmentMonthlyRent,
    apartmentCurrentOccupants,
    apartmentPricingType
  );

  // 2. Calcular costo mensual total
  const monthlyCosts = calculateTotalMonthlyCost({
    baseRent: baseRentPerPerson,
    managementFee: apartmentPricingType === "shared"
      ? apartmentManagementFee / apartmentCurrentOccupants
      : apartmentManagementFee,
    utilitiesIncluded: apartmentUtilitiesIncluded,
    parkingIncluded: apartmentParkingIncluded,
    parkingFee: apartmentPricingType === "shared"
      ? apartmentParkingFee / apartmentCurrentOccupants
      : apartmentParkingFee
  });

  // 3. Calcular renta prorrateada para el primer mes
  const proratedFirstMonth = calculateProratedRent(
    monthlyCosts.totalMonthly,
    moveInDate
  );

  // 4. Calcular costos iniciales
  const initialCosts = calculateInitialCosts(
    apartmentPricingType === "shared"
      ? apartmentDeposit / apartmentCurrentOccupants
      : apartmentDeposit,
    apartmentPricingType === "shared"
      ? apartmentKeyMoney / apartmentCurrentOccupants
      : apartmentKeyMoney,
    proratedFirstMonth.proratedRent
  );

  // 5. Calcular costo anual (primer año)
  const annualCost = initialCosts.totalInitial + (monthlyCosts.totalMonthly * 11);

  return {
    pricingType: apartmentPricingType,
    isCustomRate: !!customMonthlyRate,
    baseRentPerPerson,
    monthlyCosts,
    proratedFirstMonth,
    initialCosts,
    annualCostFirstYear: Math.round(annualCost),
    occupants: apartmentCurrentOccupants
  };
}

/**
 * Formatea un número como moneda (JPY)
 */
export function formatCurrency(amount: number): string {
  return `¥${amount.toLocaleString('ja-JP')}`;
}

/**
 * Formatea una fecha para display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
