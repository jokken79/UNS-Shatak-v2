'use client';

import React, { useState, useEffect } from 'react';
import { Home, Calendar, Users, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';
import ResidentsList from '@/components/features/ResidentsList';

interface Resident {
  id: string;
  employee_code: string;
  full_name_roman: string;
  full_name_kanji?: string;
  move_in_date: string;
  is_recent: boolean;
  assigned_color: string;
  status: string;
  factory?: {
    name: string;
  };
}

interface Apartment {
  id: string;
  apartment_code: string;
  name: string;
  address: string;
  capacity: number;
  current_occupants: number;
  status: string;
}

interface ApartmentData {
  apartment: Apartment;
  residents: Resident[];
}

export default function OccupancyTrackingPage() {
  const [apartmentsData, setApartmentsData] = useState<ApartmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<'all' | 'occupied' | 'available'>('all');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch apartments
        const apartmentsRes = await fetch('/api/apartments?limit=500&is_active=true', { headers });
        const apartments = await apartmentsRes.json();

        // Fetch employees to map to apartments
        const employeesRes = await fetch('/api/employees?limit=500&is_active=true', { headers });
        const employees = await employeesRes.json();

        // Fetch assignments for recent moves
        const assignmentsRes = await fetch('/api/assignments', { headers });
        const assignments = await assignmentsRes.json();

        // Combine data
        const data = apartments.map((apt: Apartment) => {
          // Get current residents
          const residents = employees
            .filter((emp: any) => emp.apartment_id === apt.id)
            .map((emp: any) => {
              // Find corresponding assignment to get move_in_date
              const assignment = assignments.find(
                (a: any) => a.employee_id === emp.id && a.apartment_id === apt.id && a.is_current
              );

              return {
                id: emp.id,
                employee_code: emp.employee_code,
                full_name_roman: emp.full_name_roman,
                full_name_kanji: emp.full_name_kanji,
                move_in_date: assignment?.move_in_date || new Date().toISOString(),
                is_recent: assignment?.is_recent || false,
                assigned_color: assignment?.assigned_color || '#3B82F6',
                status: emp.status,
                factory: emp.factory
              };
            });

          return {
            apartment: apt,
            residents
          };
        });

        // Filter by status
        const filtered = data.filter((item: ApartmentData) => {
          if (filterStatus === 'occupied') return item.apartment.status === 'occupied';
          if (filterStatus === 'available') return item.apartment.status === 'available';
          return true;
        });

        // Sort by occupants (highest first)
        filtered.sort((a: ApartmentData, b: ApartmentData) =>
          b.apartment.current_occupants - a.apartment.current_occupants
        );

        setApartmentsData(filtered);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filterStatus]);

  // Statistics
  const totalApartments = apartmentsData.length;
  const occupiedApartments = apartmentsData.filter(a => a.apartment.status === 'occupied').length;
  const totalResidents = apartmentsData.reduce((sum, a) => sum + a.residents.length, 0);
  const newResidents = apartmentsData.reduce((sum, a) =>
    sum + a.residents.filter(r => {
      const moveDate = new Date(r.move_in_date);
      const today = new Date();
      const diffDays = Math.ceil(Math.abs(today.getTime() - moveDate.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length, 0
  );

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
              <Home className="w-8 h-8 text-blue-600" />
              Seguimiento de Ocupación
            </h1>
            <p className="text-gray-600 mt-2">
              Visualiza residentes actuales e identifica nuevas incorporaciones
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Apartamentos</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalApartments}</p>
              </div>
              <Home className="w-8 h-8 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Apartamentos Ocupados</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{occupiedApartments}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total de Residentes</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalResidents}</p>
              </div>
              <Users className="w-8 h-8 text-purple-600 opacity-20" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-sm font-medium">Residentes Nuevos (30d)</p>
                <p className="text-3xl font-bold text-emerald-800 mt-1">{newResidents}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-emerald-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex gap-4 items-center">
          <Calendar className="w-5 h-5 text-gray-600" />
          <div className="flex gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterStatus('occupied')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'occupied'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Ocupados
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === 'available'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Disponibles
            </button>
          </div>
        </div>

        {/* Apartments Grid */}
        <div className="space-y-4">
          {apartmentsData.map((data) => (
            <ResidentsList
              key={data.apartment.id}
              apartmentId={data.apartment.id}
              apartmentCode={data.apartment.apartment_code}
              residents={data.residents}
              capacity={data.apartment.capacity}
              currentOccupants={data.apartment.current_occupants}
            />
          ))}
        </div>

        {apartmentsData.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">No hay apartamentos para mostrar</p>
          </div>
        )}
      </div>
    </div>
  );
}
