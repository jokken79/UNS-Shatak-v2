"use client";
import { useState, useRef } from "react";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { importFactories, importEmployees, getImportLogs, getImportTemplate } from "@/lib/api";
import { Upload, FileSpreadsheet, Users, Factory, CheckCircle, XCircle, Download, History } from "lucide-react";
import { useEffect } from "react";

interface ImportLog {
  id: string;
  import_type: string;
  file_name: string;
  total_rows: number;
  successful_rows: number;
  failed_rows: number;
  created_at: string;
}

export default function ImportPage() {
  const [importing, setImporting] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [logs, setLogs] = useState<ImportLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const factoryInputRef = useRef<HTMLInputElement>(null);
  const employeeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getImportLogs().then(res => setLogs(res.data)).catch(console.error);
  }, [result]);

  const handleImport = async (type: "factories" | "employees", file: File) => {
    setImporting(type);
    setResult(null);
    try {
      const res = type === "factories" ? await importFactories(file) : await importEmployees(file);
      setResult({ type, ...res.data });
    } catch (err: any) {
      setResult({ type, error: err.response?.data?.detail || "Import failed" });
    } finally {
      setImporting(null);
    }
  };

  const downloadTemplate = async (type: string) => {
    try {
      const res = await getImportTemplate(type);
      const data = res.data;
      const csv = data.columns.map((c: any) => c.name || c).join(",") + "\n" + 
                  Object.values(data.example).join(",");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}_template.csv`;
      a.click();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Data</h1>
        <p className="text-gray-500">インポート - Import employees and factories from Excel/CSV</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Factories Import */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <CardTitle>Import Factories</CardTitle>
                <CardDescription>派遣先をインポート</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Upload Excel (.xlsx) or CSV file with factory data.</p>
            <p className="text-xs text-gray-400">Required columns: factory_code, name</p>
            <input type="file" ref={factoryInputRef} accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImport("factories", e.target.files[0])} />
            <div className="flex gap-2">
              <Button onClick={() => factoryInputRef.current?.click()} disabled={importing === "factories"} className="flex-1">
                {importing === "factories" ? <><span className="animate-spin mr-2">⏳</span> Importing...</> : <><Upload className="w-4 h-4 mr-2" /> Upload File</>}
              </Button>
              <Button variant="outline" onClick={() => downloadTemplate("factories")}><Download className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>

        {/* Employees Import */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <CardTitle>Import Employees</CardTitle>
                <CardDescription>従業員をインポート</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">Upload Excel (.xlsx) or CSV file with employee data.</p>
            <p className="text-xs text-gray-400">Required columns: employee_code, full_name_roman</p>
            <input type="file" ref={employeeInputRef} accept=".xlsx,.xls,.csv" className="hidden"
              onChange={(e) => e.target.files?.[0] && handleImport("employees", e.target.files[0])} />
            <div className="flex gap-2">
              <Button onClick={() => employeeInputRef.current?.click()} disabled={importing === "employees"} className="flex-1">
                {importing === "employees" ? <><span className="animate-spin mr-2">⏳</span> Importing...</> : <><Upload className="w-4 h-4 mr-2" /> Upload File</>}
              </Button>
              <Button variant="outline" onClick={() => downloadTemplate("employees")}><Download className="w-4 h-4" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Result */}
      {result && (
        <Card className={result.error ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
          <CardContent className="p-6">
            {result.error ? (
              <div className="flex items-center gap-3 text-red-600">
                <XCircle className="w-6 h-6" />
                <div>
                  <p className="font-medium">Import Failed</p>
                  <p className="text-sm">{result.error}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-green-600">
                  <CheckCircle className="w-6 h-6" />
                  <div>
                    <p className="font-medium">Import Completed - {result.type}</p>
                    <p className="text-sm">Successfully imported {result.successful_rows} of {result.total_rows} rows</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold">{result.total_rows}</p>
                    <p className="text-xs text-gray-500">Total Rows</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{result.successful_rows}</p>
                    <p className="text-xs text-gray-500">Successful</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{result.failed_rows}</p>
                    <p className="text-xs text-gray-500">Failed</p>
                  </div>
                </div>
                {result.errors?.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-red-600 mb-2">Errors:</p>
                    <div className="max-h-32 overflow-auto bg-white rounded p-2 text-xs">
                      {result.errors.map((e: any, i: number) => (
                        <div key={i} className="text-red-600">Row {e.row}: {e.error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Import History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-gray-500" />
            <CardTitle>Import History</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowLogs(!showLogs)}>
            {showLogs ? "Hide" : "Show"}
          </Button>
        </CardHeader>
        {showLogs && (
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell><Badge variant={log.import_type === "factories" ? "secondary" : "default"}>{log.import_type}</Badge></TableCell>
                    <TableCell className="text-sm">{log.file_name}</TableCell>
                    <TableCell>
                      <span className="text-green-600">{log.successful_rows}</span>
                      <span className="text-gray-400"> / </span>
                      <span>{log.total_rows}</span>
                      {log.failed_rows > 0 && <span className="text-red-600 ml-1">({log.failed_rows} failed)</span>}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{new Date(log.created_at).toLocaleString("ja-JP")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
