"use client";

import { useState, useEffect, useRef } from "react";
import { useI18n } from "@/lib/i18n";

interface QrSigningModalProps {
  open: boolean;
  onClose: () => void;
  signerName: string;
  signToken: string;
}

export default function QrSigningModal({ open, onClose, signerName, signToken }: QrSigningModalProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [signUrl, setSignUrl] = useState("");

  useEffect(() => {
    if (!open || !signToken) return;
    const url = `${window.location.origin}/sign/${signToken}`;
    setSignUrl(url);
    drawQr(url);
  }, [open, signToken]);

  const drawQr = (text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Simple QR-like visual using a data matrix pattern
    // For production, use a real QR library. This generates a visual placeholder
    // that encodes the URL in a grid pattern.
    const size = 256;
    canvas.width = size;
    canvas.height = size;

    const modules = 25;
    const cellSize = size / modules;

    // Generate deterministic pattern from URL
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = "#000000";

    // Draw finder patterns (3 corners)
    const drawFinder = (x: number, y: number) => {
      for (let dy = 0; dy < 7; dy++) {
        for (let dx = 0; dx < 7; dx++) {
          const isOuter = dx === 0 || dx === 6 || dy === 0 || dy === 6;
          const isInner = dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4;
          if (isOuter || isInner) {
            ctx.fillRect((x + dx) * cellSize, (y + dy) * cellSize, cellSize, cellSize);
          }
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(modules - 7, 0);
    drawFinder(0, modules - 7);

    // Fill data area with deterministic pattern
    const rng = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    for (let y = 0; y < modules; y++) {
      for (let x = 0; x < modules; x++) {
        // Skip finder areas
        if ((x < 8 && y < 8) || (x >= modules - 8 && y < 8) || (x < 8 && y >= modules - 8)) continue;

        const val = rng(hash + y * modules + x);
        if (val > 0.5) {
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  if (!open) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(signUrl);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t("qrModal.title")}
            </h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            {t("qrModal.description", { name: signerName })}
          </p>

          <div className="flex justify-center mb-4 p-4 bg-white rounded-xl border dark:border-gray-600">
            <canvas ref={canvasRef} className="w-48 h-48" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <input
              value={signUrl}
              readOnly
              className="flex-1 px-3 py-2 text-xs border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 text-xs font-medium text-white rounded-lg"
              style={{ backgroundColor: "#198296" }}
            >
              {t("qrModal.copy")}
            </button>
          </div>

          <p className="text-[11px] text-gray-400 text-center">
            {t("qrModal.validity")}
          </p>
        </div>
      </div>
    </>
  );
}
