"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, CardContent, Input, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui";
import { getApartments, deleteApartment } from "@/lib/api";
import { Plus, Search, Edit, Trash2, Users, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface Apartment {
  id: string;
  apartment_code: string;
  name: string;
  address: string;
  city: string;
  prefecture: string;
  building_name: string;
  room_number: string;
  monthly_rent: number;
  status: string;
  capacity: number;
  current_occupants: number;
}

const statusColors: Record<string, string> = {
  available: "success",
  occupied: "default",
  maintenance: "warning",
  reserved: "secondary",
};

const statusLabels: Record<string, string> = {
  available: "空室",
  occupied: "入居中",
  maintenance: "修繕中",
  reserved: "予約済",
};

export default function ApartmentsPage() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchApartments = () => {
    setLoading(true);
    getApartments({ search: search || undefined })
      .then((res) => setApartments(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchApartments(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApartments();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete apartment "${name}"?`)) return;
    try {
      await deleteApartment(id);
      fetchApartments();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Error deleting");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Apartments</h1>
          <p className="text-gray-500">社宅管理</p>
        </div>
        <Link href="/dashboard/apartments/new">
          <Button><Plus className="w-4 h-4 mr-2" /> Add Apartment</Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder="Search apartments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
          ) : apartments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No apartments found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Name / Building</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Occupancy</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apartments.map((apt) => (
                  <TableRow key={apt.id}>
                    <TableCell className="font-mono text-sm">{apt.apartment_code}</TableCell>
                    <TableCell>
                      <div className="font-medium">{apt.name}</div>
                      <div className="text-xs text-gray-500">{apt.building_name} {apt.room_number}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{apt.city}</div>
                      <div className="text-xs text-gray-500">{apt.prefecture}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(apt.monthly_rent)}</TableCell>
                    <TableCell>
                      <Badge variant={statusColors[apt.status] as any}>{statusLabels[apt.status] || apt.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{apt.current_occupants}/{apt.capacity}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/apartments/${apt.id}`}>
                          <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Link href={`/dashboard/apartments/${apt.id}/edit`}>
                          <Button variant="ghost" size="icon"><Edit className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(apt.id, apt.name)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
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
