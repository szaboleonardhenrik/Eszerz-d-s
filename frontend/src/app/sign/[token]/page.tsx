"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
  otpVerified: boolean;
}

interface ContractInfo {
  id: string;
  title: string;
  contentHtml: string;
  status: string;
  signers: { id: string; name: string; role: string; status: string }[];
}

type Step = "verify" | "details" | "review" | "sign";

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
  const [partnerConsent, setPartnerConsent] = useState(false);

  // Partner data
  const [signerFullName, setSignerFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyTaxNumber, setCompanyTaxNumber] = useState("");
  const [companyAddress, setCompanyAddress] = useState("");

  // OTP state
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpMaskedEmail, setOtpMaskedEmail] = useState("");
  const [otpCooldown, setOtpCooldown] = useState(0);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>("verify");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const allFieldsFilled =
    signerFullName.trim() !== "" &&
    companyName.trim() !== "" &&
    companyTaxNumber.trim() !== "" &&
    companyAddress.trim() !== "";

  useEffect(() => {
    loadContract();
  }, [token]);

  useEffect(() => {
    if (canvasRef.current && signMethod === "draw" && currentStep === "sign") {
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
  }, [signMethod, currentStep, contract]);

  // OTP cooldown timer
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [otpCooldown]);

  const loadContract = async () => {
    try {
      const res = await publicApi.get(`/sign/${token}`);
      setContract(res.data.data.contract);
      const signerData = res.data.data.signer;
      setSigner(signerData);
      setSignerFullName(signerData.name || "");
      // If already verified, skip OTP step
      if (signerData.otpVerified) {
        setCurrentStep("details");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ??
          "Érvénytelen vagy lejárt aláírási link"
      );
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = useCallback(async () => {
    setOtpSending(true);
    try {
      const res = await publicApi.post(`/sign/${token}/request-otp`);
      const data = res.data.data;
      if (data.verified) {
        // Already verified
        setSigner((s) => s ? { ...s, otpVerified: true } : s);
        setCurrentStep("details");
        return;
      }
      if (data.maskedEmail) setOtpMaskedEmail(data.maskedEmail);
      setOtpSent(true);
      setOtpCooldown(60);
      setOtpCode(["", "", "", "", "", ""]);
      toast.success("Hitelesítési kód elküldve");
      // Focus first input
      setTimeout(() => otpInputRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba a kód küldésekor");
    } finally {
      setOtpSending(false);
    }
  }, [token]);

  const verifyOtp = async () => {
    const code = otpCode.join("");
    if (code.length !== 6) {
      toast.error("Kérjük, írja be a teljes 6 jegyű kódot");
      return;
    }
    setOtpVerifying(true);
    try {
      await publicApi.post(`/sign/${token}/verify-otp`, { code });
      setSigner((s) => s ? { ...s, otpVerified: true } : s);
      toast.success("Email cím sikeresen hitelesítve!");
      setCurrentStep("details");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hibás kód");
      setOtpCode(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...otpCode];
    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newCode[i] = digits[i] || "";
      }
      setOtpCode(newCode);
      if (digits.length >= 6) {
        otpInputRefs.current[5]?.focus();
      } else {
        otpInputRefs.current[Math.min(digits.length, 5)]?.focus();
      }
      return;
    }
    newCode[index] = value;
    setOtpCode(newCode);
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      verifyOtp();
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
        signerFullName,
        companyName,
        companyTaxNumber,
        companyAddress,
        partnerConsent,
      });
      setSigned(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba az aláíráskor");
    } finally {
      setSigning(false);
    }
  };

  const handleDecline = async () => {
    setSigning(true);
    try {
      await publicApi.post(`/sign/${token}/decline`, {
        reason: declineReason,
        note: signerNote || undefined,
      });
      setError("Visszautasította a szerződést");
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message ?? "Hiba");
    } finally {
      setSigning(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "verify", label: "Hitelesítés" },
    { key: "details", label: "Adatok" },
    { key: "review", label: "Szerződés" },
    { key: "sign", label: "Aláírás" },
  ];

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#198296]/20 border-t-[#198296] rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Szerződés betöltése...</p>
        </div>
      </div>
    );
  }

  // ── ERROR ──
  if (error) {
    const isDecline = error.includes("Visszautasította");
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1A4B5F] to-[#198296] flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white font-bold">L</span>
          </div>
          <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${isDecline ? "bg-orange-100" : "bg-red-50"}`}>
            <span className={`text-2xl ${isDecline ? "text-orange-500" : "text-red-400"}`}>
              {isDecline ? "\u2716" : "\u26A0"}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {isDecline ? "Szerződés visszautasítva" : "Nem sikerült betölteni"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // ── SUCCESS ──
  if (signed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/40 flex items-center justify-center px-4">
        <div className="text-center max-w-lg">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#1A4B5F] to-[#198296] flex items-center justify-center shadow-lg">
            <span className="text-3xl text-white font-bold">L</span>
          </div>
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Sikeresen aláírta a szerződést!
          </h1>
          <div className="bg-white rounded-xl border border-emerald-200 p-5 mb-4 shadow-sm">
            <p className="text-sm text-gray-600 leading-relaxed">
              Az aláírása rögzítésre került. Amennyiben minden fél aláírta a szerződést,
              a <strong>végleges dokumentumot PDF-ben emailben kapja meg</strong>.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Biztonságos elektronikus aláírás a Legitas platformon</span>
          </div>
        </div>
      </div>
    );
  }

  if (!contract || !signer) return null;

  // ── MAIN SIGNING FLOW ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50/30">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1A4B5F] via-[#198296] to-[#0F766E] shadow-lg">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <div>
              <span className="text-white font-semibold text-lg tracking-tight">Legit</span>
              <span className="text-[#46A0A0] font-bold text-lg">as</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/90 text-sm font-medium">{signer.name}</p>
            {signer.role && (
              <p className="text-white/60 text-xs">{signer.role}</p>
            )}
          </div>
        </div>
      </header>

      {/* Step indicator */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center">
                {i > 0 && (
                  <div className={`w-5 sm:w-12 h-0.5 mx-1 sm:mx-2 rounded-full transition-colors ${i <= stepIndex ? "bg-[#198296]" : "bg-gray-200"}`} />
                )}
                <button
                  onClick={() => {
                    if (step.key === "verify") setCurrentStep("verify");
                    else if (step.key === "details" && signer.otpVerified) setCurrentStep("details");
                    else if (step.key === "review" && signer.otpVerified && allFieldsFilled) setCurrentStep("review");
                    else if (step.key === "sign" && signer.otpVerified && allFieldsFilled && hasRead) setCurrentStep("sign");
                  }}
                  className="flex items-center gap-1 sm:gap-1.5 group"
                >
                  <div
                    className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all ${
                      i < stepIndex
                        ? "bg-[#198296] text-white"
                        : i === stepIndex
                          ? "bg-[#198296] text-white ring-4 ring-[#198296]/20"
                          : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {i < stepIndex ? (
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-sm font-medium transition-colors ${
                      i <= stepIndex ? "text-[#198296]" : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* ── STEP 0: OTP Verification ── */}
        {currentStep === "verify" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#198296] to-[#0F766E] flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Email hitelesítés</h2>
              <p className="text-sm text-gray-500 mt-1.5 max-w-md mx-auto">
                A biztonságos aláíráshoz szükséges az email címének ellenőrzése.
                Egy 6 jegyű kódot küldünk az Ön email címére.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden max-w-md mx-auto">
              <div className="p-6 sm:p-8">
                {!otpSent ? (
                  <>
                    <div className="bg-[#198296]/5 border border-[#198296]/15 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#198296]/10 flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-[#198296]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Kód küldése erre a címre:</p>
                          <p className="text-sm font-semibold text-gray-900">{signer.email}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={requestOtp}
                      disabled={otpSending}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#198296] to-[#0F766E] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-50 transition-all shadow-sm"
                    >
                      {otpSending ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Kód küldése...
                        </span>
                      ) : (
                        "Hitelesítési kód kérése"
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600">
                        Kód elküldve: <strong>{otpMaskedEmail}</strong>
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="flex justify-center gap-2 sm:gap-3 mb-6">
                      {otpCode.map((digit, i) => (
                        <input
                          key={i}
                          ref={(el) => { otpInputRefs.current[i] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={digit}
                          onChange={(e) => handleOtpChange(i, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(i, e)}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                            if (pasted.length > 1) {
                              e.preventDefault();
                              handleOtpChange(0, pasted);
                            }
                          }}
                          className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl bg-gray-50/50 focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                        />
                      ))}
                    </div>

                    <button
                      onClick={verifyOtp}
                      disabled={otpVerifying || otpCode.join("").length !== 6}
                      className="w-full px-6 py-3 bg-gradient-to-r from-[#198296] to-[#0F766E] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm mb-4"
                    >
                      {otpVerifying ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Ellenőrzés...
                        </span>
                      ) : (
                        "Kód ellenőrzése"
                      )}
                    </button>

                    <div className="text-center">
                      <button
                        onClick={requestOtp}
                        disabled={otpCooldown > 0 || otpSending}
                        className="text-sm text-[#198296] hover:text-[#146d7d] font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                      >
                        {otpCooldown > 0
                          ? `Új kód kérése (${otpCooldown}s)`
                          : "Új kód kérése"}
                      </button>
                    </div>
                  </>
                )}

                {/* Security note */}
                <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                  <div className="flex gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Az email hitelesítés megerősíti, hogy Ön a jogosult aláíró.
                      Ez növeli az aláírás bizonyító erejét vitás esetben.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 1: Partner details ── */}
        {currentStep === "details" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Aláíró adatai</h2>
              <p className="text-sm text-gray-500 mt-1">
                Kérjük, töltse ki vállalkozása adatait a szerződés aláírásához.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Aláíró teljes neve
                  </label>
                  <input
                    type="text"
                    value={signerFullName}
                    onChange={(e) => setSignerFullName(e.target.value)}
                    placeholder="pl. Kovács János"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Vállalkozás neve
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="pl. Kovács és Társa Kft."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Adószám
                    </label>
                    <input
                      type="text"
                      value={companyTaxNumber}
                      onChange={(e) => setCompanyTaxNumber(e.target.value)}
                      placeholder="pl. 12345678-1-42"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Székhely
                    </label>
                    <input
                      type="text"
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="pl. 1052 Budapest, Váci utca 1."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 sm:px-8 py-4 bg-gray-50/80 border-t flex items-center justify-between">
                {!allFieldsFilled && (
                  <p className="text-sm text-amber-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    Minden mező kitöltése szükséges
                  </p>
                )}
                {allFieldsFilled && <div />}
                <button
                  onClick={() => setCurrentStep("review")}
                  disabled={!allFieldsFilled}
                  className="px-6 py-2.5 bg-[#198296] text-white rounded-xl text-sm font-semibold hover:bg-[#146d7d] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                  Tovább a szerződéshez
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Contract review ── */}
        {currentStep === "review" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{contract.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Kérjük, olvassa át a szerződés teljes tartalmát.
                </p>
              </div>
              {/* Summary chip */}
              <div className="hidden sm:block bg-[#198296]/5 border border-[#198296]/20 rounded-xl px-4 py-2.5 text-xs text-[#198296] flex-shrink-0">
                <p className="font-semibold">{signerFullName}</p>
                <p className="text-[#198296]/70">{companyName}</p>
              </div>
            </div>

            <div
              ref={contentRef}
              onScroll={handleScroll}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-10 mb-5 max-h-[60vh] overflow-y-auto prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHtml(contract.contentHtml),
              }}
            />

            {!hasRead && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 mb-5 flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                <p className="text-sm text-amber-700">
                  Kérjük, görgessen a szerződés végére a továbblépéshez.
                </p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentStep("details")}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Vissza
              </button>
              <button
                onClick={() => setCurrentStep("sign")}
                disabled={!hasRead}
                className="px-6 py-2.5 bg-[#198296] text-white rounded-xl text-sm font-semibold hover:bg-[#146d7d] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                Tovább az aláíráshoz
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Sign ── */}
        {currentStep === "sign" && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-900">Elektronikus aláírás</h2>
              <p className="text-sm text-gray-500 mt-1">
                Válassza ki az aláírás módját és hitelesítse a szerződést.
              </p>
            </div>

            {/* Verified badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-5 flex items-center gap-2.5">
              <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm text-emerald-700 font-medium">
                Email cím hitelesítve
              </p>
            </div>

            {/* Summary of partner data */}
            <div className="bg-[#198296]/5 border border-[#198296]/15 rounded-2xl p-5 mb-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#198296]/60 uppercase tracking-wider mb-1.5">Aláíró fél</p>
                  <p className="font-bold text-gray-900">{signerFullName}</p>
                  <p className="text-sm text-gray-600">{companyName}</p>
                  <div className="flex flex-wrap gap-x-5 gap-y-0.5 mt-1.5 text-xs text-gray-500">
                    <span>Adószám: {companyTaxNumber}</span>
                    <span>Székhely: {companyAddress}</span>
                  </div>
                </div>
                <button
                  onClick={() => setCurrentStep("details")}
                  className="text-xs text-[#198296] hover:text-[#146d7d] font-medium underline underline-offset-2 flex-shrink-0"
                >
                  Szerkesztés
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8">
                {/* Signature method tabs */}
                <div className="flex gap-1.5 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
                  <button
                    onClick={() => setSignMethod("draw")}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                      signMethod === "draw"
                        ? "bg-white text-[#198296] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Kézírásos
                    </span>
                  </button>
                  <button
                    onClick={() => setSignMethod("type")}
                    className={`px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                      signMethod === "type"
                        ? "bg-white text-[#198296] shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h11M9 21V3m4 0h6m-6 18h6" />
                      </svg>
                      Gépelt
                    </span>
                  </button>
                </div>

                {signMethod === "draw" ? (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Írja ide az aláírását
                    </label>
                    <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden hover:border-[#198296]/40 transition-colors">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-36 sm:h-44 cursor-crosshair touch-none"
                      />
                      <button
                        onClick={() => padRef.current?.clear()}
                        className="absolute bottom-2 right-2 text-xs text-gray-400 hover:text-gray-600 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-md border transition-colors"
                      >
                        Tisztítás
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                      Gépelje be a teljes nevét
                    </label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder={signerFullName}
                      className="w-full px-5 py-4 border-2 border-dashed border-gray-200 rounded-xl text-xl sm:text-2xl font-serif italic text-gray-900 focus:border-[#198296]/40 focus:ring-0 outline-none bg-gray-50/50 transition-colors placeholder:text-gray-300"
                    />
                    {typedName && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-xs text-gray-400 mb-1">Előnézet:</p>
                        <p className="text-xl sm:text-2xl font-serif italic text-gray-900">{typedName}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Note */}
                <div className="mb-5">
                  <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                    Megjegyzés <span className="normal-case font-normal">(opcionális)</span>
                  </label>
                  <textarea
                    value={signerNote}
                    onChange={(e) => setSignerNote(e.target.value)}
                    placeholder="Ha szeretne megjegyzést fűzni az aláírásához..."
                    rows={2}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50/50 focus:bg-white focus:border-[#198296] focus:ring-2 focus:ring-[#198296]/10 outline-none resize-none transition-all"
                  />
                </div>

                {/* Legal info */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
                  <div className="flex gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Az aláírással elfogadom a szerződés feltételeit. Az aláírás
                        időbélyeggel, IP-címmel és böngészőadatokkal kerül rögzítésre.
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Jelen elektronikus aláírás az eIDAS rendelet (EU 910/2014) szerinti
                        egyszerű elektronikus aláírásnak minősül. A platform
                        SHA-256 dokumentum hash-t és audit naplót biztosít a hitelesség igazolásához.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Consent */}
                <label className="flex items-start gap-3 cursor-pointer group mb-2">
                  <input
                    type="checkbox"
                    checked={dataConsent}
                    onChange={(e) => setDataConsent(e.target.checked)}
                    className="w-4.5 h-4.5 mt-0.5 rounded border-gray-300 text-[#198296] focus:ring-[#198296]/30 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                    Tudomásul veszem, hogy az aláírás során a rendszer rögzíti az IP-címemet, böngészőadataimat,
                    az aláírás időpontját és az aláírásképemet az eIDAS rendelet és a GDPR előírásainak megfelelően.{" "}
                    <a
                      href="/adatvedelem"
                      target="_blank"
                      className="text-[#198296] underline underline-offset-2 hover:text-[#146d7d]"
                    >
                      Adatvédelmi tájékoztató
                    </a>
                  </span>
                </label>

                {/* Partner registry consent */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={partnerConsent}
                    onChange={(e) => setPartnerConsent(e.target.checked)}
                    className="w-4.5 h-4.5 mt-0.5 rounded border-gray-300 text-[#198296] focus:ring-[#198296]/30 cursor-pointer"
                  />
                  <span className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-700 transition-colors">
                    Hozzájárulok, hogy a megadott adataimat (név, e-mail, cégnév) a kibocsátó a partneri
                    nyilvántartásában tárolja a jövőbeli kapcsolattartás céljából. (Opcionális)
                  </span>
                </label>
              </div>

              {/* Action bar */}
              <div className="px-6 sm:px-8 py-4 bg-gray-50/80 border-t flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <button
                  onClick={() => setCurrentStep("review")}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors order-2 sm:order-1"
                >
                  Vissza
                </button>
                <div className="flex-1 flex gap-3 order-1 sm:order-2 sm:justify-end">
                  <button
                    onClick={() => setDeclining(true)}
                    className="px-5 py-2.5 border border-red-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
                  >
                    Visszautasítás
                  </button>
                  <button
                    onClick={handleSign}
                    disabled={signing || !dataConsent}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-2.5 bg-gradient-to-r from-[#198296] to-[#0F766E] text-white rounded-xl text-sm font-bold hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {signing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Aláírás folyamatban...
                      </span>
                    ) : (
                      "Elfogadom és aláírom"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Decline modal */}
            {declining && (
              <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm font-semibold text-red-700">
                    Biztosan visszautasítja a szerződést?
                  </p>
                </div>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Indoklás (opcionális)"
                  rows={2}
                  className="w-full px-4 py-2.5 border border-red-200 rounded-xl text-sm mb-3 outline-none focus:border-red-300 bg-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDecline}
                    disabled={signing}
                    className="px-5 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Visszautasítás megerősítése
                  </button>
                  <button
                    onClick={() => setDeclining(false)}
                    className="px-5 py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    Mégse
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Signer status panel */}
        {contract.signers.length > 1 && (
          <div className="mt-6 bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Aláírók státusza
            </h3>
            <div className="space-y-2.5">
              {contract.signers.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        s.status === "signed"
                          ? "bg-emerald-500"
                          : s.status === "pending"
                            ? "bg-amber-400"
                            : "bg-red-400"
                      }`}
                    />
                    <span className="text-sm text-gray-700 font-medium">
                      {s.name}
                    </span>
                    {s.role && (
                      <span className="text-xs text-gray-400">({s.role})</span>
                    )}
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                      s.status === "signed"
                        ? "bg-emerald-50 text-emerald-700"
                        : s.status === "pending"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-red-50 text-red-700"
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
        )}

        {/* Footer */}
        <div className="mt-8 pb-6 text-center">
          <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Biztonságos elektronikus aláírás</span>
            <span className="mx-1">&middot;</span>
            <span className="font-medium text-[#198296]/60">Legitas</span>
          </div>
        </div>
      </div>
    </div>
  );
}
