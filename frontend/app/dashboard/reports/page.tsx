'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import {
  TrendingUp, Calendar, Users, Home, ArrowUpRight, ArrowDownLeft,
  DownloadCloud, Activity
} from 'lucide-react';
import ExportOccupancy from '@/components/features/ExportOccupancy';

interface MonthlyData {
  month: string;
  moves_in: number;
  moves_out: number;
  occupancy_rate: number;
  total_residents: number;
}

interface ResidentType {
  type: string;
  count: number;
}

export default function ReportsPage() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate data - in production, fetch from API
    const mockData: MonthlyData[] = [
      { month: 'Enero', moves_in: 5, moves_out: 2, occupancy_rate: 78, total_residents: 156 },
      { month: 'Febrero', moves_in: 3, moves_out: 1, occupancy_rate: 80, total_residents: 158 },
      { month: 'Marzo', moves_in: 7, moves_out: 3, occupancy_rate: 84, total_residents: 162 },
      { month: 'Abril', moves_in: 4, moves_out: 2, occupancy_rate: 86, total_residents: 164 },
      { month: 'Mayo', moves_in: 6, moves_out: 4, occupancy_rate: 84, total_residents: 166 },
      { month: 'Junio', moves_in: 5, moves_out: 1, occupancy_rate: 88, total_residents: 170 },
      { month: 'Julio', moves_in: 8, moves_out: 5, occupancy_rate: 86, total_residents: 173 },
      { month: 'Agosto', moves_in: 3, moves_out: 2, occupancy_rate: 87, total_residents: 174 },
      { month: 'Septiembre', moves_in: 4, moves_out: 3, occupancy_rate: 85, total_residents: 175 },
      { month: 'Octubre', moves_in: 6, moves_out: 1, occupancy_rate: 90, total_residents: 180 },
      { month: 'Noviembre', moves_in: 5, moves_out: 2, occupancy_rate: 91, total_residents: 183 },
      { month: 'Diciembre', moves_in: 2, moves_out: 1, occupancy_rate: 92, total_residents: 184 }
    ];

    setMonthlyData(mockData);
    setLoading(false);
  }, [selectedYear]);

  const stats = {
    totalMovesIn: monthlyData.reduce((sum, m) => sum + m.moves_in, 0),
    totalMovesOut: monthlyData.reduce((sum, m) => sum + m.moves_out, 0),
    avgOccupancy: monthlyData.length > 0
      ? Math.round(monthlyData.reduce((sum, m) => sum + m.occupancy_rate, 0) / monthlyData.length)
      : 0,
    netMovement: monthlyData.reduce((sum, m) => sum + m.moves_in - m.moves_out, 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-600" />
              Reportes y Análisis
            </h1>
            <p className="text-gray-600 mt-2">
              Rotación de residentes, historial de movimientos y exportación de datos
            </p>
          </div>
        </div>

        {/* Year Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <label className="text-sm font-medium text-gray-700">Año:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {[2023, 2024, 2025, 2026].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Nuevos Residentes</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalMovesIn}</p>
                <p className="text-xs text-gray-500 mt-1">Ingresos en {selectedYear}</p>
              </div>
              <ArrowUpRight className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Residentes Salientes</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{stats.totalMovesOut}</p>
                <p className="text-xs text-gray-500 mt-1">Egresos en {selectedYear}</p>
              </div>
              <ArrowDownLeft className="w-8 h-8 text-red-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Ocupación Promedio</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.avgOccupancy}%</p>
                <p className="text-xs text-gray-500 mt-1">Año {selectedYear}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-700 text-sm font-medium">Movimiento Neto</p>
                <p className={`text-3xl font-bold mt-1 ${stats.netMovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.netMovement > 0 ? '+' : ''}{stats.netMovement}
                </p>
                <p className="text-xs text-purple-700 mt-1">Ingresos - Egresos</p>
              </div>
              <Users className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Movement Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Movimiento Mensual
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="moves_in" name="Ingresos" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="moves_out" name="Egresos" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Line type="monotone" dataKey="occupancy_rate" name="% Ocupación" stroke="#3b82f6" yAxisId="right" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Occupancy Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Home className="w-5 h-5 text-blue-600" />
              Tendencia de Ocupación
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="occupancy_rate"
                  name="Tasa Ocupación (%)"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  type="monotone"
                  dataKey="total_residents"
                  name="Total Residentes"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  yAxisId="right"
                  dot={{ fill: '#8b5cf6', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Historical Movement Table */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Movimientos Mensuales Detallados</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700">Mes</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Ingresos</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Egresos</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Neto</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">% Ocupación</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700">Total Residentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyData.map((month, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 font-medium text-gray-800">{month.month}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded">
                        ↑ {month.moves_in}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-1 rounded">
                        ↓ {month.moves_out}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-gray-800">
                      {month.moves_in - month.moves_out > 0 ? '+' : ''}{month.moves_in - month.moves_out}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${month.occupancy_rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-700 min-w-max">{month.occupancy_rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-800">{month.total_residents}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Section */}
        <ExportOccupancy />

        {/* Footer */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
          <p>
            💡 <strong>Tip:</strong> Usa la opción de exportación para descargar todos los datos de residentes
            con sus IDs, colores asignados, y estado actual. Los archivos Excel incluyen residentes nuevos
            con fondo verde para fácil identificación.
          </p>
        </div>
      </div>
    </div>
  );
}
