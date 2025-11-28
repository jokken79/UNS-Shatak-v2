"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { createEmployee, getFactories } from "@/lib/api";
import { ArrowLeft, Save, Users } from "lucide-react";

export default function NewEmployeePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [factories, setFactories] = useState<any[]>([]);
  const [form, setForm] = useState({
    employee_code: "", full_name_roman: "", full_name_kanji: "", full_name_furigana: "",
    nationality: "", date_of_birth: "", gender: "", phone: "", email: "", address: "",
    visa_type: "", visa_expiry: "", employment_start_date: "", contract_type: "dispatch",
    hourly_rate: "", factory_id: "", notes: "",
  });

  useEffect(() => {
    getFactories().then(res => setFactories(res.data)).catch(console.error);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data: any = { employee_code: form.employee_code, full_name_roman: form.full_name_roman, status: "active" };
      if (form.full_name_kanji) data.full_name_kanji = form.full_name_kanji;
      if (form.full_name_furigana) data.full_name_furigana = form.full_name_furigana;
      if (form.nationality) data.nationality = form.nationality;
      if (form.date_of_birth) data.date_of_birth = form.date_of_birth;
      if (form.gender) data.gender = form.gender;
      if (form.phone) data.phone = form.phone;
      if (form.email) data.email = form.email;
      if (form.address) data.address = form.address;
      if (form.visa_type) data.visa_type = form.visa_type;
      if (form.visa_expiry) data.visa_expiry = form.visa_expiry;
      if (form.employment_start_date) data.employment_start_date = form.employment_start_date;
      if (form.contract_type) data.contract_type = form.contract_type;
      if (form.hourly_rate) data.hourly_rate = parseFloat(form.hourly_rate);
      if (form.factory_id) data.factory_id = form.factory_id;
      if (form.notes) data.notes = form.notes;

      await createEmployee(data);
      router.push("/dashboard/employees");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error creating employee");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/employees"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">New Employee</h1>
          <p className="text-gray-500">新規従業員登録</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" /> Basic Info / 基本情報</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Code * / 社員番号</Label><Input name="employee_code" value={form.employee_code} onChange={handleChange} placeholder="EMP001" required /></div>
            <div className="space-y-2 md:col-span-2"><Label>Full Name (Roman) * / ローマ字</Label><Input name="full_name_roman" value={form.full_name_roman} onChange={handleChange} placeholder="NGUYEN VAN ANH" required /></div>
            <div className="space-y-2"><Label>Full Name (Kanji) / 漢字</Label><Input name="full_name_kanji" value={form.full_name_kanji} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Full Name (Furigana) / フリガナ</Label><Input name="full_name_furigana" value={form.full_name_furigana} onChange={handleChange} /></div>
            <div className="space-y-2"><Label>Nationality / 国籍</Label><Input name="nationality" value={form.nationality} onChange={handleChange} placeholder="Vietnamese" /></div>
            <div className="space-y-2"><Label>Date of Birth / 生年月日</Label><Input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} /></div>
            <div className="space-y-2">
              <Label>Gender / 性別</Label>
              <select name="gender" value={form.gender} onChange={handleChange} className="w-full h-9 px-3 border rounded-md">
                <option value="">Select</option>
                <option value="Male">Male / 男性</option>
                <option value="Female">Female / 女性</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Phone / 電話</Label><Input name="phone" value={form.phone} onChange={handleChange} placeholder="080-1234-5678" /></div>
            <div className="space-y-2"><Label>Email</Label><Input name="email" type="email" value={form.email} onChange={handleChange} /></div>
            <div className="space-y-2 md:col-span-3"><Label>Address / 住所</Label><Input name="address" value={form.address} onChange={handleChange} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📋 Visa / 在留資格</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Visa Type / 在留資格</Label><Input name="visa_type" value={form.visa_type} onChange={handleChange} placeholder="技能実習2号" /></div>
            <div className="space-y-2"><Label>Visa Expiry / 在留期限</Label><Input name="visa_expiry" type="date" value={form.visa_expiry} onChange={handleChange} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>💼 Employment / 雇用情報</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Start Date / 入社日</Label><Input name="employment_start_date" type="date" value={form.employment_start_date} onChange={handleChange} /></div>
            <div className="space-y-2">
              <Label>Contract Type / 契約種別</Label>
              <select name="contract_type" value={form.contract_type} onChange={handleChange} className="w-full h-9 px-3 border rounded-md">
                <option value="dispatch">Dispatch / 派遣</option>
                <option value="contract">Contract / 契約</option>
                <option value="permanent">Permanent / 正社員</option>
                <option value="part_time">Part-time / パート</option>
              </select>
            </div>
            <div className="space-y-2"><Label>Hourly Rate / 時給 (¥)</Label><Input name="hourly_rate" type="number" value={form.hourly_rate} onChange={handleChange} placeholder="1200" /></div>
            <div className="space-y-2 md:col-span-3">
              <Label>Factory / 派遣先</Label>
              <select name="factory_id" value={form.factory_id} onChange={handleChange} className="w-full h-9 px-3 border rounded-md">
                <option value="">Select factory...</option>
                {factories.map(f => <option key={f.id} value={f.id}>{f.factory_code} - {f.name}</option>)}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📝 Notes / 備考</CardTitle></CardHeader>
          <CardContent>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg" />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1"><Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Create Employee"}</Button>
          <Link href="/dashboard/employees"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
