"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import EmptyState from "@/components/empty-state";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string;
  active: boolean;
  lastUsed: string | null;
  createdAt: string;
}

const scopeOptions = [
  { value: "contracts:read", label: "Szerződések olvasása" },
  { value: "contracts:write", label: "Szerződések írása" },
  { value: "templates:read", label: "Sablonok olvasása" },
  { value: "signatures:write", label: "Aláírások kezelése" },
];

export default function ApiKeysSettings() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>(["contracts:read", "templates:read"]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    try {
      const res = await api.get("/api-keys");
      setKeys(res.data.data);
    } catch {
      toast.error("Hiba az API kulcsok betöltésekor");
    }
  };

  const handleCreate = async () => {
    if (!name) return;
    setCreating(true);
    try {
      const res = await api.post("/api-keys", {
        name,
        scopes: scopes.join(","),
      });
      setNewKey(res.data.data.key);
      setName("");
      setShowCreate(false);
      loadKeys();
      toast.success("API kulcs létrehozva");
    } catch {
      toast.error("Hiba a létrehozásnál");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt az API kulcsot?")) return;
    try {
      await api.delete(`/api-keys/${id}`);
      toast.success("API kulcs törölve");
      loadKeys();
    } catch {
      toast.error("Hiba");
    }
  };

  const toggleScope = (scope: string) => {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* New key alert */}
      {newKey && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-2">Új API kulcs létrehozva</h3>
          <p className="text-sm text-green-700 mb-3">
            Másold ki most! Ez a kulcs többé nem lesz látható.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white border rounded-lg px-4 py-2.5 text-sm font-mono text-green-800 select-all">
              {newKey}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
                toast.success("Vágólapra másolva");
              }}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
            >
              Másolás
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="mt-3 text-sm text-green-600 hover:text-green-700"
          >
            Bezárás
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">API kulcsok</h2>
            <p className="text-sm text-gray-500 mt-1">
              Használd az API-t a szerződéskezelés automatizálásához.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            + Új kulcs
          </button>
        </div>

        {showCreate && (
          <div className="border rounded-xl p-5 mb-6 bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kulcs neve</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="pl. Production Backend"
                  className="w-full px-4 py-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Jogosultságok</label>
                <div className="grid grid-cols-2 gap-2">
                  {scopeOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={scopes.includes(opt.value)}
                        onChange={() => toggleScope(opt.value)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={creating || !name}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {creating ? "Létrehozás..." : "Kulcs létrehozása"}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {keys.length === 0 ? (
            <EmptyState
              icon="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              title="Nincs API kulcs"
              description="Hozz l\u00e9tre egy API kulcsot a szerz\u0151d\u00e9skezel\u00e9s automatiz\u00e1l\u00e1s\u00e1hoz."
            />
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm">{k.name}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        k.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {k.active ? "Aktív" : "Letiltva"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {k.prefix}...
                    <span className="ml-3">
                      Utoljára használva: {k.lastUsed ? new Date(k.lastUsed).toLocaleDateString("hu-HU") : "soha"}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Scope: {k.scopes}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(k.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Törlés
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-gray-950 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-3">API használat</h3>
        <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`# Autentikáció
curl -H "Authorization: Bearer szp_..." \\
     http://localhost:3001/api/contracts

# Szerződés létrehozás
curl -X POST http://localhost:3001/api/contracts \\
  -H "Authorization: Bearer szp_..." \\
  -H "Content-Type: application/json" \\
  -d '{"title":"...","templateId":"..."}'`}
        </pre>
      </div>
    </div>
  );
}
