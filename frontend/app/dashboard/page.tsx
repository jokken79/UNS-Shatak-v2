"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, Badge, Button } from "@/components/ui";
import { getDashboardStats, getEmployees, getApartments } from "@/lib/api";
import { 
  Building2, Users, Factory, TrendingUp, TrendingDown, Home, UserPlus, 
  AlertTriangle, CheckCircle, Clock, ArrowUpRight, ArrowRight, 
  Bed, DollarSign, MapPin, Calendar, Activity, Zap, Target, Award,
  BarChart3, PieChart, LineChart as LineChartIcon
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, PieChart as RechartsPie, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

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

// Sparkline component
const Sparkline = ({ data, color }: { data: number[]; color: string }) => (
  <div className="flex items-end gap-0.5 h-8">
    {data.map((value, i) => (
      <div
        key={i}
        className="w-1 rounded-full transition-all"
        style={{
          height: `${(value / Math.max(...data)) * 100}%`,
          backgroundColor: color,
          opacity: 0.3 + (i / data.length) * 0.7,
        }}
      />
    ))}
  </div>
);

// Animated counter
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}{suffix}</span>;
};

// Mock data for charts
const monthlyData = [
  { month: "Jan", occupancy: 65, newEmployees: 5 },
  { month: "Feb", occupancy: 68, newEmployees: 8 },
  { month: "Mar", occupancy: 72, newEmployees: 12 },
  { month: "Apr", occupancy: 75, newEmployees: 7 },
  { month: "May", occupancy: 78, newEmployees: 10 },
  { month: "Jun", occupancy: 82, newEmployees: 6 },
];

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getEmployees({ limit: 5 })
    ])
      .then(([statsRes, empRes]) => {
        setStats(statsRes.data);
        setRecentEmployees(empRes.data.slice(0, 5));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/30 rounded-full animate-spin border-t-primary" />
          <Building2 className="w-5 h-5 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "Occupied", value: stats?.occupied_apartments || 0, label: "入居中" },
    { name: "Available", value: stats?.available_apartments || 0, label: "空室" },
  ];

  const housingPieData = [
    { name: "With Housing", value: stats?.employees_with_housing || 0 },
    { name: "Without Housing", value: stats?.employees_without_housing || 0 },
  ];

  const sparklineData = [12, 19, 15, 25, 22, 30, 28, 35, 32, 40];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">社宅管理システム Overview • Welcome back!</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/apartments/new">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" /> Add Apartment
            </Button>
          </Link>
          <Link href="/dashboard/employees/new">
            <Button size="sm">
              <UserPlus className="w-4 h-4 mr-2" /> Add Employee
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Apartments Card */}
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Apartments</p>
                <p className="text-xs text-muted-foreground/70">社宅数</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedNumber value={stats?.total_apartments || 0} />
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="success" className="text-xs">
                    {stats?.available_apartments || 0} available
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={sparklineData} color="#3b82f6" />
            </div>
          </CardContent>
        </Card>

        {/* Employees Card */}
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-xs text-muted-foreground/70">従業員数</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedNumber value={stats?.total_employees || 0} />
                </p>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  <span>{stats?.active_employees || 0} active</span>
                </div>
              </div>
              <div className="p-3 bg-green-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={[8, 12, 15, 14, 18, 20, 22, 25, 28, 30]} color="#22c55e" />
            </div>
          </CardContent>
        </Card>

        {/* Factories Card */}
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Factories</p>
                <p className="text-xs text-muted-foreground/70">派遣先</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedNumber value={stats?.total_factories || 0} />
                </p>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>Client companies</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <Factory className="w-6 h-6 text-purple-500" />
              </div>
            </div>
            <div className="mt-4">
              <Sparkline data={[5, 5, 6, 7, 8, 9, 10, 11, 12, 15]} color="#8b5cf6" />
            </div>
          </CardContent>
        </Card>

        {/* Occupancy Rate Card */}
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Occupancy Rate</p>
                <p className="text-xs text-muted-foreground/70">入居率</p>
                <p className="text-3xl font-bold text-foreground">
                  <AnimatedNumber value={Math.round(stats?.occupancy_rate || 0)} suffix="%" />
                </p>
                <div className="flex items-center gap-1 text-sm text-orange-600">
                  <Target className="w-3 h-3" />
                  <span>{stats?.employees_with_housing || 0} housed</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${stats?.occupancy_rate || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart - Occupancy Trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <LineChartIcon className="w-5 h-5 text-blue-500" />
                  Occupancy Trend
                </CardTitle>
                <CardDescription>Monthly occupancy rate and new employees</CardDescription>
              </div>
              <Badge variant="outline">Last 6 months</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="occupancyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: 'currentColor' }} />
                  <YAxis className="text-xs" tick={{ fill: 'currentColor' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="occupancy" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#occupancyGradient)" 
                    strokeWidth={2}
                  />
                  <Bar dataKey="newEmployees" fill="#22c55e" radius={[4, 4, 0, 0]} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart - Apartment Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              Apartment Status
            </CardTitle>
            <CardDescription>Distribution overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-muted-foreground">Occupied ({stats?.occupied_apartments || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-muted-foreground">Available ({stats?.available_apartments || 0})</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Housing Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-blue-500" />
              Employee Housing
            </CardTitle>
            <CardDescription>従業員の住居状況</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm">With Housing / 社宅あり</span>
                </div>
                <span className="font-bold text-green-600">{stats?.employees_with_housing || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${stats?.total_employees ? (stats.employees_with_housing / stats.total_employees * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">Without Housing / 社宅なし</span>
                </div>
                <span className="font-bold text-orange-600">{stats?.employees_without_housing || 0}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-orange-400 to-orange-600 h-3 rounded-full transition-all"
                  style={{ width: `${stats?.total_employees ? (stats.employees_without_housing / stats.total_employees * 100) : 0}%` }}
                />
              </div>
            </div>
            <Link href="/dashboard/apartments?status=available">
              <Button variant="outline" className="w-full mt-4">
                View Available Apartments <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/apartments/new">
              <div className="p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 transition-colors cursor-pointer group">
                <Building2 className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">New Apartment</p>
                <p className="text-xs text-muted-foreground">社宅追加</p>
              </div>
            </Link>
            <Link href="/dashboard/employees/new">
              <div className="p-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors cursor-pointer group">
                <UserPlus className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">New Employee</p>
                <p className="text-xs text-muted-foreground">従業員追加</p>
              </div>
            </Link>
            <Link href="/dashboard/factories/new">
              <div className="p-4 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer group">
                <Factory className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">New Factory</p>
                <p className="text-xs text-muted-foreground">派遣先追加</p>
              </div>
            </Link>
            <Link href="/dashboard/import">
              <div className="p-4 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 transition-colors cursor-pointer group">
                <Activity className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">Import Data</p>
                <p className="text-xs text-muted-foreground">インポート</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              Recent Employees
            </CardTitle>
            <CardDescription>Latest additions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmployees.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No employees yet</p>
              ) : (
                recentEmployees.map((emp, i) => (
                  <Link key={emp.id} href={`/dashboard/employees/${emp.id}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {emp.full_name_roman?.charAt(0) || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{emp.full_name_roman}</p>
                        <p className="text-xs text-muted-foreground">{emp.employee_code}</p>
                      </div>
                      <Badge variant={emp.apartment_id ? "success" : "secondary"} className="text-xs">
                        {emp.apartment_id ? "🏠" : "No housing"}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <Link href="/dashboard/employees">
              <Button variant="ghost" className="w-full mt-3">
                View All <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
