"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import SignaturePad from "signature_pad";
import axios from "axios";
import toast from "react-hot-toast";
import { sanitizeHtml } from "@/lib/sanitize";

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
});

interface SignerInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  signingOrder: number;
}

interface ContractInfo {
  id: string;
  title: string;
  contentHtml: string;
  status: string;
  signers: { id: string; name: string; role: string; status: string }[];
}

export default function SignPage() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<ContractInfo | null>(null);
  const [signer, setSigner] = useState<SignerInfo | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [hasRead, setHasRead] = useState(false);
  const [signMethod, setSignMethod] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("");
  const [declining, setDeclining] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [signerNote, setSignerNote] = useState("");
  const [dataConsent, setDataConsent] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadContract();
  }, [token]);

  useEffect(() => {
    if (canvasRef.current && signMethod === "draw") {
      padRef.current = new SignaturePad(canvasRef.current, {
        backgroundColor: "rgb(255, 255, 255)",
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
  }, [signMethod, contract]);

  const loadContract = async () => {
    try {
      const res = await publicApi.get(`/sign/${token}`);
      setContract(res.data.data.contract);
      setSigner(res.data.data.signer);
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ??
          "Érvénytelen vagy lejárt aláírási link"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        setHasRead(true);
      }
    }
  };

  const handleSign = async () => {
    let signatureImageBase64: string | undefined;

    if (signMethod === "draw") {
      if (padRef.current?.isEmpty()) {
        toast.error("Kérjük, írja alá a szerződést");
        return;
      }
      signatureImageBase64 = padRef.current?.toDataURL("image/png");
    } else {
      if (!typedName.trim()) {
        toast.error("Kérjük, írja be a nevét");
        return;
      }
    }

    setSigning(true);
    try {
      await publicApi.post(`/sign/${token}`, {
        signatureMethod: "simple",
        signatureImageBase64,
        typedName: signMethod === "type" ? typedName : undefined,
        note: signerNote || undefined,
      });
      setSigned(true);
      toast.success("Sikeresen aláírta a szerződést!");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az aláíráskor");
    } finally {
      setSigning(false);
    }
  };

  const handleDecline = async () => {
    setSigning(true);
    try {
      await publicApi.post(`/sign/${token}/decline`, { reason: declineReason, note: signerNote || undefined });
      setError("Visszautasította a szerződést");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Legitas
          </h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-green-600">{"\u2713"}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sikeresen aláírta!
          </h1>
          <p className="text-gray-500">
            A szerződés aláírásáról email értesítőt küldtünk.
            Amennyiben minden fél aláírta, a végleges dokumentumot emailben kapja meg.
          </p>
        </div>
      </div>
    );
  }

  if (!contract || !signer) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b py-4 px-6">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold text-blue-600">Legitas</h1>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">{signer.name}</span>
            {signer.role && <span className="ml-1">({signer.role})</span>}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {contract.title}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Kérjük, olvassa el a szerződést, majd írja alá az alján.
        </p>

        {/* Contract content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="bg-white rounded-xl border shadow-sm p-8 mb-6 max-h-[60vh] overflow-y-auto"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(contract.contentHtml) }}
        />

        {/* Signing area */}
        <div className="bg-white rounded-xl border shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="read"
              checked={hasRead}
              onChange={(e) => setHasRead(e.target.checked)}
              className="w-4 h-4 text-blue-600"
            />
            <label htmlFor="read" className="text-sm text-gray-700">
              Elolvastam és megértettem a szerződés tartalmát
            </label>
          </div>

          {hasRead && (
            <>
              {/* Signature method tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setSignMethod("draw")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    signMethod === "draw"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  Kézírásos aláírás
                </button>
                <button
                  onClick={() => setSignMethod("type")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    signMethod === "type"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-500 hover:bg-gray-100"
                  }`}
                >
                  Gépelt aláírás
                </button>
              </div>

              {signMethod === "draw" ? (
                <div className="mb-4">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-40 border rounded-lg cursor-crosshair"
                  />
                  <button
                    onClick={() => padRef.current?.clear()}
                    className="text-sm text-gray-500 hover:text-gray-700 mt-1"
                  >
                    Törlés
                  </button>
                </div>
              ) : (
                <div className="mb-4">
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    placeholder="Írja be a teljes nevét"
                    className="w-full px-4 py-3 border rounded-lg text-xl font-serif italic focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              <div className="bg-gray-50 border rounded-lg p-3 mb-4 space-y-1">
                <p className="text-xs text-gray-500">
                  Az aláírással elfogadom a szerződés feltételeit. Az aláírás
                  időbélyeggel, IP címmel és böngésző adatokkal kerül rögzítésre.
                </p>
                <p className="text-xs text-gray-400">
                  <strong>Jogi tájékoztatás:</strong> Jelen elektronikus aláírás az eIDAS rendelet (EU 910/2014) szerinti
                  egyszerű elektronikus aláírásnak minősül. Nem minősül minősített elektronikus aláírásnak (QES),
                  így joghatása a Ptk. 6:7. § (3) bekezdése alapján a felek megállapodásától függ. A platform
                  SHA-256 dokumentum hash-t és audit naplót biztosít a hitelesség igazolásához.
                </p>
              </div>

              {/* Optional signer note */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Megjegyzés (opcionális)
                </label>
                <textarea
                  value={signerNote}
                  onChange={(e) => setSignerNote(e.target.value)}
                  placeholder="Ha szeretne megjegyzést fűzni az aláírásához..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#198296] outline-none resize-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                  onFocus={(e) => (e.target.style.borderColor = "#198296")}
                  onBlur={(e) => (e.target.style.borderColor = "")}
                />
              </div>

              {/* Data collection consent */}
              <div className="flex items-start gap-2 mb-4">
                <input
                  type="checkbox"
                  id="dataConsent"
                  checked={dataConsent}
                  onChange={(e) => setDataConsent(e.target.checked)}
                  className="w-4 h-4 text-blue-600 mt-0.5"
                />
                <label htmlFor="dataConsent" className="text-sm text-gray-700">
                  Tudomásul veszem, hogy az aláírás során a rendszer rögzíti az IP-címemet, böngészőadataimat, az aláírás időpontját és az aláírásképemet az eIDAS rendelet és a GDPR előírásainak megfelelően. Részletek:{" "}
                  <a href="/adatvedelem" target="_blank" className="text-blue-600 underline hover:text-blue-800">
                    Adatvédelmi tájékoztató
                  </a>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleSign}
                  disabled={signing || !dataConsent}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {signing ? "Aláírás..." : "Elfogadom és aláírom"}
                </button>
                <button
                  onClick={() => setDeclining(true)}
                  className="px-5 py-3 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50"
                >
                  Visszautasítom
                </button>
              </div>

              {declining && (
                <div className="mt-4 p-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-sm text-red-700 mb-2">
                    Biztosan visszautasítja a szerződést?
                  </p>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    placeholder="Indoklás (opcionális)"
                    rows={2}
                    className="w-full px-3 py-2 border rounded-lg text-sm mb-2 outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDecline}
                      disabled={signing}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      Visszautasítás megerősítése
                    </button>
                    <button
                      onClick={() => setDeclining(false)}
                      className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
                    >
                      Mégse
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Other signers status */}
        <div className="mt-6 bg-white rounded-xl border p-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Aláírók státusza
          </h3>
          <div className="space-y-2">
            {contract.signers.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-700">
                  {s.name} {s.role && `(${s.role})`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs ${
                    s.status === "signed"
                      ? "bg-green-100 text-green-700"
                      : s.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {s.status === "signed"
                    ? "Aláírta"
                    : s.status === "pending"
                      ? "Várakozik"
                      : "Visszautasította"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
