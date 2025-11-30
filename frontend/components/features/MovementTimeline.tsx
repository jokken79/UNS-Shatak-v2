"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/modern";
import {
  Home, MapPin, Calendar, DollarSign, TrendingUp,
  Clock, ArrowRight, CheckCircle2, Circle, Star
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Assignment {
  id: string;
  apartment: {
    name: string;
    apartment_code: string;
    address: string;
    pricing_type?: "shared" | "fixed";
  };
  move_in_date: string;
  move_out_date: string | null;
  monthly_charge: number;
  custom_monthly_rate?: number;
  deposit_paid: number;
  is_current: boolean;
}

interface MovementTimelineProps {
  assignments: Assignment[];
  employeeName: string;
}

export function MovementTimeline({ assignments, employeeName }: MovementTimelineProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const calculateDuration = (moveIn: string, moveOut: string | null) => {
    const start = new Date(moveIn);
    const end = moveOut ? new Date(moveOut) : new Date();
    const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));

    if (months < 1) return "Menos de 1 mes";
    if (months === 1) return "1 mes";
    if (months < 12) return `${months} meses`;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 1 && remainingMonths === 0) return "1 año";
    if (years === 1) return `1 año, ${remainingMonths} meses`;
    if (remainingMonths === 0) return `${years} años`;
    return `${years} años, ${remainingMonths} meses`;
  };

  if (assignments.length === 0) {
    return (
      <GlassCard blur="md">
        <div className="p-8 text-center">
          <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-muted-foreground">No hay historial de asignaciones</p>
          <p className="text-sm text-muted-foreground mt-1">
            Este empleado aún no ha sido asignado a ningún apartamento
          </p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard blur="md">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Historial de Vivienda</h3>
            <p className="text-sm text-muted-foreground">
              住居履歴 • Housing History for {employeeName}
            </p>
          </div>
          <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-sm font-medium">
            {assignments.length} {assignments.length === 1 ? "asignación" : "asignaciones"}
          </div>
        </div>

        <div className="relative">
          {/* Línea vertical del timeline */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-transparent" />

          <div className="space-y-6">
            {assignments.map((assignment, index) => {
              const isLast = index === assignments.length - 1;
              const duration = calculateDuration(assignment.move_in_date, assignment.move_out_date);
              const totalCost = assignment.is_current
                ? assignment.monthly_charge * 12 // Estimado anual
                : 0; // Calcular basado en duración real

              return (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  {/* Indicador del timeline */}
                  <div className="absolute left-0 top-0">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        assignment.is_current
                          ? "bg-gradient-to-br from-green-500 to-emerald-500 ring-4 ring-green-500/20"
                          : "bg-gradient-to-br from-blue-500 to-purple-500 ring-4 ring-blue-500/20"
                      }`}
                    >
                      {assignment.is_current ? (
                        <CheckCircle2 className="w-6 h-6 text-white" />
                      ) : (
                        <Home className="w-6 h-6 text-white" />
                      )}
                    </div>
                  </div>

                  {/* Card de la asignación */}
                  <div
                    className={`rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg ${
                      assignment.is_current
                        ? "border-green-500 bg-gradient-to-br from-green-500/10 to-emerald-500/10"
                        : "border-border bg-background/50"
                    }`}
                  >
                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-lg">{assignment.apartment.name}</h4>
                            {assignment.is_current && (
                              <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-medium">
                                Actual
                              </span>
                            )}
                            {assignment.custom_monthly_rate && (
                              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 text-xs font-medium inline-flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                Precio Personalizado
                              </span>
                            )}
                            {assignment.apartment.pricing_type && (
                              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">
                                {assignment.apartment.pricing_type === "shared" ? "💰 Compartido" : "📌 Fijo"}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {assignment.apartment.apartment_code}
                          </p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="text-xs">{assignment.apartment.address}</span>
                          </div>
                        </div>
                      </div>

                      {/* Información de fechas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-start gap-2">
                          <div className="p-2 rounded-lg bg-blue-500/10 mt-0.5">
                            <Calendar className="w-4 h-4 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">Fecha de Entrada</p>
                            <p className="text-sm font-medium">{formatDate(assignment.move_in_date)}</p>
                          </div>
                        </div>

                        {assignment.move_out_date ? (
                          <div className="flex items-start gap-2">
                            <div className="p-2 rounded-lg bg-orange-500/10 mt-0.5">
                              <Calendar className="w-4 h-4 text-orange-500" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Fecha de Salida</p>
                              <p className="text-sm font-medium">{formatDate(assignment.move_out_date)}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <div className="p-2 rounded-lg bg-green-500/10 mt-0.5">
                              <Clock className="w-4 h-4 text-green-500 animate-pulse" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">Estado</p>
                              <p className="text-sm font-medium text-green-600">Residiendo actualmente</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Duración */}
                      <div className="mb-4 p-3 rounded-lg bg-purple-500/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span className="text-sm text-muted-foreground">Duración</span>
                          </div>
                          <span className="font-semibold text-purple-600">{duration}</span>
                        </div>
                      </div>

                      {/* Información financiera */}
                      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border">
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Depósito Pagado</p>
                          </div>
                          <p className="font-semibold">{formatCurrency(assignment.deposit_paid)}</p>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 mb-1">
                            <TrendingUp className="w-3 h-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Cargo Mensual</p>
                          </div>
                          <p className="font-semibold text-blue-600">
                            {formatCurrency(assignment.monthly_charge)}/月
                          </p>
                        </div>
                      </div>

                      {/* Total estimado (solo para asignación actual) */}
                      {assignment.is_current && (
                        <div className="mt-3 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-orange-500" />
                              <span className="text-sm font-medium">Costo Anual Estimado</span>
                            </div>
                            <span className="font-bold text-orange-600">
                              {formatCurrency(assignment.monthly_charge * 12)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Flecha conectora (excepto para el último) */}
                  {!isLast && (
                    <div className="absolute left-6 -bottom-3 flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-background border-2 border-purple-500 flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-purple-500 rotate-90" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Resumen estadístico */}
        <div className="mt-8 pt-6 border-t border-border">
          <h4 className="font-semibold mb-4">Resumen Estadístico</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Home className="w-4 h-4 text-blue-500" />
                <p className="text-xs text-muted-foreground">Total Apartamentos</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">{assignments.length}</p>
            </div>

            <div className="p-4 rounded-lg bg-purple-500/10">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <p className="text-xs text-muted-foreground">Asignación Actual</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {assignments.find((a) => a.is_current)
                  ? calculateDuration(
                      assignments.find((a) => a.is_current)!.move_in_date,
                      null
                    )
                  : "N/A"}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-green-500/10">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-500" />
                <p className="text-xs text-muted-foreground">Cargo Actual/Mes</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {assignments.find((a) => a.is_current)
                  ? formatCurrency(assignments.find((a) => a.is_current)!.monthly_charge)
                  : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
