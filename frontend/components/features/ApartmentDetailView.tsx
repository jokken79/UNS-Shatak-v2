"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/modern";
import { getApartments, getEmployees } from "@/lib/api";
import {
  Home, Users, MapPin, Building2, ChevronDown, ChevronRight, TrendingUp
} from "lucide-react";
import Link from "next/link";

interface Employee {
  id: string;
  employee_code: string;
  full_name_roman: string;
  full_name_japanese: string;
  factory_id: string;
  apartment_id: string;
  factory?: {
    name: string;
    name_japanese: string;
  };
}

interface Apartment {
  id: string;
  apartment_code: string;
  name: string;
  address: string;
  capacity: number;
  current_occupants: number;
  monthly_rent: number;
  pricing_type: string;
}

interface ApartmentWithEmployees {
  apartment: Apartment;
  employeesByFactory: {
    factoryName: string;
    factoryNameJapanese: string;
    employees: Employee[];
  }[];
  totalEmployees: number;
  occupancyRate: number;
}

export function ApartmentDetailView() {
  const [data, setData] = useState<ApartmentWithEmployees[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedApartments, setExpandedApartments] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      getApartments({ limit: 1000 }),
      getEmployees({ limit: 1000 })
    ])
      .then(([apartmentsRes, employeesRes]) => {
        const apartments = apartmentsRes.data;
        const employees = employeesRes.data;

        // Agrupar empleados por apartamento y luego por fábrica
        const apartmentData: ApartmentWithEmployees[] = apartments
          .filter((apt: Apartment) => apt.current_occupants > 0)
          .map((apartment: Apartment) => {
            // Empleados de este apartamento
            const apartmentEmployees = employees.filter(
              (emp: Employee) => emp.apartment_id === apartment.id
            );

            // Agrupar por fábrica
            const factoryGroups = new Map<string, Employee[]>();
            apartmentEmployees.forEach((emp: Employee) => {
              const factoryKey = emp.factory?.name_japanese || emp.factory?.name || "Sin Fábrica";
              if (!factoryGroups.has(factoryKey)) {
                factoryGroups.set(factoryKey, []);
              }
              factoryGroups.get(factoryKey)!.push(emp);
            });

            // Convertir a array y ordenar
            const employeesByFactory = Array.from(factoryGroups.entries())
              .map(([factoryName, emps]) => ({
                factoryName: emps[0]?.factory?.name || "Sin Fábrica",
                factoryNameJapanese: emps[0]?.factory?.name_japanese || factoryName,
                employees: emps
              }))
              .sort((a, b) => b.employees.length - a.employees.length);

            const occupancyRate = apartment.capacity > 0
              ? Math.round((apartmentEmployees.length / apartment.capacity) * 100)
              : 0;

            return {
              apartment,
              employeesByFactory,
              totalEmployees: apartmentEmployees.length,
              occupancyRate
            };
          })
          .sort((a, b) => b.totalEmployees - a.totalEmployees);

        setData(apartmentData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleApartment = (apartmentId: string) => {
    setExpandedApartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(apartmentId)) {
        newSet.delete(apartmentId);
      } else {
        newSet.add(apartmentId);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Vista por Apartamento</h2>
          <p className="text-muted-foreground">社宅別従業員分布 • Employee Distribution by Apartment</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Home className="w-4 h-4" />
          <span>{data.length} apartamentos ocupados</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => {
          const isExpanded = expandedApartments.has(item.apartment.id);
          const isFull = item.occupancyRate >= 100;
          const isAlmostFull = item.occupancyRate >= 75 && item.occupancyRate < 100;

          return (
            <motion.div
              key={item.apartment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard blur="md">
                <div className="p-6">
                  {/* Header del Apartamento */}
                  <div
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => toggleApartment(item.apartment.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 rounded-xl text-white ${
                        isFull ? "bg-gradient-to-br from-red-500 to-orange-500" :
                        isAlmostFull ? "bg-gradient-to-br from-orange-500 to-yellow-500" :
                        "bg-gradient-to-br from-green-500 to-emerald-500"
                      }`}>
                        <Home className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                            {item.apartment.name}
                          </h3>
                          <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            isFull ? "bg-red-500/20 text-red-600" :
                            isAlmostFull ? "bg-orange-500/20 text-orange-600" :
                            "bg-green-500/20 text-green-600"
                          }`}>
                            {item.totalEmployees}/{item.apartment.capacity} ocupantes
                          </div>
                          <div className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 text-xs font-medium">
                            {item.apartment.pricing_type === "shared" ? "💰 Compartido" : "📌 Fijo"}
                          </div>
                          {item.employeesByFactory.length > 1 && (
                            <div className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 text-xs font-medium">
                              🏭 {item.employeesByFactory.length} fábricas mezcladas
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {item.apartment.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Ocupancy Ring */}
                      <div className="relative w-16 h-16">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-muted"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 28}`}
                            strokeDashoffset={`${2 * Math.PI * 28 * (1 - item.occupancyRate / 100)}`}
                            className={
                              isFull ? "text-red-500" :
                              isAlmostFull ? "text-orange-500" :
                              "text-green-500"
                            }
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className={`text-sm font-bold ${
                            isFull ? "text-red-600" :
                            isAlmostFull ? "text-orange-600" :
                            "text-green-600"
                          }`}>
                            {item.occupancyRate}%
                          </span>
                        </div>
                      </div>

                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-6 h-6 text-muted-foreground" />
                      </motion.div>
                    </div>
                  </div>

                  {/* Lista de Empleados por Fábrica (Expandible) */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 space-y-4"
                    >
                      {item.employeesByFactory.map((factoryGroup, idx) => (
                        <div
                          key={idx}
                          className="ml-4 pl-6 border-l-2 border-blue-500/30"
                        >
                          <div className="p-4 rounded-lg bg-background/50 border border-border">
                            <div className="flex items-center gap-3 mb-3">
                              <Building2 className="w-5 h-5 text-blue-500" />
                              <div>
                                <p className="font-semibold">
                                  {factoryGroup.factoryNameJapanese}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {factoryGroup.factoryName}
                                </p>
                              </div>
                              <div className="ml-auto px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 text-sm font-semibold">
                                {factoryGroup.employees.length} 人
                              </div>
                            </div>

                            {/* Lista de Empleados */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {factoryGroup.employees.map((emp) => (
                                <Link
                                  key={emp.id}
                                  href={`/dashboard/employees/${emp.id}`}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                    {emp.full_name_roman?.charAt(0) || "?"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                      {emp.full_name_roman}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {emp.employee_code}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Info de Renta */}
                      <div className="ml-4 pl-6 border-l-2 border-green-500/30">
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium mb-1">Renta Total del Apartamento</p>
                              <p className="text-xs text-muted-foreground">
                                {item.apartment.pricing_type === "shared"
                                  ? `Dividido entre ${item.totalEmployees} personas`
                                  : "Precio fijo por persona"}
                              </p>
                            </div>
                            <p className="text-2xl font-bold text-green-600">
                              ¥{item.apartment.monthly_rent?.toLocaleString() || "0"}/月
                            </p>
                          </div>
                          {item.apartment.pricing_type === "shared" && (
                            <div className="mt-2 pt-2 border-t border-green-500/20">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Por persona:</span>
                                <span className="font-semibold text-green-600">
                                  ¥{Math.round(item.apartment.monthly_rent / item.totalEmployees).toLocaleString()}/月
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          );
        })}

        {data.length === 0 && (
          <GlassCard blur="md">
            <div className="p-12 text-center">
              <Home className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No hay apartamentos ocupados</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
