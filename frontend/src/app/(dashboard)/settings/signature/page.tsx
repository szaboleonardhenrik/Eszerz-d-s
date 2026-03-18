"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import api from "@/lib/api";
import toast from "react-hot-toast";

export default function SignatureSettings() {
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [stampBase64, setStampBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [drawMode, setDrawMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const sigUploadRef = useRef<HTMLInputElement>(null);
  const stampUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSaved();
  }, []);

  useEffect(() => {
    if (drawMode && canvasRef.current) {
      padRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "#1a1a1a",
      });
      const resize = () => {
        const canvas = canvasRef.current!;
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        canvas.getContext("2d")!.scale(ratio, ratio);
        padRef.current?.clear();
      };
      resize();
    }
  }, [drawMode]);

  const loadSaved = async () => {
    try {
      const res = await api.get("/auth/saved-signature");
      const data = res.data.data;
      setSignatureBase64(data.signatureBase64);
      setStampBase64(data.stampBase64);
    } catch {
      // No saved signature
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (setter: (val: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Maximum 2MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("Csak képfájl"); return; }
    const reader = new FileReader();
    reader.onload = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const saveFromDraw = () => {
    if (padRef.current?.isEmpty()) { toast.error("Rajzolj egy aláírást!"); return; }
    setSignatureBase64(padRef.current!.toDataURL("image/png"));
    setDrawMode(false);
  };

  const handleSave = async () => {
    if (!signatureBase64) { toast.error("Nincs aláírás"); return; }
    setSaving(true);
    try {
      await api.post("/auth/saved-signature", {
        signatureImageBase64: signatureBase64,
        stampImageBase64: stampBase64 || undefined,
      });
      toast.success("Aláírás mentve!");
    } catch {
      toast.error("Hiba a mentéskor");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await api.delete("/auth/saved-signature");
      setSignatureBase64(null);
      setStampBase64(null);
      toast.success("Aláírás törölve");
    } catch {
      toast.error("Hiba a törléskor");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Betöltés...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mentett aláírás</h2>
        <p className="text-sm text-gray-500 mt-1">
          Mentsd el az aláírásodat és pecsétedet, hogy a szerződések aláírásakor egyetlen kattintással használhasd.
        </p>
      </div>

      {/* Signature */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Aláírás</label>

        {drawMode ? (
          <div>
            <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden mb-3">
              <canvas ref={canvasRef} className="w-full h-40 cursor-crosshair touch-none" />
              <button onClick={() => padRef.current?.clear()} className="absolute bottom-2 right-2 text-xs text-gray-400 hover:text-gray-600 bg-white/80 px-2 py-1 rounded border">Törlés</button>
            </div>
            <div className="flex gap-2">
              <button onClick={saveFromDraw} className="px-4 py-2 bg-[#198296] text-white rounded-lg text-sm font-medium hover:bg-[#146d7d] transition">Elfogadás</button>
              <button onClick={() => setDrawMode(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">Mégse</button>
            </div>
          </div>
        ) : signatureBase64 ? (
          <div className="flex items-center gap-4">
            <div className="border border-gray-200 dark:border-gray-600 rounded-xl p-3 bg-gray-50 dark:bg-gray-700">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={signatureBase64} alt="Mentett aláírás" className="max-h-20" />
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={() => { setSignatureBase64(null); setDrawMode(true); }} className="text-sm text-[#198296] hover:underline">Újrarajzolás</button>
              <button onClick={() => sigUploadRef.current?.click()} className="text-sm text-[#198296] hover:underline">Másik kép feltöltése</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button onClick={() => setDrawMode(true)} className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#198296]/40 transition cursor-pointer">
              <svg className="w-6 h-6 mx-auto text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              <span className="text-sm text-gray-500">Rajzolás</span>
            </button>
            <button onClick={() => sigUploadRef.current?.click()} className="flex-1 border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-[#198296]/40 transition cursor-pointer">
              <svg className="w-6 h-6 mx-auto text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span className="text-sm text-gray-500">Feltöltés</span>
            </button>
          </div>
        )}
        <input ref={sigUploadRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload(setSignatureBase64)} />
      </div>

      {/* Stamp */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Pecsét / Bélyegző <span className="font-normal text-gray-400">(opcionális)</span>
        </label>
        <div onClick={() => stampUploadRef.current?.click()} className="border border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-[#198296]/40 transition">
          {stampBase64 ? (
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stampBase64} alt="Pecsét" className="max-h-20 mx-auto" />
              <button onClick={(e) => { e.stopPropagation(); setStampBase64(null); }} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center shadow">✕</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              <span className="text-sm text-gray-400">Pecsét feltöltése</span>
            </div>
          )}
        </div>
        <input ref={stampUploadRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleFileUpload(setStampBase64)} />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving || !signatureBase64} className="px-6 py-2.5 bg-[#198296] text-white rounded-xl font-medium text-sm hover:bg-[#146d7d] disabled:opacity-50 transition">
          {saving ? "Mentés..." : "Aláírás mentése"}
        </button>
        {signatureBase64 && (
          <button onClick={handleDelete} disabled={saving} className="px-6 py-2.5 border border-red-200 text-red-600 rounded-xl font-medium text-sm hover:bg-red-50 disabled:opacity-50 transition">
            Törlés
          </button>
        )}
      </div>
    </div>
  );
}
