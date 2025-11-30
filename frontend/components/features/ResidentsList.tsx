'use client';

import React, { useState, useEffect } from 'react';
import { Star, Users, MapPin, Zap, Calendar, Badge } from 'lucide-react';

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

interface ResidentsListProps {
  apartmentId: string;
  apartmentCode: string;
  residents: Resident[];
  capacity: number;
  currentOccupants: number;
}

const isRecentMove = (moveInDate: string) => {
  const moveDate = new Date(moveInDate);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - moveDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 30;
};

export default function ResidentsList({
  apartmentId,
  apartmentCode,
  residents,
  capacity,
  currentOccupants
}: ResidentsListProps) {
  const [expandedResidents, setExpandedResidents] = useState<Set<string>>(new Set());
  const occupancyRate = capacity > 0 ? Math.round((currentOccupants / capacity) * 100) : 0;
  const isFull = occupancyRate >= 100;
  const isAlmostFull = occupancyRate >= 75;

  const toggleResident = (residentId: string) => {
    setExpandedResidents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(residentId)) {
        newSet.delete(residentId);
      } else {
        newSet.add(residentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Separar residentes nuevos y antiguos
  const newResidents = residents.filter(r => isRecentMove(r.move_in_date));
  const oldResidents = residents.filter(r => !isRecentMove(r.move_in_date));

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
      {/* Header del apartamento */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold flex items-center gap-2">
              {apartmentCode}
              {isFull && <Badge className="bg-red-500 text-white text-xs">Lleno</Badge>}
            </h3>
            <p className="text-blue-100 mt-1 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {residents.length > 0 && residents[0].factory?.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold">{occupancyRate}%</p>
            <p className="text-blue-100 text-sm">
              {currentOccupants}/{capacity} ocupados
            </p>
          </div>
        </div>

        {/* Barra de ocupación */}
        <div className="mt-4 w-full bg-blue-400 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all ${
              isFull ? 'bg-red-500' : isAlmostFull ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Residentes Nuevos */}
      {newResidents.length > 0 && (
        <div className="p-6 bg-gradient-to-b from-emerald-50 to-transparent border-b-2 border-emerald-200">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-emerald-600 fill-emerald-600" />
            <h4 className="font-semibold text-emerald-900">Residentes Nuevos (últimos 30 días)</h4>
            <span className="ml-auto bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {newResidents.length}
            </span>
          </div>

          <div className="space-y-2">
            {newResidents.map((resident) => (
              <div
                key={resident.id}
                className="p-4 rounded-lg border-l-4 transition-all"
                style={{
                  borderLeftColor: resident.assigned_color,
                  backgroundColor: resident.assigned_color + '15'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: resident.assigned_color }}
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {resident.full_name_roman}
                          {resident.full_name_kanji && (
                            <span className="text-gray-600 ml-2">({resident.full_name_kanji})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Ingreso: {formatDate(resident.move_in_date)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      NUEVO
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Residentes Actuales */}
      {oldResidents.length > 0 && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Residentes Actuales</h4>
            <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {oldResidents.length}
            </span>
          </div>

          <div className="space-y-2">
            {oldResidents.map((resident) => (
              <div
                key={resident.id}
                className="p-4 rounded-lg border-l-4 transition-all hover:bg-gray-50"
                style={{
                  borderLeftColor: resident.assigned_color,
                  backgroundColor: resident.assigned_color + '10'
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: resident.assigned_color }}
                      />
                      <div>
                        <p className="font-medium text-gray-800">
                          {resident.full_name_roman}
                          {resident.full_name_kanji && (
                            <span className="text-gray-600 text-sm ml-2">({resident.full_name_kanji})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {resident.employee_code}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(resident.move_in_date)}
                    </p>
                    {resident.status && (
                      <span className="inline-block mt-1 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                        {resident.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sin residentes */}
      {residents.length === 0 && (
        <div className="p-12 text-center text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No hay residentes en este apartamento</p>
        </div>
      )}
    </div>
  );
}
