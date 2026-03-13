"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";

interface Version {
  id: string;
  version: number;
  contentHtml: string;
  changeNote?: string | null;
  createdAt: string;
}

function stripHtml(html: string): string[] {
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").split("\n").filter((l) => l.trim());
}

function diffLines(oldLines: string[], newLines: string[]): { type: "same" | "add" | "remove"; text: string }[] {
  const result: { type: "same" | "add" | "remove"; text: string }[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);

  // Simple line-by-line diff
  let oi = 0, ni = 0;
  while (oi < oldLines.length || ni < newLines.length) {
    if (oi < oldLines.length && ni < newLines.length) {
      if (oldLines[oi] === newLines[ni]) {
        result.push({ type: "same", text: newLines[ni] });
        oi++; ni++;
      } else {
        result.push({ type: "remove", text: oldLines[oi] });
        result.push({ type: "add", text: newLines[ni] });
        oi++; ni++;
      }
    } else if (oi < oldLines.length) {
      result.push({ type: "remove", text: oldLines[oi] });
      oi++;
    } else {
      result.push({ type: "add", text: newLines[ni] });
      ni++;
    }
  }
  return result;
}

export default function VersionDiff({ versions }: { versions: Version[] }) {
  const { t } = useI18n();
  const [leftIdx, setLeftIdx] = useState(versions.length > 1 ? 1 : 0);
  const [rightIdx, setRightIdx] = useState(0);

  if (versions.length < 2) {
    return <p className="text-sm text-gray-400 py-4 text-center">{t("versionDiff.minVersions")}</p>;
  }

  const oldLines = stripHtml(versions[leftIdx].contentHtml);
  const newLines = stripHtml(versions[rightIdx].contentHtml);
  const diff = diffLines(oldLines, newLines);

  const changes = diff.filter((d) => d.type !== "same").length;

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">{t("versionDiff.oldVersion")}</label>
          <select
            value={leftIdx}
            onChange={(e) => setLeftIdx(Number(e.target.value))}
            className="w-full px-3 py-1.5 border rounded-lg text-sm"
          >
            {versions.map((v, i) => (
              <option key={v.id} value={i}>v{v.version} — {v.changeNote || t("versionDiff.versionLabel", { num: String(v.version) })}</option>
            ))}
          </select>
        </div>
        <div className="pt-5">
          <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1">{t("versionDiff.newVersion")}</label>
          <select
            value={rightIdx}
            onChange={(e) => setRightIdx(Number(e.target.value))}
            className="w-full px-3 py-1.5 border rounded-lg text-sm"
          >
            {versions.map((v, i) => (
              <option key={v.id} value={i}>v{v.version} — {v.changeNote || t("versionDiff.versionLabel", { num: String(v.version) })}</option>
            ))}
          </select>
        </div>
      </div>

      <p className="text-xs text-gray-400 mb-3">{t("versionDiff.changes", { count: String(changes) })}</p>

      <div className="bg-gray-50 rounded-lg border max-h-96 overflow-y-auto text-sm font-mono">
        {diff.map((line, i) => (
          <div
            key={i}
            className={`px-4 py-1 border-b border-gray-100 last:border-0 ${
              line.type === "add"
                ? "bg-green-50 text-green-800"
                : line.type === "remove"
                ? "bg-red-50 text-red-800 line-through"
                : "text-gray-600"
            }`}
          >
            <span className="inline-block w-6 text-gray-300 mr-2 text-right select-none">
              {line.type === "add" ? "+" : line.type === "remove" ? "-" : " "}
            </span>
            {line.text || "\u00A0"}
          </div>
        ))}
      </div>
    </div>
  );
}
