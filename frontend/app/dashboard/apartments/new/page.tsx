"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { createApartment } from "@/lib/api";
import { ArrowLeft, Save, Building2 } from "lucide-react";

export default function NewApartmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    apartment_code: "",
    name: "",
    address: "",
    city: "",
    prefecture: "",
    postal_code: "",
    building_name: "",
    room_number: "",
    floor: "",
    area_sqm: "",
    num_rooms: "1",
    monthly_rent: "",
    deposit: "",
    key_money: "",
    management_fee: "",
    parking_fee: "",
    utilities_included: false,
    internet_included: false,
    parking_included: false,
    nearest_station: "",
    walking_minutes: "",
    landlord_name: "",
    landlord_phone: "",
    landlord_company: "",
    capacity: "2",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data: any = {
        apartment_code: form.apartment_code,
        name: form.name,
        address: form.address,
        status: "available",
      };

      // Add optional fields if filled
      if (form.city) data.city = form.city;
      if (form.prefecture) data.prefecture = form.prefecture;
      if (form.postal_code) data.postal_code = form.postal_code;
      if (form.building_name) data.building_name = form.building_name;
      if (form.room_number) data.room_number = form.room_number;
      if (form.floor) data.floor = parseInt(form.floor);
      if (form.area_sqm) data.area_sqm = parseFloat(form.area_sqm);
      if (form.num_rooms) data.num_rooms = parseInt(form.num_rooms);
      if (form.monthly_rent) data.monthly_rent = parseFloat(form.monthly_rent);
      if (form.deposit) data.deposit = parseFloat(form.deposit);
      if (form.key_money) data.key_money = parseFloat(form.key_money);
      if (form.management_fee) data.management_fee = parseFloat(form.management_fee);
      if (form.parking_fee) data.parking_fee = parseFloat(form.parking_fee);
      if (form.nearest_station) data.nearest_station = form.nearest_station;
      if (form.walking_minutes) data.walking_minutes = parseInt(form.walking_minutes);
      if (form.landlord_name) data.landlord_name = form.landlord_name;
      if (form.landlord_phone) data.landlord_phone = form.landlord_phone;
      if (form.landlord_company) data.landlord_company = form.landlord_company;
      if (form.capacity) data.capacity = parseInt(form.capacity);
      if (form.notes) data.notes = form.notes;
      
      data.utilities_included = form.utilities_included;
      data.internet_included = form.internet_included;
      data.parking_included = form.parking_included;

      await createApartment(data);
      router.push("/dashboard/apartments");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error creating apartment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/apartments">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">New Apartment</h1>
          <p className="text-gray-500">新規社宅登録</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Basic Information / 基本情報
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apartment_code">Code * / コード</Label>
              <Input id="apartment_code" name="apartment_code" value={form.apartment_code} onChange={handleChange} placeholder="APT001" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">Name * / 名前</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="社宅A-101" required />
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label htmlFor="address">Address * / 住所</Label>
              <Input id="address" name="address" value={form.address} onChange={handleChange} placeholder="1-2-3 Minami-cho" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City / 市区町村</Label>
              <Input id="city" name="city" value={form.city} onChange={handleChange} placeholder="Kariya" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prefecture">Prefecture / 都道府県</Label>
              <Input id="prefecture" name="prefecture" value={form.prefecture} onChange={handleChange} placeholder="Aichi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code / 郵便番号</Label>
              <Input id="postal_code" name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="448-0001" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="building_name">Building / 建物名</Label>
              <Input id="building_name" name="building_name" value={form.building_name} onChange={handleChange} placeholder="UNS Heights A" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="room_number">Room # / 部屋番号</Label>
              <Input id="room_number" name="room_number" value={form.room_number} onChange={handleChange} placeholder="101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor / 階</Label>
              <Input id="floor" name="floor" type="number" value={form.floor} onChange={handleChange} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area_sqm">Area (m²) / 面積</Label>
              <Input id="area_sqm" name="area_sqm" type="number" step="0.1" value={form.area_sqm} onChange={handleChange} placeholder="25.5" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="num_rooms">Rooms / 部屋数</Label>
              <Input id="num_rooms" name="num_rooms" type="number" value={form.num_rooms} onChange={handleChange} placeholder="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity / 定員</Label>
              <Input id="capacity" name="capacity" type="number" value={form.capacity} onChange={handleChange} placeholder="2" />
            </div>
          </CardContent>
        </Card>

        {/* Costs */}
        <Card>
          <CardHeader>
            <CardTitle>💰 Costs / 費用</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthly_rent">Monthly Rent / 家賃 (¥)</Label>
              <Input id="monthly_rent" name="monthly_rent" type="number" value={form.monthly_rent} onChange={handleChange} placeholder="45000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit / 敷金 (¥)</Label>
              <Input id="deposit" name="deposit" type="number" value={form.deposit} onChange={handleChange} placeholder="90000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="key_money">Key Money / 礼金 (¥)</Label>
              <Input id="key_money" name="key_money" type="number" value={form.key_money} onChange={handleChange} placeholder="45000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="management_fee">Management Fee / 管理費 (¥)</Label>
              <Input id="management_fee" name="management_fee" type="number" value={form.management_fee} onChange={handleChange} placeholder="5000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parking_fee">Parking Fee / 駐車場 (¥)</Label>
              <Input id="parking_fee" name="parking_fee" type="number" value={form.parking_fee} onChange={handleChange} placeholder="3000" />
            </div>
          </CardContent>
        </Card>

        {/* Includes */}
        <Card>
          <CardHeader>
            <CardTitle>✅ Included / 含む</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="utilities_included" checked={form.utilities_included} onChange={handleChange} className="w-4 h-4" />
              <span>Utilities / 光熱費</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="internet_included" checked={form.internet_included} onChange={handleChange} className="w-4 h-4" />
              <span>Internet / インターネット</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="parking_included" checked={form.parking_included} onChange={handleChange} className="w-4 h-4" />
              <span>Parking / 駐車場</span>
            </label>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle>🚃 Access / アクセス</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nearest_station">Nearest Station / 最寄り駅</Label>
              <Input id="nearest_station" name="nearest_station" value={form.nearest_station} onChange={handleChange} placeholder="Kariya Station" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="walking_minutes">Walking (min) / 徒歩(分)</Label>
              <Input id="walking_minutes" name="walking_minutes" type="number" value={form.walking_minutes} onChange={handleChange} placeholder="10" />
            </div>
          </CardContent>
        </Card>

        {/* Landlord */}
        <Card>
          <CardHeader>
            <CardTitle>🏢 Landlord / 大家・管理会社</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="landlord_name">Name / 名前</Label>
              <Input id="landlord_name" name="landlord_name" value={form.landlord_name} onChange={handleChange} placeholder="Yamada Taro" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landlord_phone">Phone / 電話</Label>
              <Input id="landlord_phone" name="landlord_phone" value={form.landlord_phone} onChange={handleChange} placeholder="0566-12-3456" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="landlord_company">Company / 会社</Label>
              <Input id="landlord_company" name="landlord_company" value={form.landlord_company} onChange={handleChange} placeholder="ABC不動産" />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>📝 Notes / 備考</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Additional notes..." />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Create Apartment / 登録"}
          </Button>
          <Link href="/dashboard/apartments">
            <Button type="button" variant="outline">Cancel / キャンセル</Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
