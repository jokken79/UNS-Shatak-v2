'use client';

import React, { useState } from 'react';
import { Download, FileText, Table2, Loader } from 'lucide-react';

interface ExportOccupancyProps {
  apartmentId?: string;
  month?: number;
  year?: number;
}

export default function ExportOccupancy({ apartmentId, month, year }: ExportOccupancyProps) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'csv' | 'excel'>('excel');

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();

      if (apartmentId) params.append('apartment_id', apartmentId);
      if (month) params.append('month', month.toString());
      if (year) params.append('year', year.toString());

      const endpoint = format === 'csv'
        ? `/api/export/occupancy/csv?${params}`
        : `/api/export/occupancy/excel?${params}`;

      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Export failed');

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = format === 'csv'
        ? `occupancy_${new Date().toISOString().split('T')[0]}.csv`
        : `occupancy_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting:', error);
      alert('Error al exportar datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            Exportar Datos de Ocupación
          </h3>
          <p className="text-gray-600 text-sm mt-1">
            Descarga la información completa de residentes (incluye ID del empleado, color, estado)
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Formato de Exportación
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('excel')}
              className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                format === 'excel'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <Table2 className={`w-5 h-5 ${format === 'excel' ? 'text-blue-600' : 'text-gray-600'}`} />
              <div className="text-left">
                <p className={`font-medium ${format === 'excel' ? 'text-blue-600' : 'text-gray-700'}`}>
                  Excel (.xlsx)
                </p>
                <p className="text-xs text-gray-600">Con colores y formato</p>
              </div>
            </button>

            <button
              onClick={() => setFormat('csv')}
              className={`p-4 rounded-lg border-2 transition flex items-center gap-3 ${
                format === 'csv'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
              }`}
            >
              <FileText className={`w-5 h-5 ${format === 'csv' ? 'text-blue-600' : 'text-gray-600'}`} />
              <div className="text-left">
                <p className={`font-medium ${format === 'csv' ? 'text-blue-600' : 'text-gray-700'}`}>
                  CSV (.csv)
                </p>
                <p className="text-xs text-gray-600">Texto delimitado</p>
              </div>
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            📊 <strong>Datos incluidos:</strong>
          </p>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4">
            <li>✓ Código y nombre del apartamento</li>
            <li>✓ Código e ID del empleado</li>
            <li>✓ Nombre (Romaji y Kanji)</li>
            <li>✓ Email y teléfono</li>
            <li>✓ Fábrica asignada</li>
            <li>✓ Fecha de ingreso/salida</li>
            <li>✓ Estado (Actual/Nuevo)</li>
            <li>✓ Color asignado</li>
            <li>✓ Renta mensual</li>
          </ul>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className={`w-full py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            loading
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Generando {format === 'excel' ? 'Excel' : 'CSV'}...
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              Descargar {format === 'excel' ? 'Excel' : 'CSV'}
            </>
          )}
        </button>

        {/* Note */}
        <p className="text-xs text-gray-500 text-center">
          Los archivos Excel incluyen residentes nuevos con fondo verde para fácil identificación
        </p>
      </div>
    </div>
  );
}
