"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import EmptyState from "@/components/empty-state";
import FeatureGate from "@/components/feature-gate";

interface TeamMember {
  id: string;
  role: string;
  joinedAt: string;
  user: { id: string; name: string; email: string };
}

interface Team {
  id: string;
  name: string;
  members: TeamMember[];
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  member: "Tag",
  viewer: "Megtekintő",
};

export default function TeamSettings() {
  const [team, setTeam] = useState<Team | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const res = await api.get("/teams");
      setTeam(res.data.data);
    } catch {
      toast.error("Hiba a csapat betöltésekor");
    }
  };

  const handleInvite = async () => {
    if (!email) return;
    setInviting(true);
    try {
      await api.post("/teams/invite", { email, role });
      toast.success("Tag meghívva!");
      setEmail("");
      loadTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a meghívásnál");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Biztosan eltávolítod ezt a tagot?")) return;
    try {
      await api.delete(`/teams/members/${memberId}`);
      toast.success("Tag eltávolítva");
      loadTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      await api.patch(`/teams/members/${memberId}`, { role: newRole });
      toast.success("Szerepkör frissítve");
      loadTeam();
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    }
  };

  return (
    <FeatureGate featureKey="team_management" featureName="Csapatkezelés">
    <div className="max-w-3xl space-y-6">
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Csapattagok</h2>
        <p className="text-sm text-gray-500 mb-6">
          Hívd meg kollégáidat és kezeld a jogosultságaikat.
        </p>

        <div className="flex gap-3 mb-6">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email cím"
            className="flex-1 px-4 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="px-3 py-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="admin">Admin</option>
            <option value="member">Tag</option>
            <option value="viewer">Megtekintő</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting || !email}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition whitespace-nowrap"
          >
            {inviting ? "..." : "Meghívás"}
          </button>
        </div>

        <div className="space-y-2">
          {team && team.members.length <= 1 && (
            <EmptyState
              icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              title="M\u00e9g nincsenek csapattagok"
              description="H\u00edvd meg koll\u00e9g\u00e1idat, hogy egy\u00fctt dolgozhassatok a szerz\u0151d\u00e9seken."
            />
          )}
          {team?.members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {m.user.name.split(" ").map((n) => n[0]).join("").substring(0, 2)}
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{m.user.name}</p>
                  <p className="text-xs text-gray-400">{m.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.id, e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1.5 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Tag</option>
                  <option value="viewer">Megtekintő</option>
                </select>
                <button
                  onClick={() => handleRemove(m.id)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Eltávolítás
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-2">Szerepkörök</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p><strong>Admin:</strong> Teljes hozzáférés, meghívhat tagokat, szerződéseket kezelhet</p>
          <p><strong>Tag:</strong> Szerződéseket hozhat létre, sablonokat használhat</p>
          <p><strong>Megtekintő:</strong> Csak olvasási jogosultság, nem hozhat létre szerződést</p>
        </div>
      </div>
    </div>
    </FeatureGate>
  );
}
