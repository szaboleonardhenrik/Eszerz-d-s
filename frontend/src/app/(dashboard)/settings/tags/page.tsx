"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Tag {
  id: string;
  name: string;
  color: string;
  contracts: { contractId: string }[];
}

const presetColors = [
  "#EF4444", "#F97316", "#F59E0B", "#10B981", "#06B6D4",
  "#3B82F6", "#6366F1", "#8B5CF6", "#EC4899", "#6B7280",
];

export default function TagsSettingsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tags");
      setTags(res.data.data ?? []);
    } catch {
      toast.error("Hiba a címkék betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/tags", { name: newName.trim(), color: newColor });
      setNewName("");
      setNewColor("#3B82F6");
      toast.success("Címke létrehozva!");
      loadTags();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a létrehozáskor");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await api.put(`/tags/${id}`, { name: editName.trim(), color: editColor });
      setEditingId(null);
      toast.success("Címke frissítve!");
      loadTags();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a frissítéskor");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt a címkét? A szerződésekről is eltávolításra kerül.")) return;
    try {
      await api.delete(`/tags/${id}`);
      toast.success("Címke törölve!");
      loadTags();
    } catch {
      toast.error("Hiba a törléskor");
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-1">Címkék</h2>
      <p className="text-sm text-gray-500 mb-6">
        Hozz létre címkéket a szerződéseid rendszerezéséhez. A címkéket a dashboard-on és a szerződés részleteken tudod hozzárendelni.
      </p>

      {/* Create new tag */}
      <div className="bg-white rounded-xl border p-5 mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Új címke</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Név</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="pl. Fontos, Lejáró, Projekt A..."
              className="w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Szín</label>
            <div className="flex gap-1.5">
              {presetColors.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    newColor === c ? "ring-2 ring-offset-2 ring-gray-400 scale-110" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="px-5 py-2 rounded-lg text-sm font-medium text-white transition disabled:opacity-50"
            style={{ backgroundColor: "#198296" }}
          >
            {creating ? "Mentés..." : "Létrehozás"}
          </button>
        </div>
        {/* Preview */}
        {newName.trim() && (
          <div className="mt-3">
            <span className="text-xs text-gray-400 mr-2">Előnézet:</span>
            <span
              className="inline-block px-2.5 py-0.5 rounded text-xs font-medium text-white"
              style={{ backgroundColor: newColor }}
            >
              {newName}
            </span>
          </div>
        )}
      </div>

      {/* Tag list */}
      <div className="bg-white rounded-xl border">
        <div className="px-5 py-3 border-b">
          <h3 className="text-sm font-medium text-gray-700">
            Meglévő címkék ({tags.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto" />
          </div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            Még nincs címkéd. Hozz létre egyet fent!
          </div>
        ) : (
          <div className="divide-y">
            {tags.map((tag) => (
              <div key={tag.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50 transition">
                {editingId === tag.id ? (
                  <div className="flex items-center gap-3 flex-1 mr-3">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-48"
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate(tag.id)}
                    />
                    <div className="flex gap-1">
                      {presetColors.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`w-5 h-5 rounded-full transition ${
                            editColor === c ? "ring-2 ring-offset-1 ring-gray-400" : ""
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-block px-2.5 py-0.5 rounded text-xs font-medium text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {tag.contracts.length} szerződés
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {editingId === tag.id ? (
                    <>
                      <button
                        onClick={() => handleUpdate(tag.id)}
                        className="text-xs px-3 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition"
                      >
                        Mentés
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-xs px-3 py-1 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                      >
                        Mégse
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(tag)}
                        className="text-xs px-3 py-1 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                      >
                        Szerkesztés
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
                        className="text-xs px-3 py-1 rounded-lg text-red-500 hover:bg-red-50 transition"
                      >
                        Törlés
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
