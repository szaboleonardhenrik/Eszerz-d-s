"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-store";
import toast from "react-hot-toast";

export default function ProfileSettings() {
  const { user, loadProfile } = useAuth();
  const [form, setForm] = useState({
    name: "",
    companyName: "",
    taxNumber: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        companyName: (user as any).companyName ?? "",
        taxNumber: (user as any).taxNumber ?? "",
        phone: (user as any).phone ?? "",
      });
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch("/auth/profile", form);
      await loadProfile();
      toast.success("Profil frissítve");
    } catch {
      toast.error("Hiba a mentéskor");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="bg-white rounded-xl border p-6 space-y-5">
        <h2 className="text-lg font-semibold text-gray-900">Személyes adatok</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teljes név</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefonszám</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="+36 30 123 4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email cím</label>
          <input
            value={user?.email ?? ""}
            disabled
            className="w-full px-4 py-2.5 border rounded-lg bg-gray-50 text-gray-500"
          />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 pt-4">Cégadatok</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cégnév</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adószám</label>
            <input
              value={form.taxNumber}
              onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
              className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="12345678-1-23"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "Mentés..." : "Mentés"}
          </button>
        </div>
      </div>
    </div>
  );
}
