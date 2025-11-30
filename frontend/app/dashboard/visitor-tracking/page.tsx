'use client';

import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Users, Home, TrendingUp } from 'lucide-react';
import VisitorTracking from '@/components/features/VisitorTracking';

interface ApartmentOption {
  id: string;
  apartment_code: string;
  name: string;
}

interface ChartData {
  name: string;
  value: number;
  color: string;
}

export default function VisitorTrackingPage() {
  const [apartments, setApartments] = useState<ApartmentOption[]>([]);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string>('');
  const [selectedApartmentCode, setSelectedApartmentCode] = useState<string>('');
  const [loadingApartments, setLoadingApartments] = useState(false);
  const [monthlyStats, setMonthlyStats] = useState<ChartData[]>([]);

  // Fetch apartments on mount
  useEffect(() => {
    const fetchApartments = async () => {
      setLoadingApartments(true);
      try {
        const response = await fetch('/api/apartments?limit=500', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setApartments(data);
          if (data.length > 0) {
            setSelectedApartmentId(data[0].id);
            setSelectedApartmentCode(data[0].apartment_code);
          }
        }
      } catch (error) {
        console.error('Error fetching apartments:', error);
      } finally {
        setLoadingApartments(false);
      }
    };

    fetchApartments();
  }, []);

  // Fetch monthly statistics
  useEffect(() => {
    const fetchMonthlyStats = async () => {
      if (!selectedApartmentId) return;

      try {
        const response = await fetch(`/api/visitors/stats/apartment/${selectedApartmentId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.by_type) {
            const chartData = Object.entries(data.by_type).map(([type, stats]: any) => ({
              name: type.charAt(0).toUpperCase() + type.slice(1),
              value: stats.count,
              color: stats.color
            }));
            setMonthlyStats(chartData);
          }
        }
      } catch (error) {
        console.error('Error fetching monthly stats:', error);
      }
    };

    fetchMonthlyStats();
  }, [selectedApartmentId]);

  // Helper function to get employee ID from apartment (for now, use empty string)
  // In a real implementation, you might want to fetch the current resident
  const handleApartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const apartmentId = e.target.value;
    setSelectedApartmentId(apartmentId);

    const selected = apartments.find(apt => apt.id === apartmentId);
    if (selected) {
      setSelectedApartmentCode(selected.apartment_code);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
              <Users className="w-8 h-8 text-blue-600" />
              Seguimiento de Visitantes
            </h1>
            <p className="text-gray-600 mt-2">
              Registra y visualiza visitantes en tus apartamentos
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <Calendar className="w-8 h-8 text-blue-600 mb-2" />
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Apartment Selector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Home className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Selecciona un Apartamento</h2>
          </div>
          {loadingApartments ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <select
              value={selectedApartmentId}
              onChange={handleApartmentChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-800 font-medium"
            >
              <option value="">-- Selecciona un apartamento --</option>
              {apartments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.apartment_code} - {apt.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Statistics Cards */}
        {monthlyStats.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monthlyStats.map((stat, index) => (
              <div key={index} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: stat.color + '20' }}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">{stat.name}</p>
                    <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Section */}
        {monthlyStats.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Visitantes por Tipo
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Distribución de Visitantes
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={monthlyStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {monthlyStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main Visitor Tracking Component */}
        {selectedApartmentId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <VisitorTracking
              apartmentId={selectedApartmentId}
              apartmentCode={selectedApartmentCode}
              employeeId="" // Could be fetched from apartment details
            />
          </div>
        )}

        {!selectedApartmentId && !loadingApartments && (
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-6 text-center">
            <Calendar className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
            <p className="text-yellow-800">
              Selecciona un apartamento para ver y registrar visitantes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
