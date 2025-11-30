"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/modern";
import { getFactories, getEmployees, getApartments } from "@/lib/api";
import {
  Building2, Home, Users, MapPin, Bus, ArrowRight, ChevronDown, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui";
import Link from "next/link";

interface Factory {
  id: string;
  factory_code: string;
  name: string;
  name_japanese: string;
  address: string;
  city: string;
  prefecture: string;
}

interface Employee {
  id: string;
  employee_code: string;
  full_name_roman: string;
  full_name_japanese: string;
  factory_id: string;
  apartment_id: string;
}

interface Apartment {
  id: string;
  apartment_code: string;
  name: string;
  address: string;
}

interface FactoryWithHousing {
  factory: Factory;
  employeeCount: number;
  apartments: {
    apartment: Apartment;
    employees: Employee[];
  }[];
  employeesWithoutHousing: Employee[];
}

export function FactoryHousingView() {
  const [data, setData] = useState<FactoryWithHousing[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedFactories, setExpandedFactories] = useState<Set<string>>(new Set());

  useEffect(() => {
    Promise.all([
      getFactories({ limit: 1000 }),
      getEmployees({ limit: 1000 }),
      getApartments({ limit: 1000 })
    ])
      .then(([factoriesRes, employeesRes, apartmentsRes]) => {
        const factories = factoriesRes.data;
        const employees = employeesRes.data;
        const apartments = apartmentsRes.data;

        // Crear mapa de apartamentos
        const apartmentMap = new Map(apartments.map((apt: Apartment) => [apt.id, apt]));

        // Agrupar por fábrica
        const factoryData: FactoryWithHousing[] = factories.map((factory: Factory) => {
          // Empleados de esta fábrica
          const factoryEmployees = employees.filter((emp: Employee) => emp.factory_id === factory.id);

          // Agrupar por apartamento
          const apartmentGroups = new Map<string, Employee[]>();
          const noHousing: Employee[] = [];

          factoryEmployees.forEach((emp: Employee) => {
            if (emp.apartment_id) {
              if (!apartmentGroups.has(emp.apartment_id)) {
                apartmentGroups.set(emp.apartment_id, []);
              }
              apartmentGroups.get(emp.apartment_id)!.push(emp);
            } else {
              noHousing.push(emp);
            }
          });

          // Convertir a array
          const apartmentsList = Array.from(apartmentGroups.entries())
            .map(([aptId, emps]) => ({
              apartment: apartmentMap.get(aptId)!,
              employees: emps
            }))
            .filter(item => item.apartment) // Filtrar apartamentos que existen
            .sort((a, b) => b.employees.length - a.employees.length); // Ordenar por cantidad

          return {
            factory,
            employeeCount: factoryEmployees.length,
            apartments: apartmentsList,
            employeesWithoutHousing: noHousing
          };
        }).filter(item => item.employeeCount > 0); // Solo fábricas con empleados

        // Ordenar por cantidad de empleados
        factoryData.sort((a, b) => b.employeeCount - a.employeeCount);

        setData(factoryData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleFactory = (factoryId: string) => {
    setExpandedFactories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(factoryId)) {
        newSet.delete(factoryId);
      } else {
        newSet.add(factoryId);
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
          <h2 className="text-3xl font-bold">Vista por Fábrica</h2>
          <p className="text-muted-foreground">派遣先別住居状況 • Housing by Factory</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="w-4 h-4" />
          <span>{data.length} fábricas con empleados</span>
        </div>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.factory.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <GlassCard blur="md">
              <div className="p-6">
                {/* Header de Fábrica */}
                <div
                  className="flex items-center justify-between cursor-pointer group"
                  onClick={() => toggleFactory(item.factory.id)}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                          {item.factory.name_japanese || item.factory.name}
                        </h3>
                        <div className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-600 text-sm font-semibold">
                          {item.employeeCount} 従業員
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        {item.factory.address || `${item.factory.city}, ${item.factory.prefecture}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right mr-4">
                      <p className="text-sm text-muted-foreground">Apartamentos</p>
                      <p className="text-2xl font-bold text-purple-600">{item.apartments.length}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedFactories.has(item.factory.id) ? 90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </motion.div>
                  </div>
                </div>

                {/* Lista de Apartamentos (Expandible) */}
                {expandedFactories.has(item.factory.id) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 space-y-3"
                  >
                    {/* Apartamentos */}
                    {item.apartments.length > 0 ? (
                      item.apartments.map((apt) => (
                        <div
                          key={apt.apartment.id}
                          className="ml-4 pl-6 border-l-2 border-purple-500/30"
                        >
                          <div className="p-4 rounded-lg bg-background/50 border border-border hover:border-purple-500/50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Home className="w-5 h-5 text-purple-500" />
                                <div>
                                  <p className="font-semibold">{apt.apartment.name}</p>
                                  <p className="text-xs text-muted-foreground">{apt.apartment.apartment_code}</p>
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <MapPin className="w-3 h-3" />
                                    {apt.apartment.address}
                                  </p>
                                </div>
                              </div>
                              <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-600 text-sm font-semibold">
                                {apt.employees.length} 人
                              </div>
                            </div>

                            {/* Lista de Empleados */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-3">
                              {apt.employees.map((emp) => (
                                <Link
                                  key={emp.id}
                                  href={`/dashboard/employees/${emp.id}`}
                                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                                >
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                                    {emp.full_name_roman?.charAt(0) || "?"}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                      {emp.full_name_roman}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                                  </div>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Link>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="ml-4 pl-6 border-l-2 border-orange-500/30">
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <p className="text-sm text-orange-600">
                            Ningún empleado tiene apartamento asignado
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Empleados sin vivienda */}
                    {item.employeesWithoutHousing.length > 0 && (
                      <div className="ml-4 pl-6 border-l-2 border-orange-500/30">
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="flex items-center gap-2 mb-3">
                            <Bus className="w-5 h-5 text-orange-500" />
                            <p className="font-semibold text-orange-600">
                              Sin Vivienda Asignada ({item.employeesWithoutHousing.length})
                            </p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {item.employeesWithoutHousing.map((emp) => (
                              <Link
                                key={emp.id}
                                href={`/dashboard/employees/${emp.id}`}
                                className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background transition-colors group"
                              >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold">
                                  {emp.full_name_roman?.charAt(0) || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                    {emp.full_name_roman}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                                </div>
                                <ArrowRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Nota sobre transporte */}
                    {item.apartments.length > 0 && (
                      <div className="ml-4 pl-6 border-l-2 border-blue-500/30">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                          <div className="flex items-center gap-2">
                            <Bus className="w-4 h-4 text-blue-500" />
                            <p className="text-xs text-blue-600">
                              Los empleados toman bus desde los apartamentos hasta la fábrica
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        ))}

        {data.length === 0 && (
          <GlassCard blur="md">
            <div className="p-12 text-center">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-lg text-muted-foreground">No hay fábricas con empleados asignados</p>
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
