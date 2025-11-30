"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Button } from "@/components/ui";
import {
  StatCard,
  GlassCard,
  AnimatedCounter,
  AnimatedBackground,
  ProgressRing,
  GradientText,
  FloatingParticles
} from "@/components/modern";
import { getDashboardStats, getEmployees, getApartments } from "@/lib/api";
import {
  Building2, Users, Factory, TrendingUp, Home, UserPlus,
  AlertTriangle, DollarSign, Calendar, Activity, ArrowRight,
  Bed, MapPin, Briefcase, Clock, FileText, Bell
} from "lucide-react";

interface Stats {
  total_apartments: number;
  available_apartments: number;
  occupied_apartments: number;
  total_employees: number;
  active_employees: number;
  employees_with_housing: number;
  employees_without_housing: number;
  total_factories: number;
  occupancy_rate: number;
}

export default function ImprovedDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [urgentAlerts, setUrgentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getEmployees({ limit: 5 })
    ])
      .then(([statsRes, empRes]) => {
        setStats(statsRes.data);
        setRecentEmployees(empRes.data.slice(0, 5));

        // Generar alertas urgentes
        const alerts = [];
        if (statsRes.data.employees_without_housing > 0) {
          alerts.push({
            type: "warning",
            title: `${statsRes.data.employees_without_housing} empleados sin vivienda`,
            description: "Necesitan asignación de apartamento",
            action: "/dashboard/employees?filter=no-apartment"
          });
        }
        if (statsRes.data.available_apartments === 0) {
          alerts.push({
            type: "error",
            title: "Sin apartamentos disponibles",
            description: "Todos los apartamentos están ocupados",
            action: "/dashboard/apartments/new"
          });
        }
        setUrgentAlerts(alerts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="relative">
            <div className="w-20 h-20 border-4 border-primary/30 rounded-full animate-spin border-t-primary mx-auto" />
            <Building2 className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
        </motion.div>
      </div>
    );
  }

  const housingPercentage = stats ? Math.round((stats.employees_with_housing / stats.total_employees) * 100) : 0;

  return (
    <div className="relative min-h-screen">
      {/* Fondo Animado */}
      <AnimatedBackground />
      <FloatingParticles count={20} className="opacity-30" />

      <div className="relative z-10 space-y-6 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">
              <GradientText gradient="from-blue-600 via-purple-600 to-pink-600">
                Dashboard
              </GradientText>
            </h1>
            <p className="text-muted-foreground text-lg">
              社宅管理システム • Sistema de Gestión de Apartamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/apartments/new">
              <Button variant="outline" className="gap-2">
                <Home className="w-4 h-4" /> Nuevo Apartamento
              </Button>
            </Link>
            <Link href="/dashboard/employees/new">
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" /> Nuevo Empleado
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Alertas Urgentes */}
        {urgentAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard blur="lg" gradient="from-red-500/10 to-orange-500/10">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Bell className="w-5 h-5 text-orange-500 animate-pulse" />
                  <h3 className="font-semibold text-orange-700 dark:text-orange-400">
                    Alertas Importantes
                  </h3>
                </div>
                <div className="space-y-2">
                  {urgentAlerts.map((alert, i) => (
                    <Link key={i} href={alert.action}>
                      <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors cursor-pointer">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-muted-foreground">{alert.description}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Estadísticas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Apartamentos"
            value={stats?.total_apartments || 0}
            subtitle="社宅数 • Total apartments"
            icon={Building2}
            iconColor="text-blue-500"
            trend={{ value: 5, isPositive: true }}
            gradient="from-blue-500/10 to-cyan-500/10"
            delay={0}
          />

          <StatCard
            title="Total Empleados"
            value={stats?.total_employees || 0}
            subtitle="従業員数 • Total employees"
            icon={Users}
            iconColor="text-green-500"
            trend={{ value: 12, isPositive: true }}
            gradient="from-green-500/10 to-emerald-500/10"
            delay={0.1}
          />

          <StatCard
            title="Fábricas"
            value={stats?.total_factories || 0}
            subtitle="派遣先 • Client factories"
            icon={Factory}
            iconColor="text-purple-500"
            gradient="from-purple-500/10 to-pink-500/10"
            delay={0.2}
          />

          <StatCard
            title="Tasa de Ocupación"
            value={`${Math.round(stats?.occupancy_rate || 0)}%`}
            subtitle="入居率 • Occupancy rate"
            icon={TrendingUp}
            iconColor="text-orange-500"
            trend={{
              value: stats?.occupancy_rate ? stats.occupancy_rate - 80 : 0,
              isPositive: (stats?.occupancy_rate || 0) > 80
            }}
            gradient="from-orange-500/10 to-yellow-500/10"
            delay={0.3}
          />
        </div>

        {/* Estadísticas Detalladas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estado de Vivienda */}
          <GlassCard blur="md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Estado de Vivienda</h3>
                  <p className="text-sm text-muted-foreground">従業員の住居状況</p>
                </div>
                <Bed className="w-6 h-6 text-blue-500" />
              </div>

              <div className="flex items-center justify-center mb-6">
                <ProgressRing
                  progress={housingPercentage}
                  size={140}
                  strokeWidth={10}
                  color="#3b82f6"
                  label="Con Vivienda"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">Con apartamento</span>
                  </div>
                  <span className="font-bold text-green-600">
                    <AnimatedCounter value={stats?.employees_with_housing || 0} />
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-sm font-medium">Sin apartamento</span>
                  </div>
                  <span className="font-bold text-orange-600">
                    <AnimatedCounter value={stats?.employees_without_housing || 0} />
                  </span>
                </div>
              </div>

              <Link href="/dashboard/employees?filter=no-apartment">
                <Button variant="outline" className="w-full mt-4 gap-2">
                  Ver empleados sin vivienda
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Distribución de Apartamentos */}
          <GlassCard blur="md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Apartamentos</h3>
                  <p className="text-sm text-muted-foreground">Disponibilidad</p>
                </div>
                <Home className="w-6 h-6 text-purple-500" />
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Ocupados</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.occupied_apartments || 0} / {stats?.total_apartments || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((stats?.occupied_apartments || 0) / (stats?.total_apartments || 1)) * 100}%`
                      }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Disponibles</span>
                    <span className="text-sm text-muted-foreground">
                      {stats?.available_apartments || 0} / {stats?.total_apartments || 0}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <motion.div
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{
                        width: `${((stats?.available_apartments || 0) / (stats?.total_apartments || 1)) * 100}%`
                      }}
                      transition={{ duration: 1, delay: 0.7 }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                  <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      <AnimatedCounter value={stats?.occupied_apartments || 0} />
                    </p>
                    <p className="text-xs text-muted-foreground">Ocupados</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 text-center">
                    <p className="text-2xl font-bold text-green-600">
                      <AnimatedCounter value={stats?.available_apartments || 0} />
                    </p>
                    <p className="text-xs text-muted-foreground">Libres</p>
                  </div>
                </div>
              </div>

              <Link href="/dashboard/apartments">
                <Button variant="outline" className="w-full mt-4 gap-2">
                  Ver todos los apartamentos
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>

          {/* Empleados Recientes */}
          <GlassCard blur="md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold">Empleados Recientes</h3>
                  <p className="text-sm text-muted-foreground">Últimas incorporaciones</p>
                </div>
                <Clock className="w-6 h-6 text-orange-500" />
              </div>

              <div className="space-y-3">
                {recentEmployees.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No hay empleados registrados
                  </p>
                ) : (
                  recentEmployees.map((emp, i) => (
                    <motion.div
                      key={emp.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Link href={`/dashboard/employees/${emp.id}`}>
                        <div className="p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-all cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                              {emp.full_name_roman?.charAt(0) || "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                {emp.full_name_roman}
                              </p>
                              <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                            </div>
                            <div>
                              {emp.apartment_id ? (
                                <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-600 text-xs font-medium">
                                  🏠 Housed
                                </div>
                              ) : (
                                <div className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-600 text-xs font-medium">
                                  ⚠️ No housing
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                )}
              </div>

              <Link href="/dashboard/employees">
                <Button variant="outline" className="w-full mt-4 gap-2">
                  Ver todos los empleados
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </GlassCard>
        </div>

        {/* Acciones Rápidas */}
        <GlassCard blur="lg">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-6">Acciones Rápidas</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/dashboard/apartments/new">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all cursor-pointer group border border-blue-500/20"
                >
                  <Building2 className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold mb-1">Nuevo Apartamento</p>
                  <p className="text-xs text-muted-foreground">Registrar nueva社宅</p>
                </motion.div>
              </Link>

              <Link href="/dashboard/employees/new">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 hover:from-green-500/20 hover:to-emerald-500/20 transition-all cursor-pointer group border border-green-500/20"
                >
                  <UserPlus className="w-8 h-8 text-green-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold mb-1">Nuevo Empleado</p>
                  <p className="text-xs text-muted-foreground">Registrar従業員</p>
                </motion.div>
              </Link>

              <Link href="/dashboard/factories/new">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 transition-all cursor-pointer group border border-purple-500/20"
                >
                  <Factory className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold mb-1">Nueva Fábrica</p>
                  <p className="text-xs text-muted-foreground">Registrar派遣先</p>
                </motion.div>
              </Link>

              <Link href="/dashboard/import">
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-6 rounded-xl bg-gradient-to-br from-orange-500/10 to-yellow-500/10 hover:from-orange-500/20 hover:to-yellow-500/20 transition-all cursor-pointer group border border-orange-500/20"
                >
                  <FileText className="w-8 h-8 text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
                  <p className="font-semibold mb-1">Importar Datos</p>
                  <p className="text-xs text-muted-foreground">Carga masiva Excel/CSV</p>
                </motion.div>
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
