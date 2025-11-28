"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { getFactories, deleteFactory } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Users, Eye } from "lucide-react";

interface Factory {
  id: string;
  factory_code: string;
  name: string;
  name_japanese: string;
  city: string;
  prefecture: string;
  phone: string;
  contact_person: string;
  employee_count: number;
}

export default function FactoriesPage() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchFactories = () => {
    setLoading(true);
    getFactories({ search: search || undefined })
      .then((res) => setFactories(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFactories(); }, []);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchFactories(); };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete factory "${name}"?`)) return;
    try { await deleteFactory(id); fetchFactories(); } 
    catch (err: any) { alert(err.response?.data?.detail || "Error deleting"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factories</h1>
          <p className="text-gray-500">派遣先管理</p>
        </div>
        <Link href="/dashboard/factories/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Add Factory</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search factories..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
          ) : factories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No factories found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {factories.map((fac) => (
                  <TableRow key={fac.id}>
                    <TableCell className="font-mono text-sm">{fac.factory_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{fac.name}</div>
                      <div className="text-xs text-gray-500">{fac.name_japanese}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{fac.city || "-"}</div>
                      <div className="text-xs text-gray-500">{fac.prefecture}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{fac.contact_person || "-"}</div>
                      <div className="text-xs text-gray-500">{fac.phone}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{fac.employee_count || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/factories/${fac.id}`}><Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button></Link>
                        <Link href={`/dashboard/factories/${fac.id}/edit`}><Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button></Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fac.id, fac.name)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
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
