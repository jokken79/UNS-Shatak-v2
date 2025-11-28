"use client"

import { useState, useEffect } from "react"
import {
  Database, Table, Download, Upload, Trash2, Edit, Plus,
  RefreshCw, Search, ChevronLeft, ChevronRight, X, Save,
  FileJson, FileSpreadsheet, AlertTriangle, CheckCircle
} from "lucide-react"
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from "@/components/ui"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8100"

interface TableInfo {
  name: string
  display_name: string
  model: string
}

interface ColumnInfo {
  name: string
  type: string
  nullable: boolean
  primary_key: boolean
  foreign_key: boolean
}

interface TableDetails {
  table_name: string
  columns: ColumnInfo[]
  total_records: number
}

export default function DataManagementPage() {
  const [tables, setTables] = useState<TableInfo[]>([])
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null)
  const [records, setRecords] = useState<any[]>([])
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize] = useState(20)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Modal states
  const [editingRecord, setEditingRecord] = useState<any | null>(null)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importResult, setImportResult] = useState<any | null>(null)

  const getToken = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token")
    }
    return null
  }

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const token = getToken()
    const headers = {
      ...options.headers,
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    }
    const response = await fetch(url, { ...options, headers })
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Error desconocido" }))
      throw new Error(error.detail || `Error ${response.status}`)
    }
    return response
  }

  // Cargar lista de tablas
  useEffect(() => {
    const loadTables = async () => {
      try {
        const res = await fetchWithAuth(`${API_URL}/api/data/tables`)
        const data = await res.json()
        setTables(data.tables)
      } catch (err: any) {
        setError(err.message)
      }
    }
    loadTables()
  }, [])

  // Cargar detalles de tabla seleccionada
  useEffect(() => {
    if (!selectedTable) return

    const loadTableDetails = async () => {
      setLoading(true)
      try {
        const res = await fetchWithAuth(`${API_URL}/api/data/tables/${selectedTable}`)
        const data = await res.json()
        setTableDetails(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadTableDetails()
  }, [selectedTable])

  // Cargar registros
  useEffect(() => {
    if (!selectedTable) return
    loadRecords()
  }, [selectedTable, currentPage, search])

  const loadRecords = async () => {
    if (!selectedTable) return
    setLoading(true)
    try {
      const params = new URLSearchParams({
        skip: String(currentPage * pageSize),
        limit: String(pageSize),
      })
      if (search) params.append("search", search)

      const res = await fetchWithAuth(`${API_URL}/api/data/tables/${selectedTable}/records?${params}`)
      const data = await res.json()
      setRecords(data.records)
      setTotalRecords(data.total)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (format: "json" | "csv") => {
    if (!selectedTable) return
    try {
      const token = getToken()
      const res = await fetch(`${API_URL}/api/data/tables/${selectedTable}/export?format=${format}`, {
        headers: { "Authorization": `Bearer ${token}` }
      })
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${selectedTable}_${new Date().toISOString().split("T")[0]}.${format}`
      a.click()
      setSuccess(`Exportado ${selectedTable} a ${format.toUpperCase()}`)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleImport = async (file: File, mode: "append" | "replace") => {
    if (!selectedTable) return
    setLoading(true)
    try {
      const token = getToken()
      const formData = new FormData()
      formData.append("file", file)

      const res = await fetch(`${API_URL}/api/data/tables/${selectedTable}/import?mode=${mode}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail)

      setImportResult(data)
      setSuccess(`Importados ${data.success} de ${data.total} registros`)
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleImportFromBasedatejp = async () => {
    setLoading(true)
    try {
      const res = await fetchWithAuth(`${API_URL}/api/data/import-from-basedatejp`, {
        method: "POST"
      })
      const data = await res.json()
      setImportResult(data.results)
      setSuccess("Importación desde BASEDATEJP completada")
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!selectedTable || !confirm("¿Eliminar este registro?")) return
    try {
      await fetchWithAuth(`${API_URL}/api/data/tables/${selectedTable}/records/${id}`, {
        method: "DELETE"
      })
      setSuccess("Registro eliminado")
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDeleteAll = async () => {
    if (!selectedTable) return
    if (!confirm(`¿ELIMINAR TODOS los registros de ${selectedTable}? Esta acción no se puede deshacer.`)) return
    if (!confirm("¿Estás SEGURO? Escribe 'ELIMINAR' para confirmar") || prompt("Escribe ELIMINAR:") !== "ELIMINAR") return

    try {
      const res = await fetchWithAuth(`${API_URL}/api/data/tables/${selectedTable}/records?confirm=true`, {
        method: "DELETE"
      })
      const data = await res.json()
      setSuccess(data.message)
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleSaveRecord = async () => {
    if (!selectedTable || !editingRecord) return
    setLoading(true)
    try {
      const isNew = !editingRecord.id
      const url = isNew
        ? `${API_URL}/api/data/tables/${selectedTable}/records`
        : `${API_URL}/api/data/tables/${selectedTable}/records/${editingRecord.id}`

      await fetchWithAuth(url, {
        method: isNew ? "POST" : "PUT",
        body: JSON.stringify(editingRecord)
      })
      setSuccess(isNew ? "Registro creado" : "Registro actualizado")
      setEditingRecord(null)
      loadRecords()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalRecords / pageSize)

  // Limpiar mensajes después de 5 segundos
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Database className="h-8 w-8" />
            Data Management / データ管理
          </h1>
          <p className="text-muted-foreground mt-1">
            Ver, editar, importar y exportar datos de todas las tablas
          </p>
        </div>
        <Button onClick={handleImportFromBasedatejp} disabled={loading}>
          <Upload className="h-4 w-4 mr-2" />
          Importar desde BASEDATEJP
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500 text-green-600 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {success}
          <button onClick={() => setSuccess(null)} className="ml-auto"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar - Lista de tablas */}
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Table className="h-5 w-5" />
                Tablas / テーブル
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {tables.map((table) => (
                  <button
                    key={table.name}
                    onClick={() => { setSelectedTable(table.name); setCurrentPage(0); setSearch(""); }}
                    className={`w-full px-4 py-3 text-left hover:bg-muted transition-colors ${
                      selectedTable === table.name ? "bg-primary/10 border-l-4 border-primary" : ""
                    }`}
                  >
                    <div className="font-medium">{table.display_name}</div>
                    <div className="text-xs text-muted-foreground">{table.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="col-span-9 space-y-4">
          {selectedTable && tableDetails ? (
            <>
              {/* Table info bar */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold">{selectedTable}</h2>
                      <p className="text-sm text-muted-foreground">
                        {tableDetails.total_records} registros | {tableDetails.columns.length} columnas
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                        <FileJson className="h-4 w-4 mr-1" /> JSON
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                        <FileSpreadsheet className="h-4 w-4 mr-1" /> CSV
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowImportModal(true)}>
                        <Upload className="h-4 w-4 mr-1" /> Importar
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingRecord({})}>
                        <Plus className="h-4 w-4 mr-1" /> Nuevo
                      </Button>
                      <Button variant="destructive" size="sm" onClick={handleDeleteAll}>
                        <Trash2 className="h-4 w-4 mr-1" /> Vaciar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Search and refresh */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar... / 検索..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" onClick={loadRecords} disabled={loading}>
                  <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {/* Records table */}
              <Card>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        {tableDetails.columns.slice(0, 8).map((col) => (
                          <th key={col.name} className="px-3 py-2 text-left font-medium">
                            {col.name}
                            {col.primary_key && <Badge variant="secondary" className="ml-1 text-xs">PK</Badge>}
                          </th>
                        ))}
                        <th className="px-3 py-2 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {records.map((record, idx) => (
                        <tr key={record.id || idx} className="hover:bg-muted/50">
                          {tableDetails.columns.slice(0, 8).map((col) => (
                            <td key={col.name} className="px-3 py-2 max-w-[200px] truncate">
                              {record[col.name] === null ? (
                                <span className="text-muted-foreground italic">null</span>
                              ) : typeof record[col.name] === "boolean" ? (
                                record[col.name] ? "✓" : "✗"
                              ) : typeof record[col.name] === "object" ? (
                                <span className="text-xs text-muted-foreground">[JSON]</span>
                              ) : (
                                String(record[col.name]).substring(0, 50)
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right">
                            <Button variant="ghost" size="sm" onClick={() => setEditingRecord({...record})}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDelete(record.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {records.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-3 py-8 text-center text-muted-foreground">
                            No hay registros / レコードがありません
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </CardContent>
              </Card>

              {/* Pagination */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, totalRecords)} de {totalRecords}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p - 1)}
                    disabled={currentPage === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="px-3 py-1 text-sm">
                    {currentPage + 1} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Column info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Estructura de columnas / カラム構造</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {tableDetails.columns.map((col) => (
                      <div key={col.name} className="p-2 bg-muted rounded">
                        <div className="font-medium">{col.name}</div>
                        <div className="text-muted-foreground">{col.type}</div>
                        {col.nullable && <Badge variant="outline" className="text-xs mt-1">nullable</Badge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Selecciona una tabla</h3>
                <p className="text-muted-foreground">Elige una tabla de la lista para ver y gestionar sus datos</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingRecord && tableDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {editingRecord.id ? "Editar registro" : "Nuevo registro"}
                <Button variant="ghost" size="sm" onClick={() => setEditingRecord(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tableDetails.columns
                .filter(col => !["id", "created_at", "updated_at"].includes(col.name))
                .map((col) => (
                <div key={col.name}>
                  <label className="text-sm font-medium">{col.name}</label>
                  <Input
                    value={editingRecord[col.name] ?? ""}
                    onChange={(e) => setEditingRecord({
                      ...editingRecord,
                      [col.name]: e.target.value || null
                    })}
                    placeholder={col.type}
                    className="mt-1"
                  />
                </div>
              ))}
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSaveRecord} disabled={loading} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => setEditingRecord(null)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Importar a {selectedTable}
                <Button variant="ghost" size="sm" onClick={() => { setShowImportModal(false); setImportResult(null); }}>
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {importResult ? (
                <div className="space-y-2">
                  <div className="text-green-600 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Importación completada
                  </div>
                  <div className="text-sm">
                    <div>Total: {importResult.total}</div>
                    <div className="text-green-600">Exitosos: {importResult.success}</div>
                    <div className="text-red-600">Fallidos: {importResult.failed}</div>
                  </div>
                  {importResult.errors?.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 max-h-32 overflow-y-auto">
                      {importResult.errors.map((e: any, i: number) => (
                        <div key={i}>Fila {e.row}: {e.error}</div>
                      ))}
                    </div>
                  )}
                  <Button onClick={() => { setShowImportModal(false); setImportResult(null); }} className="w-full mt-4">
                    Cerrar
                  </Button>
                </div>
              ) : (
                <>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Arrastra un archivo JSON o CSV aquí
                    </p>
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleImport(file, "append")
                      }}
                      className="hidden"
                      id="import-file"
                    />
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => document.getElementById("import-file")?.click()}>
                        Agregar (append)
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = ".json,.csv"
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0]
                            if (file && confirm("Esto ELIMINARÁ todos los registros existentes antes de importar. ¿Continuar?")) {
                              handleImport(file, "replace")
                            }
                          }
                          input.click()
                        }}
                      >
                        Reemplazar todo
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
