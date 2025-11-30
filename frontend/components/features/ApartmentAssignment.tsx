"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Popover, PopoverTrigger, PopoverContent, Input } from "@/components/ui";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { GlassCard, AnimatedCounter } from "@/components/modern";
import { getEmployees, getApartments, createAssignment, calculateAssignmentPrice } from "@/lib/api";
import {
  Building2, User, DollarSign, AlertTriangle, CheckCircle2,
  ArrowRight, Home, Users, Calendar, TrendingUp, Key, Zap,
  Wallet, CreditCard, Banknote, ParkingCircle, Droplets, CalendarIcon, Star, Percent
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";

interface Employee {
  id: string;
  employee_code: string;
  full_name_roman: string;
  full_name_japanese: string;
  apartment_id: string | null;
  status: string;
}

interface Apartment {
  id: string;
  apartment_code: string;
  name: string;
  address: string;
  max_occupants: number;
  current_occupants: number;
  monthly_rent: number;
  deposit: number;
  key_money: number;
  management_fee: number;
  utilities_included: boolean;
  parking_included: boolean;
  parking_fee: number;
  status: string;
  pricing_type?: "shared" | "fixed";
  capacity?: number;
}

interface PriceCalculation {
  monthly_rate: number;
  first_month_rent: number;
  days_in_first_month: number;
  is_prorated: boolean;
  total_occupants: number;
  per_person_share: number;
  pricing_type: "shared" | "fixed";
  breakdown: {
    base_rent: number;
    management_fee: number;
    utilities: number;
    parking: number;
  };
}

const ESTIMATED_UTILITIES = 8000;

export function ApartmentAssignment() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedApartment, setSelectedApartment] = useState<Apartment | null>(null);
  const [moveInDate, setMoveInDate] = useState<Date>(new Date());
  const [customMonthlyRate, setCustomMonthlyRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [priceCalculation, setPriceCalculation] = useState<PriceCalculation | null>(null);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      getEmployees({ filter: "no-apartment" }),
      getApartments({ status: "available" })
    ])
      .then(([empRes, aptRes]) => {
        setEmployees(empRes.data);
        setApartments(aptRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Calculate prices whenever apartment, employee, date, or custom rate changes
  useEffect(() => {
    if (selectedApartment && selectedEmployee && moveInDate) {
      fetchPriceCalculation();
    }
  }, [selectedApartment?.id, selectedEmployee?.id, moveInDate, customMonthlyRate]);

  const fetchPriceCalculation = async () => {
    if (!selectedApartment || !selectedEmployee || !moveInDate) return;

    setCalculating(true);
    try {
      const response = await calculateAssignmentPrice({
        apartment_id: selectedApartment.id,
        employee_id: selectedEmployee.id,
        move_in_date: format(moveInDate, "yyyy-MM-dd"),
        custom_monthly_rate: customMonthlyRate || undefined
      });

      setPriceCalculation(response.data);
    } catch (error) {
      console.error("Error calculating price:", error);
      toast.error("Error al calcular el precio");
    } finally {
      setCalculating(false);
    }
  };

  const getValidationWarnings = () => {
    const warnings = [];

    if (selectedEmployee?.apartment_id) {
      warnings.push({
        type: "warning",
        message: "Este empleado ya tiene un apartamento asignado. Se removerá de su apartamento actual."
      });
    }

    if (selectedApartment) {
      const remainingCapacity = selectedApartment.max_occupants - selectedApartment.current_occupants;
      if (remainingCapacity <= 1) {
        warnings.push({
          type: "info",
          message: `Este apartamento quedará lleno después de esta asignación (${selectedApartment.current_occupants + 1}/${selectedApartment.max_occupants})`
        });
      }
    }

    if (priceCalculation?.is_prorated) {
      warnings.push({
        type: "info",
        message: `Renta prorrateada: El empleado se muda el día ${moveInDate.getDate()}, por lo que el primer mes será calculado proporcionalmente (${priceCalculation.days_in_first_month} días).`
      });
    }

    return warnings;
  };

  const handleAssignment = async () => {
    if (!selectedEmployee || !selectedApartment || !moveInDate) return;

    setSaving(true);
    try {
      await createAssignment({
        employee_id: selectedEmployee.id,
        apartment_id: selectedApartment.id,
        move_in_date: format(moveInDate, "yyyy-MM-dd"),
        monthly_charge: priceCalculation?.monthly_rate || selectedApartment.monthly_rent,
        custom_monthly_rate: customMonthlyRate || undefined,
        deposit_paid: selectedApartment.deposit + selectedApartment.key_money
      });

      toast.success("¡Asignación creada exitosamente!");
      setStep(3);

      // Refresh employee list
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      console.error("Error al asignar apartamento:", error);
      toast.error(error.response?.data?.detail || "Error al crear la asignación");
    } finally {
      setSaving(false);
    }
  };

  const warnings = selectedEmployee && selectedApartment ? getValidationWarnings() : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold">Asignación de Apartamento</h2>
          <p className="text-muted-foreground">社宅配属 • Apartment Assignment</p>
        </div>

        <div className="flex items-center gap-2">
          <StepIndicator number={1} active={step === 1} completed={step > 1} label="Empleado" />
          <div className="w-12 h-0.5 bg-border" />
          <StepIndicator number={2} active={step === 2} completed={step > 2} label="Detalles" />
          <div className="w-12 h-0.5 bg-border" />
          <StepIndicator number={3} active={step === 3} completed={false} label="Confirmación" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Selección */}
        <div className="lg:col-span-2 space-y-6">
          {/* Paso 1: Seleccionar Empleado */}
          <GlassCard blur="md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <User className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Paso 1: Seleccionar Empleado</h3>
                  <p className="text-sm text-muted-foreground">Empleados sin vivienda asignada</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {employees.length === 0 ? (
                  <div className="col-span-2 text-center py-8">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">Todos los empleados tienen vivienda asignada</p>
                  </div>
                ) : (
                  employees.map((emp) => (
                    <motion.div
                      key={emp.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setSelectedEmployee(emp);
                        setStep(2);
                      }}
                      className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                        selectedEmployee?.id === emp.id
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border bg-background/50 hover:border-blue-500/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                          {emp.full_name_roman.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{emp.full_name_roman}</p>
                          <p className="text-sm text-muted-foreground">{emp.employee_code}</p>
                          <p className="text-xs text-muted-foreground truncate">{emp.full_name_japanese}</p>
                        </div>
                        {selectedEmployee?.id === emp.id && (
                          <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </GlassCard>

          {/* Paso 2: Seleccionar Apartamento y Fecha */}
          <AnimatePresence>
            {selectedEmployee && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Apartamentos */}
                <GlassCard blur="md">
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/10">
                        <Home className="w-5 h-5 text-purple-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold">Paso 2: Seleccionar Apartamento</h3>
                        <p className="text-sm text-muted-foreground">Apartamentos disponibles</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                      {apartments.length === 0 ? (
                        <div className="text-center py-8">
                          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                          <p className="text-muted-foreground">No hay apartamentos disponibles</p>
                        </div>
                      ) : (
                        apartments.map((apt) => {
                          const capacity = apt.max_occupants - apt.current_occupants;
                          const isAlmostFull = capacity <= 1;

                          return (
                            <motion.div
                              key={apt.id}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => setSelectedApartment(apt)}
                              className={`p-4 rounded-lg cursor-pointer transition-all border-2 ${
                                selectedApartment?.id === apt.id
                                  ? "border-purple-500 bg-purple-500/10"
                                  : "border-border bg-background/50 hover:border-purple-500/50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="font-medium">{apt.name}</p>
                                    {selectedApartment?.id === apt.id && (
                                      <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0" />
                                    )}
                                    {apt.pricing_type && (
                                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">
                                        {apt.pricing_type === "shared" ? "💰 Compartido" : "📌 Fijo"}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{apt.apartment_code}</p>
                                  <p className="text-xs text-muted-foreground truncate mb-3">{apt.address}</p>

                                  <div className="flex items-center gap-4 text-xs">
                                    <div className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      <span className={isAlmostFull ? "text-orange-500 font-medium" : ""}>
                                        {apt.current_occupants}/{apt.max_occupants}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="w-3 h-3" />
                                      <span>{formatCurrency(apt.monthly_rent)}/月</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </GlassCard>

                {/* Fecha de Mudanza y Custom Rate */}
                {selectedApartment && (
                  <GlassCard blur="md">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-500/10">
                          <Calendar className="w-5 h-5 text-green-500" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Fecha de Mudanza y Precio</h3>
                          <p className="text-sm text-muted-foreground">Configura los detalles de la asignación</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Date Picker */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Fecha de Entrada (入居日)
                          </label>
                          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !moveInDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {moveInDate ? format(moveInDate, "PPP", { locale: ja }) : "Seleccionar fecha"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarUI
                                mode="single"
                                selected={moveInDate}
                                onSelect={(date) => {
                                  if (date) {
                                    setMoveInDate(date);
                                    setDatePickerOpen(false);
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Custom Monthly Rate (Optional) */}
                        <div>
                          <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                            <Star className="w-4 h-4 text-purple-500" />
                            Precio Mensual Personalizado (Opcional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                            <Input
                              type="number"
                              value={customMonthlyRate || ""}
                              onChange={(e) => setCustomMonthlyRate(e.target.value ? Number(e.target.value) : null)}
                              placeholder="Dejar vacío para cálculo automático"
                              className="pl-8"
                              min="0"
                              step="1000"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Si no se especifica, se calculará automáticamente según el tipo de pricing del apartamento
                          </p>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Panel Derecho: Cálculos Financieros y Resumen */}
        <div className="space-y-6">
          {/* Resumen de Selección */}
          <GlassCard blur="lg">
            <div className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Resumen
              </h3>

              <div className="space-y-4">
                {/* Empleado Seleccionado */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Empleado</p>
                  {selectedEmployee ? (
                    <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <p className="font-medium text-sm">{selectedEmployee.full_name_roman}</p>
                      <p className="text-xs text-muted-foreground">{selectedEmployee.employee_code}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                      <p className="text-xs text-muted-foreground">Sin seleccionar</p>
                    </div>
                  )}
                </div>

                {/* Apartamento Seleccionado */}
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Apartamento</p>
                  {selectedApartment ? (
                    <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                      <p className="font-medium text-sm">{selectedApartment.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedApartment.apartment_code}</p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                      <p className="text-xs text-muted-foreground">Sin seleccionar</p>
                    </div>
                  )}
                </div>

                {/* Fecha */}
                {selectedApartment && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Fecha de Entrada</p>
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="font-medium text-sm">{format(moveInDate, "PPP", { locale: ja })}</p>
                      <p className="text-xs text-muted-foreground">
                        Día {moveInDate.getDate()} del mes
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>

          {/* Cálculos Financieros del Backend */}
          <AnimatePresence>
            {priceCalculation && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <GlassCard blur="lg" gradient="from-green-500/10 to-emerald-500/10">
                  <div className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-500" />
                      Cálculos Financieros
                      {calculating && <div className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin ml-2" />}
                    </h3>

                    {/* Tipo de Pricing */}
                    <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tipo de Pricing</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {priceCalculation.pricing_type === "shared" ? "💰 Compartido" : "📌 Fijo"}
                        </span>
                      </div>
                      {priceCalculation.pricing_type === "shared" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Dividido entre {priceCalculation.total_occupants} ocupantes
                        </p>
                      )}
                    </div>

                    {/* Precio Mensual */}
                    <div className="mb-4">
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Precio Mensual Regular
                      </p>
                      <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Mensual (月額)</span>
                          <span className="text-2xl font-bold text-green-600">
                            ¥{priceCalculation.monthly_rate.toLocaleString()}
                          </span>
                        </div>
                        {customMonthlyRate && (
                          <div className="mt-2 pt-2 border-t border-green-500/20">
                            <div className="flex items-center gap-1 text-xs text-purple-600">
                              <Star className="w-3 h-3" />
                              Precio personalizado aplicado
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Primer Mes (Prorrateado) */}
                    {priceCalculation.is_prorated && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Percent className="w-4 h-4 text-orange-500" />
                          Primer Mes (Prorrateado - 日割り)
                        </p>
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm text-muted-foreground">
                              {priceCalculation.days_in_first_month} días
                            </span>
                            <span className="text-xl font-bold text-orange-600">
                              ¥{priceCalculation.first_month_rent.toLocaleString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Calculado proporcionalmente desde el día {moveInDate.getDate()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Costos Iniciales */}
                    {selectedApartment && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          Costos Iniciales (一時金)
                        </p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Depósito (敷金)</span>
                            <span className="font-medium">¥{selectedApartment.deposit.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Key Money (礼金)</span>
                            <span className="font-medium">¥{selectedApartment.key_money.toLocaleString()}</span>
                          </div>
                          <div className="h-px bg-border my-2" />
                          <div className="flex justify-between font-semibold">
                            <span>Total Inicial</span>
                            <span className="text-green-600">
                              ¥{(selectedApartment.deposit + selectedApartment.key_money).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Primer Pago */}
                    {selectedApartment && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium">Total Primer Pago</p>
                            <p className="text-xs text-muted-foreground">Inicial + Primer mes</p>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">
                            ¥{(
                              selectedApartment.deposit +
                              selectedApartment.key_money +
                              (priceCalculation.is_prorated ? priceCalculation.first_month_rent : priceCalculation.monthly_rate)
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Advertencias */}
          <AnimatePresence>
            {warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <GlassCard blur="md" gradient="from-orange-500/10 to-yellow-500/10">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-orange-500" />
                      <h4 className="font-medium text-sm">Avisos</h4>
                    </div>
                    <div className="space-y-2">
                      {warnings.map((warning, i) => (
                        <div key={i} className="text-xs text-muted-foreground p-2 rounded bg-background/50">
                          {warning.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botón de Confirmación */}
          <Button
            onClick={handleAssignment}
            disabled={!selectedEmployee || !selectedApartment || !moveInDate || saving || calculating}
            className="w-full h-12 text-base gap-2"
            size="lg"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando...
              </>
            ) : step === 3 ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                ¡Asignación Completada!
              </>
            ) : (
              <>
                Confirmar Asignación
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para los indicadores de paso
function StepIndicator({
  number,
  active,
  completed,
  label
}: {
  number: number;
  active: boolean;
  completed: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
          completed
            ? "bg-green-500 text-white"
            : active
            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {completed ? <CheckCircle2 className="w-5 h-5" /> : number}
      </div>
      <span className={`text-xs ${active ? "font-medium" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  );
}
