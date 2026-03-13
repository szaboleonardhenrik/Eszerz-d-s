"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";
import EmptyState from "@/components/empty-state";
import FeatureGate from "@/components/feature-gate";
import { useI18n } from "@/lib/i18n";

interface Webhook {
  id: string;
  url: string;
  secret: string;
  events: string;
  active: boolean;
  lastError: string | null;
  lastTriggeredAt: string | null;
  createdAt: string;
}

const eventOptions = [
  { value: "contract.created", label: "Szerződés létrehozva" },
  { value: "contract.signed", label: "Aláírva" },
  { value: "contract.completed", label: "Teljesítve" },
  { value: "contract.declined", label: "Visszautasítva" },
  { value: "contract.expired", label: "Lejárt" },
  { value: "quote.sent", label: "Ajánlat elküldve" },
  { value: "quote.accepted", label: "Ajánlat elfogadva" },
  { value: "quote.declined", label: "Ajánlat elutasítva" },
  { value: "quote.converted", label: "Ajánlat szerződéssé alakítva" },
];

export default function WebhooksSettings() {
  const { t } = useI18n();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editEvents, setEditEvents] = useState<string[]>([]);

  useEffect(() => {
    loadWebhooks();
  }, []);

  const loadWebhooks = async () => {
    try {
      const res = await api.get("/webhooks");
      setWebhooks(res.data.data);
    } catch {
      toast.error("Hiba a webhookok betöltésekor");
    }
  };

  const handleCreate = async () => {
    if (!url || selectedEvents.length === 0) {
      toast.error("Add meg az URL-t és válassz legalább egy eseményt");
      return;
    }
    setCreating(true);
    try {
      const res = await api.post("/webhooks", {
        url,
        events: selectedEvents.join(","),
      });
      setNewSecret(res.data.data.secret);
      setUrl("");
      setSelectedEvents([]);
      setShowCreate(false);
      loadWebhooks();
      toast.success("Webhook létrehozva");
    } catch {
      toast.error("Hiba a létrehozásnál");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Biztosan törlöd ezt a webhookot?")) return;
    try {
      await api.delete(`/webhooks/${id}`);
      toast.success("Webhook törölve");
      loadWebhooks();
    } catch {
      toast.error("Hiba a törlésnél");
    }
  };

  const handleToggleActive = async (webhook: Webhook) => {
    try {
      await api.put(`/webhooks/${webhook.id}`, { active: !webhook.active });
      loadWebhooks();
      toast.success(webhook.active ? "Webhook kikapcsolva" : "Webhook bekapcsolva");
    } catch {
      toast.error("Hiba");
    }
  };

  const startEdit = (webhook: Webhook) => {
    setEditingId(webhook.id);
    setEditUrl(webhook.url);
    setEditEvents(webhook.events.split(","));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditUrl("");
    setEditEvents([]);
  };

  const handleUpdate = async () => {
    if (!editingId || !editUrl || editEvents.length === 0) return;
    try {
      await api.put(`/webhooks/${editingId}`, {
        url: editUrl,
        events: editEvents.join(","),
      });
      cancelEdit();
      loadWebhooks();
      toast.success("Webhook frissítve");
    } catch {
      toast.error("Hiba a frissítésnél");
    }
  };

  const toggleEvent = (event: string, list: string[], setter: (v: string[]) => void) => {
    setter(
      list.includes(event) ? list.filter((e) => e !== event) : [...list, event]
    );
  };

  return (
    <FeatureGate featureKey="webhooks" requiredTier="premium" featureName="Webhookok">
    <div className="max-w-3xl space-y-6">
      {/* New secret alert */}
      {newSecret && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-green-900 mb-2">Webhook titok (secret)</h3>
          <p className="text-sm text-green-700 mb-3">
            Masold ki most! Ez a titok tobbe nem lesz lathato teljes egeszeben.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 bg-white border rounded-lg px-4 py-2.5 text-sm font-mono text-green-800 select-all break-all">
              {newSecret}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newSecret);
                toast.success("Vagólapra másolva");
              }}
              className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 shrink-0"
            >
              Másolás
            </button>
          </div>
          <button
            onClick={() => setNewSecret(null)}
            className="mt-3 text-sm text-green-600 hover:text-green-700"
          >
            Bezárás
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{t("webhooks.title")}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t("webhooks.subtitle")}
            </p>
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 max-w-xl">
              <svg className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>GDPR figyelmeztetés:</strong> A webhook-ok aláírói adatokat (név, e-mail, státusz) továbbítanak
                harmadik félnek. Ön mint adatkezelő felelős azért, hogy a fogadó fél GDPR-kompatibilis legyen és
                rendelkezzen adatfeldolgozási megállapodással (DPA).
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ backgroundColor: "#198296" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#146d7d")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#198296")}
          >
            {t("webhooks.add")}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="border rounded-xl p-5 mb-6 bg-gray-50">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("webhooks.url")}
                </label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#198296]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("webhooks.events")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {eventOptions.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedEvents.includes(opt.value)}
                        onChange={() =>
                          toggleEvent(opt.value, selectedEvents, setSelectedEvents)
                        }
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "#198296" }}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={creating || !url || selectedEvents.length === 0}
                  className="text-white px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 transition"
                  style={{ backgroundColor: "#198296" }}
                >
                  {creating ? t("webhooks.creating") : t("webhooks.createWebhook")}
                </button>
                <button
                  onClick={() => {
                    setShowCreate(false);
                    setUrl("");
                    setSelectedEvents([]);
                  }}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                >
                  Mégse
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        <div className="space-y-3">
          {webhooks.length === 0 ? (
            <EmptyState
              icon="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              title={t("webhooks.empty")}
              description={t("webhooks.emptyDesc")}
            />
          ) : (
            webhooks.map((w) =>
              editingId === w.id ? (
                /* Edit form */
                <div key={w.id} className="border rounded-xl p-5 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Webhook URL
                      </label>
                      <input
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#198296]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Események
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {eventOptions.map((opt) => (
                          <label
                            key={opt.value}
                            className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editEvents.includes(opt.value)}
                              onChange={() =>
                                toggleEvent(opt.value, editEvents, setEditEvents)
                              }
                              className="w-4 h-4 rounded"
                              style={{ accentColor: "#198296" }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdate}
                        className="text-white px-5 py-2.5 rounded-lg text-sm font-medium transition"
                        style={{ backgroundColor: "#198296" }}
                      >
                        Mentés
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
                      >
                        Mégse
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Webhook card */
                <div
                  key={w.id}
                  className="p-4 rounded-xl border hover:bg-gray-50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {w.url}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${
                            w.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {w.active ? t("webhooks.active") : t("webhooks.inactive")}
                        </span>
                      </div>

                      {/* Event badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {w.events.split(",").map((event) => {
                          const label =
                            eventOptions.find((o) => o.value === event)?.label ?? event;
                          return (
                            <span
                              key={event}
                              className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{
                                backgroundColor: "rgba(210, 155, 1, 0.12)",
                                color: "#9a7200",
                              }}
                            >
                              {label}
                            </span>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-xs text-gray-400 font-mono">
                          Secret: {w.secret}
                        </p>
                        {w.lastTriggeredAt && (
                          <p className="text-xs text-gray-400">
                            Utoljára: {new Date(w.lastTriggeredAt).toLocaleString("hu-HU")}
                          </p>
                        )}
                      </div>

                      {w.lastError && (
                        <p className="text-xs text-red-500 mt-1.5 bg-red-50 px-2 py-1 rounded">
                          Hiba: {w.lastError}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      {/* Active toggle */}
                      <button
                        onClick={() => handleToggleActive(w)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          w.active ? "bg-[#198296]" : "bg-gray-300"
                        }`}
                        title={w.active ? "Kikapcsolás" : "Bekapcsolás"}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            w.active ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => startEdit(w)}
                        className="text-sm font-medium hover:text-[#198296] text-gray-500 transition"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(w.id)}
                        className="text-sm text-red-500 hover:text-red-700 font-medium transition"
                      >
                        {t("common.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* GDPR Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
        <div className="flex gap-3">
          <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-amber-800">Adatvédelmi figyelmeztetés</p>
            <p className="text-sm text-amber-700 mt-1">
              A webhook payloadok személyes adatokat tartalmaznak (aláírók neve, email címe, szerződés adatok).
              Gondoskodj róla, hogy a fogadó végpont megfelel a GDPR előírásainak, és a harmadik fél
              adatfeldolgozóval Adatfeldolgozási Megállapodás (DPA) van érvényben.
            </p>
          </div>
        </div>
      </div>

      {/* Usage docs */}
      <div className="bg-gray-950 rounded-xl p-6">
        <h3 className="text-white font-semibold mb-3">Webhook payload formátum</h3>
        <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
{`// POST request a megadott URL-re
// Headers:
//   Content-Type: application/json
//   X-Webhook-Secret: whsec_...
//   X-Webhook-Event: contract.signed

{
  "event": "contract.signed",
  "timestamp": "2026-03-06T12:00:00.000Z",
  "data": {
    "contractId": "...",
    "title": "Megbízási szerződés",
    "signerName": "Kiss Péter",
    "signerEmail": "kiss.peter@example.com"
  }
}`}
        </pre>
      </div>
    </div>
    </FeatureGate>
  );
}
