"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { getEmployees, deleteEmployee } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Building2, Eye } from "lucide-react";

interface Employee {
  id: string;
  employee_code: string;
  full_name_roman: string;
  full_name_kanji: string;
  nationality: string;
  phone: string;
  status: string;
  contract_type: string;
  factory?: { name: string };
  apartment?: { name: string };
}

const statusColors: Record<string, string> = { active: "success", on_leave: "warning", terminated: "destructive", pending: "secondary" };
const statusLabels: Record<string, string> = { active: "在籍", on_leave: "休職", terminated: "退職", pending: "入社予定" };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchEmployees = () => {
    setLoading(true);
    getEmployees({ search: search || undefined })
      .then((res) => setEmployees(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchEmployees(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchEmployees(); };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete employee "${name}"?`)) return;
    try { await deleteEmployee(id); fetchEmployees(); } 
    catch (err: any) { alert(err.response?.data?.detail || "Error deleting"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-gray-500">従業員管理</p>
        </div>
        <Link href="/dashboard/employees/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Add Employee</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No employees found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Nationality</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Factory</TableHead>
                  <TableHead>Apartment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-mono text-sm">{emp.employee_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{emp.full_name_roman}</div>
                      <div className="text-xs text-gray-500">{emp.full_name_kanji}</div>
                    </TableCell>
                    <TableCell>{emp.nationality || "-"}</TableCell>
                    <TableCell>{emp.phone || "-"}</TableCell>
                    <TableCell>{emp.factory?.name || <span className="text-gray-400">-</span>}</TableCell>
                    <TableCell>
                      {emp.apartment ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <Building2 className="w-3 h-3" />
                          <span className="text-xs">{emp.apartment.name}</span>
                        </div>
                      ) : <span className="text-gray-400">No housing</span>}
                    </TableCell>
                    <TableCell><Badge variant={statusColors[emp.status] as any}>{statusLabels[emp.status] || emp.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/employees/${emp.id}`}><Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button></Link>
                        <Link href={`/dashboard/employees/${emp.id}/edit`}><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id, emp.full_name_roman)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
