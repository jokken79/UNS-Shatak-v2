"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label, Card, CardHeader, CardTitle, CardContent } from "@/components/ui";
import { createFactory } from "@/lib/api";
import { ArrowLeft, Save, Factory } from "lucide-react";

export default function NewFactoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    factory_code: "", name: "", name_japanese: "", address: "", city: "", prefecture: "",
    postal_code: "", phone: "", contact_person: "", contact_email: "", notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data: any = { factory_code: form.factory_code, name: form.name };
      if (form.name_japanese) data.name_japanese = form.name_japanese;
      if (form.address) data.address = form.address;
      if (form.city) data.city = form.city;
      if (form.prefecture) data.prefecture = form.prefecture;
      if (form.postal_code) data.postal_code = form.postal_code;
      if (form.phone) data.phone = form.phone;
      if (form.contact_person) data.contact_person = form.contact_person;
      if (form.contact_email) data.contact_email = form.contact_email;
      if (form.notes) data.notes = form.notes;

      await createFactory(data);
      router.push("/dashboard/factories");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error creating factory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/factories"><Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">New Factory</h1>
          <p className="text-gray-500">新規派遣先登録</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Factory className="w-5 h-5" /> Basic Info / 基本情報</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Code * / コード</Label><Input name="factory_code" value={form.factory_code} onChange={handleChange} placeholder="FAC001" required /></div>
            <div className="space-y-2"><Label>Name * / 名前</Label><Input name="name" value={form.name} onChange={handleChange} placeholder="Toyota Kariya Plant" required /></div>
            <div className="space-y-2"><Label>Name (Japanese) / 日本語名</Label><Input name="name_japanese" value={form.name_japanese} onChange={handleChange} placeholder="トヨタ刈谷工場" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📍 Location / 所在地</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-3"><Label>Address / 住所</Label><Input name="address" value={form.address} onChange={handleChange} placeholder="1 Toyota-cho" /></div>
            <div className="space-y-2"><Label>City / 市区町村</Label><Input name="city" value={form.city} onChange={handleChange} placeholder="Kariya" /></div>
            <div className="space-y-2"><Label>Prefecture / 都道府県</Label><Input name="prefecture" value={form.prefecture} onChange={handleChange} placeholder="Aichi" /></div>
            <div className="space-y-2"><Label>Postal Code / 郵便番号</Label><Input name="postal_code" value={form.postal_code} onChange={handleChange} placeholder="448-8671" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📞 Contact / 連絡先</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2"><Label>Contact Person / 担当者</Label><Input name="contact_person" value={form.contact_person} onChange={handleChange} placeholder="Tanaka Taro" /></div>
            <div className="space-y-2"><Label>Phone / 電話</Label><Input name="phone" value={form.phone} onChange={handleChange} placeholder="0566-28-2121" /></div>
            <div className="space-y-2"><Label>Email</Label><Input name="contact_email" type="email" value={form.contact_email} onChange={handleChange} placeholder="tanaka@toyota.co.jp" /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>📝 Notes / 備考</CardTitle></CardHeader>
          <CardContent>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border rounded-lg" placeholder="Additional notes..." />
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1"><Save className="w-4 h-4 mr-2" /> {loading ? "Saving..." : "Create Factory"}</Button>
          <Link href="/dashboard/factories"><Button type="button" variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
