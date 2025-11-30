'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Clock, User, MapPin, Tag } from 'lucide-react';

interface Visitor {
  id: string;
  visitor_name: string;
  visitor_type: string;
  entry_time: string;
  exit_time?: string;
  purpose?: string;
  color_code: string;
  apartment_id: string;
  employee_id: string;
}

interface VisitorAccessStats {
  month: number;
  year: number;
  total_visits: number;
  stats_by_type: Record<string, { count: number; color: string }>;
  visits: Visitor[];
}

const VISITOR_TYPES = [
  { value: 'family', label: 'Familia', color: '#FF6B6B' },
  { value: 'friend', label: 'Amigo', color: '#4ECDC4' },
  { value: 'business', label: 'Negocio', color: '#45B7D1' },
  { value: 'maintenance', label: 'Mantenimiento', color: '#F7B731' },
  { value: 'inspection', label: 'Inspección', color: '#5F27CD' },
  { value: 'delivery', label: 'Entrega', color: '#00D2D3' },
  { value: 'other', label: 'Otro', color: '#95E1D3' }
];

export default function VisitorTracking({
  apartmentId,
  employeeId,
  apartmentCode
}: {
  apartmentId?: string;
  employeeId?: string;
  apartmentCode?: string;
}) {
  const [visitorStats, setVisitorStats] = useState<VisitorAccessStats | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [showNewVisitForm, setShowNewVisitForm] = useState(false);
  const [formData, setFormData] = useState({
    visitor_name: '',
    visitor_type: 'other',
    purpose: '',
    entry_time: new Date().toISOString().slice(0, 16)
  });

  // Fetch visitor statistics
  const fetchVisitorStats = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });

      let url = `/api/visitors/stats/monthly?${params}`;
      if (apartmentId) {
        url = `/api/visitors/apartment/${apartmentId}?month=${selectedMonth}&year=${selectedYear}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVisitorStats(data);
      }
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitorStats();
  }, [selectedMonth, selectedYear, apartmentId]);

  // Handle new visit form submission
  const handleAddVisitor = async () => {
    if (!formData.visitor_name || !apartmentId || !employeeId) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    try {
      const payload = {
        apartment_id: apartmentId,
        employee_id: employeeId,
        visitor_name: formData.visitor_name,
        visitor_type: formData.visitor_type,
        purpose: formData.purpose,
        entry_time: new Date(formData.entry_time).toISOString()
      };

      const response = await fetch('/api/visitors/accesses/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setFormData({
          visitor_name: '',
          visitor_type: 'other',
          purpose: '',
          entry_time: new Date().toISOString().slice(0, 16)
        });
        setShowNewVisitForm(false);
        fetchVisitorStats();
      }
    } catch (error) {
      console.error('Error adding visitor:', error);
      alert('Error al registrar visitante');
    }
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get visitor type label
  const getVisitorTypeLabel = (type: string) => {
    return VISITOR_TYPES.find(v => v.value === type)?.label || type;
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <User className="w-6 h-6 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Registro de Visitantes</h2>
            {apartmentCode && <p className="text-sm text-gray-500">Apartamento: {apartmentCode}</p>}
          </div>
        </div>
        {apartmentId && employeeId && (
          <button
            onClick={() => setShowNewVisitForm(!showNewVisitForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Nueva Visita
          </button>
        )}
      </div>

      {/* New Visit Form */}
      {showNewVisitForm && apartmentId && employeeId && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Registrar Nueva Visita</h3>
          <div className="space-y-4">
            {/* Visitor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre del Visitante
              </label>
              <input
                type="text"
                value={formData.visitor_name}
                onChange={(e) => setFormData({ ...formData, visitor_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Juan García"
              />
            </div>

            {/* Visitor Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Visitante
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {VISITOR_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setFormData({ ...formData, visitor_type: type.value })}
                    className={`p-2 rounded-lg text-sm font-medium transition flex items-center gap-1 ${
                      formData.visitor_type === type.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: type.color }}
                    />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Propósito (Opcional)
              </label>
              <input
                type="text"
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Reunión de trabajo"
              />
            </div>

            {/* Entry Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora de Entrada
              </label>
              <input
                type="datetime-local"
                value={formData.entry_time}
                onChange={(e) => setFormData({ ...formData, entry_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleAddVisitor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Registrar Visita
              </button>
              <button
                onClick={() => setShowNewVisitForm(false)}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month & Year Selector */}
      <div className="flex gap-4 items-center bg-white p-4 rounded-xl border border-gray-200">
        <Calendar className="w-5 h-5 text-gray-600" />
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {months.map((month, index) => (
            <option key={index} value={index + 1}>
              {month}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {[2023, 2024, 2025, 2026].map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <button
          onClick={fetchVisitorStats}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
        >
          {loading ? 'Cargando...' : 'Filtrar'}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {visitorStats && !loading && (
        <>
          {/* Statistics Overview */}
          {visitorStats.stats_by_type && Object.keys(visitorStats.stats_by_type).length > 0 && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-xl border border-slate-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Resumen del Mes ({months[selectedMonth - 1]} {selectedYear})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-lg border border-slate-200">
                  <p className="text-2xl font-bold text-blue-600">{visitorStats.total_visits}</p>
                  <p className="text-sm text-gray-600">Total de Visitas</p>
                </div>
                {Object.entries(visitorStats.stats_by_type).map(([type, stats]) => (
                  <div key={type} className="bg-white p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: (stats as any).color }}
                      />
                      <p className="text-sm font-medium text-gray-700">{getVisitorTypeLabel(type)}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{(stats as any).count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visitors List */}
          {visitorStats.visits && visitorStats.visits.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">
                  Visitas Registradas ({visitorStats.visits.length})
                </h3>
              </div>
              <div className="divide-y">
                {visitorStats.visits.map((visit, index) => (
                  <div
                    key={visit.id || index}
                    className="p-6 hover:bg-blue-50 transition border-l-4"
                    style={{ borderLeftColor: visit.color_code }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Visitor Name & Type */}
                      <div className="flex items-start gap-3">
                        <div
                          className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                          style={{ backgroundColor: visit.color_code }}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{visit.visitor_name}</p>
                          <p className="text-sm text-gray-500">
                            <Tag className="w-3 h-3 inline mr-1" />
                            {getVisitorTypeLabel(visit.visitor_type)}
                          </p>
                        </div>
                      </div>

                      {/* Entry & Exit Times */}
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-gray-600">
                            Entrada: <span className="font-semibold">{formatDateTime(visit.entry_time)}</span>
                          </p>
                          {visit.exit_time && (
                            <p className="text-sm text-gray-600">
                              Salida: <span className="font-semibold">{formatDateTime(visit.exit_time)}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Purpose & Actions */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {visit.purpose && (
                            <p className="text-sm text-gray-600">
                              <MapPin className="w-3 h-3 inline mr-1" />
                              {visit.purpose}
                            </p>
                          )}
                        </div>
                        {/* Delete button could be added here */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(!visitorStats.visits || visitorStats.visits.length === 0) && (
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
              <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">
                No hay visitas registradas para {months[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
