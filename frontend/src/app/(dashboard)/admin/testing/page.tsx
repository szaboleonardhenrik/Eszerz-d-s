"use client";

import { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

// ─── Types ───

interface TestCase {
  id: string;
  sectionId: string;
  title: string;
  description: string;
  steps: string[];
  expected: string;
  priority: string;
  sortOrder: number;
  status: string;
  assignedTo: string | null;
  notes: string | null;
  screenshots: string[];
  createdBy: string | null;
  updatedBy: string | null;
}

interface TestSection {
  id: string;
  title: string;
  icon: string;
  category: string;
  sortOrder: number;
  cases: TestCase[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ─── Constants ───

const CATEGORIES = ["Sales", "Back office", "Dev", "QA", "General"];

const categoryColors: Record<string, string> = {
  Sales: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  "Back office": "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  Dev: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  QA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  General: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Várakozik", color: "text-gray-500", bg: "bg-gray-100" },
  in_progress: { label: "Folyamatban", color: "text-blue-600", bg: "bg-blue-100" },
  pass: { label: "Sikeres", color: "text-green-600", bg: "bg-green-100" },
  fail: { label: "Sikertelen", color: "text-red-600", bg: "bg-red-100" },
  blocked: { label: "Blokkolva", color: "text-orange-600", bg: "bg-orange-100" },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  critical: { label: "Kritikus", color: "text-red-600 bg-red-50 border-red-200" },
  high: { label: "Magas", color: "text-orange-600 bg-orange-50 border-orange-200" },
  medium: { label: "Közepes", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
  low: { label: "Alacsony", color: "text-gray-500 bg-gray-50 border-gray-200" },
};

const ICONS = ["🔐", "📝", "✍️", "📋", "⚙️", "🌐", "📱", "⚡", "🔔", "💳", "📊", "🛡️", "🔍", "📦", "🎯"];

// ─── Main Page ───

export default function TestingPage() {
  const [sections, setSections] = useState<TestSection[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [showAddSection, setShowAddSection] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [sectionsRes, teamRes] = await Promise.all([
        api.get("/admin/testing/sections"),
        api.get("/admin/testing/team"),
      ]);
      setSections(sectionsRes.data.data);
      setTeam(teamRes.data.data);
    } catch {
      toast.error("Hiba a betöltéskor");
    } finally {
      setLoading(false);
    }
  };

  // ─── Section CRUD ───

  const createSection = async (title: string, icon: string, category: string) => {
    try {
      const res = await api.post("/admin/testing/sections", { title, icon, category });
      setSections((prev) => [...prev, res.data.data]);
      setShowAddSection(false);
      toast.success("Szekció létrehozva");
    } catch { toast.error("Hiba"); }
  };

  const updateSection = async (id: string, data: Partial<TestSection>) => {
    try {
      const res = await api.put(`/admin/testing/sections/${id}`, data);
      setSections((prev) => prev.map((s) => (s.id === id ? res.data.data : s)));
    } catch { toast.error("Hiba a mentéskor"); }
  };

  const deleteSection = async (id: string) => {
    try {
      await api.delete(`/admin/testing/sections/${id}`);
      setSections((prev) => prev.filter((s) => s.id !== id));
      toast.success("Szekció törölve");
    } catch { toast.error("Hiba"); }
  };

  // ─── Case CRUD ───

  const createCase = async (sectionId: string, title: string) => {
    try {
      const res = await api.post("/admin/testing/cases", { sectionId, title });
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, cases: [...s.cases, res.data.data] } : s))
      );
    } catch { toast.error("Hiba"); }
  };

  const updateCase = async (sectionId: string, caseId: string, data: Partial<TestCase>) => {
    try {
      const res = await api.put(`/admin/testing/cases/${caseId}`, data);
      setSections((prev) =>
        prev.map((s) =>
          s.id === sectionId ? { ...s, cases: s.cases.map((c) => (c.id === caseId ? { ...res.data.data, sectionId } : c)) } : s
        )
      );
    } catch { toast.error("Hiba a mentéskor"); }
  };

  const deleteCase = async (sectionId: string, caseId: string) => {
    try {
      await api.delete(`/admin/testing/cases/${caseId}`);
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, cases: s.cases.filter((c) => c.id !== caseId) } : s))
      );
    } catch { toast.error("Hiba"); }
  };

  // ─── Stats ───

  const allCases = sections.flatMap((s) => s.cases);
  const totalCases = allCases.length;
  const passed = allCases.filter((c) => c.status === "pass").length;
  const failed = allCases.filter((c) => c.status === "fail").length;
  const inProgress = allCases.filter((c) => c.status === "in_progress").length;

  const filterCase = (tc: TestCase) => {
    if (filter === "pending") return tc.status === "pending";
    if (filter === "fail") return tc.status === "fail";
    return true;
  };

  if (loading) return <div className="p-12 text-center text-gray-400">Betöltés...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Rendszer Tesztelés</h1>
          <p className="text-sm text-gray-500 mt-1">Szekciók, teszt esetek kezelése és kiosztása</p>
        </div>
        <button
          onClick={() => setShowAddSection(true)}
          className="px-4 py-2 bg-[#198296] text-white rounded-xl text-sm font-medium hover:bg-[#146d7d] transition"
        >
          + Új szekció
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { n: totalCases, label: "Összes", color: "text-gray-900 dark:text-white" },
          { n: passed, label: "Sikeres", color: "text-green-600" },
          { n: failed, label: "Sikertelen", color: "text-red-600" },
          { n: inProgress, label: "Folyamatban", color: "text-blue-600" },
          { n: totalCases - passed - failed - inProgress, label: "Hátra", color: "text-gray-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.n}</div>
            <div className="text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden flex">
        {passed > 0 && <div className="bg-green-500 transition-all" style={{ width: `${(passed / totalCases) * 100}%` }} />}
        {failed > 0 && <div className="bg-red-500 transition-all" style={{ width: `${(failed / totalCases) * 100}%` }} />}
        {inProgress > 0 && <div className="bg-blue-400 transition-all" style={{ width: `${(inProgress / totalCases) * 100}%` }} />}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Mind" },
          { key: "pending", label: "Várakozik" },
          { key: "fail", label: "Sikertelen" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              filter === f.key ? "bg-[#198296] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Add section modal */}
      {showAddSection && (
        <AddSectionForm
          onSave={createSection}
          onCancel={() => setShowAddSection(false)}
        />
      )}

      {/* Sections */}
      {sections.map((section) => {
        const filteredCases = section.cases.filter(filterCase);
        if (filteredCases.length === 0 && filter !== "all") return null;
        const sectionPassed = section.cases.filter((c) => c.status === "pass").length;

        return (
          <div key={section.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Section header */}
            <SectionHeader
              section={section}
              sectionPassed={sectionPassed}
              expanded={expandedSection === section.id}
              onToggle={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              onUpdate={(data) => updateSection(section.id, data)}
              onDelete={() => { if (confirm(`Biztosan törlöd: "${section.title}"? Minden benne lévő teszt is törlődik!`)) deleteSection(section.id); }}
            />

            {expandedSection === section.id && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                {(filter === "all" ? section.cases : filteredCases).map((tc) => (
                  <CaseRow
                    key={tc.id}
                    tc={tc}
                    team={team}
                    expanded={expandedCase === tc.id}
                    onToggle={() => setExpandedCase(expandedCase === tc.id ? null : tc.id)}
                    onUpdate={(data) => updateCase(section.id, tc.id, data)}
                    onDelete={() => { if (confirm(`Törlöd: "${tc.title}"?`)) deleteCase(section.id, tc.id); }}
                  />
                ))}
                {/* Add case */}
                <AddCaseInline sectionId={section.id} onCreate={createCase} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Add Section Form ───

function AddSectionForm({ onSave, onCancel }: { onSave: (title: string, icon: string, category: string) => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState("📋");
  const [category, setCategory] = useState("General");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-[#198296] p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Új szekció hozzáadása</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Cím</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="pl. Aláírási Folyamat"
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white" />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Ikon</label>
          <div className="flex gap-1 flex-wrap">
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setIcon(ic)}
                className={`w-8 h-8 rounded-lg text-lg flex items-center justify-center transition ${icon === ic ? "bg-[#198296]/20 ring-2 ring-[#198296]" : "hover:bg-gray-100 dark:hover:bg-gray-600"}`}
              >{ic}</button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1 block">Kategória</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => { if (title.trim()) onSave(title.trim(), icon, category); }}
          disabled={!title.trim()}
          className="px-4 py-2 bg-[#198296] text-white rounded-lg text-sm font-medium hover:bg-[#146d7d] transition disabled:opacity-40">
          Létrehozás
        </button>
        <button onClick={onCancel} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 transition">
          Mégse
        </button>
      </div>
    </div>
  );
}

// ─── Section Header (editable) ───

function SectionHeader({
  section, sectionPassed, expanded, onToggle, onUpdate, onDelete,
}: {
  section: TestSection; sectionPassed: number; expanded: boolean;
  onToggle: () => void; onUpdate: (data: Partial<TestSection>) => void; onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  const [editIcon, setEditIcon] = useState(section.icon);
  const [editCategory, setEditCategory] = useState(section.category);

  const saveEdit = () => {
    if (editTitle.trim() && (editTitle !== section.title || editIcon !== section.icon || editCategory !== section.category)) {
      onUpdate({ title: editTitle.trim(), icon: editIcon, category: editCategory });
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="px-5 py-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex gap-3 items-center">
          <div className="flex gap-1 flex-wrap">
            {ICONS.map((ic) => (
              <button key={ic} onClick={() => setEditIcon(ic)}
                className={`w-7 h-7 rounded text-sm flex items-center justify-center ${editIcon === ic ? "bg-[#198296]/20 ring-2 ring-[#198296]" : "hover:bg-gray-100 dark:hover:bg-gray-600"}`}
              >{ic}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white font-semibold"
            onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); if (e.key === "Escape") setEditing(false); }}
            autoFocus />
          <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <button onClick={saveEdit} className="px-3 py-2 bg-[#198296] text-white rounded-lg text-xs font-medium">Mentés</button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs">Mégse</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <button onClick={onToggle} className="flex-1 px-5 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
        <div className="flex items-center gap-3">
          <span className="text-xl">{section.icon}</span>
          <span className="font-semibold text-gray-900 dark:text-white">{section.title}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${categoryColors[section.category] || categoryColors.General}`}>
            {section.category}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            sectionPassed === section.cases.length && section.cases.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            {sectionPassed}/{section.cases.length}
          </span>
        </div>
        <svg className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {/* Edit / Delete buttons */}
      <div className="flex gap-1 pr-3">
        <button onClick={() => { setEditTitle(section.title); setEditIcon(section.icon); setEditCategory(section.category); setEditing(true); }}
          className="p-2 text-gray-300 hover:text-[#198296] transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Szerkesztés">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button onClick={onDelete}
          className="p-2 text-gray-300 hover:text-red-500 transition rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" title="Törlés">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── Add case inline ───

function AddCaseInline({ sectionId, onCreate }: { sectionId: string; onCreate: (sectionId: string, title: string) => void }) {
  const [title, setTitle] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="w-full px-5 py-3 text-left text-sm text-gray-400 hover:text-[#198296] hover:bg-gray-50 dark:hover:bg-gray-700/30 transition flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Új teszt eset hozzáadása...
      </button>
    );
  }

  return (
    <div className="px-5 py-3 flex gap-2 items-center bg-gray-50/50 dark:bg-gray-700/20">
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Teszt eset neve..."
        className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter" && title.trim()) { onCreate(sectionId, title.trim()); setTitle(""); }
          if (e.key === "Escape") { setOpen(false); setTitle(""); }
        }} />
      <button onClick={() => { if (title.trim()) { onCreate(sectionId, title.trim()); setTitle(""); } }}
        disabled={!title.trim()}
        className="px-3 py-2 bg-[#198296] text-white rounded-lg text-xs font-medium hover:bg-[#146d7d] transition disabled:opacity-40">
        Hozzáadás
      </button>
      <button onClick={() => { setOpen(false); setTitle(""); }}
        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-500">Mégse</button>
    </div>
  );
}

// ─── Case Row (expandable, editable) ───

function CaseRow({
  tc, team, expanded, onToggle, onUpdate, onDelete,
}: {
  tc: TestCase; team: TeamMember[]; expanded: boolean;
  onToggle: () => void; onUpdate: (data: Partial<TestCase & { screenshotBase64?: string }>) => void; onDelete: () => void;
}) {
  const [editTitle, setEditTitle] = useState(tc.title);
  const [editDesc, setEditDesc] = useState(tc.description);
  const [editSteps, setEditSteps] = useState(tc.steps.join("\n"));
  const [editExpected, setEditExpected] = useState(tc.expected);
  const [notes, setNotes] = useState(tc.notes || "");
  const [editingTitle, setEditingTitle] = useState(false);
  const [uploading, setUploading] = useState(false);
  const screenshotRef = useRef<HTMLInputElement>(null);

  const status = tc.status || "pending";
  const sc = statusConfig[status] || statusConfig.pending;
  const pc = priorityConfig[tc.priority];

  return (
    <div className="border-b border-gray-50 dark:border-gray-700/50 last:border-0">
      {/* Row header */}
      <div className="flex items-center">
        <button onClick={onToggle} className="flex-1 px-5 py-3 flex items-center gap-3 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition text-left">
          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
            status === "pass" ? "bg-green-500" : status === "fail" ? "bg-red-500" : status === "in_progress" ? "bg-blue-500" : status === "blocked" ? "bg-orange-500" : "bg-gray-300"
          }`} />
          <span className="text-sm flex-1 text-gray-700 dark:text-gray-300 font-medium">{tc.title}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${pc?.color || ""}`}>{pc?.label || tc.priority}</span>
          {tc.assignedTo && <span className="text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full">{tc.assignedTo}</span>}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.color}`}>{sc.label}</span>
          <svg className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button onClick={onDelete} className="p-2 mr-3 text-gray-300 hover:text-red-500 transition" title="Törlés">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Expanded details — all editable */}
      {expanded && (
        <div className="px-5 pb-5 ml-5 space-y-4">
          {/* Title (editable) */}
          {editingTitle ? (
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              onBlur={() => { if (editTitle.trim() && editTitle !== tc.title) onUpdate({ title: editTitle.trim() }); setEditingTitle(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { if (editTitle.trim() && editTitle !== tc.title) onUpdate({ title: editTitle.trim() }); setEditingTitle(false); } }}
              className="w-full px-3 py-2 border border-[#198296] rounded-lg text-sm font-semibold bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#198296]/30"
              autoFocus />
          ) : (
            <h3 onClick={() => { setEditTitle(tc.title); setEditingTitle(true); }}
              className="text-sm font-semibold text-gray-800 dark:text-white cursor-pointer hover:text-[#198296] transition" title="Kattints a szerkesztéshez">
              {tc.title}
            </h3>
          )}

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Leírás</label>
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
              onBlur={() => { if (editDesc !== tc.description) onUpdate({ description: editDesc }); }}
              rows={2} placeholder="Rövid leírás..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white resize-none focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/30" />
          </div>

          {/* Steps */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Lépések (soronként egy)</label>
            <textarea value={editSteps} onChange={(e) => setEditSteps(e.target.value)}
              onBlur={() => {
                const newSteps = editSteps.split("\n").filter((s) => s.trim());
                if (JSON.stringify(newSteps) !== JSON.stringify(tc.steps)) onUpdate({ steps: newSteps });
              }}
              rows={Math.max(3, editSteps.split("\n").length)} placeholder="1. Nyisd meg az oldalt&#10;2. Kattints a gombra&#10;3. Ellenőrizd..."
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white resize-none font-mono focus:border-[#198296] focus:ring-1 focus:ring-[#198296]/30" />
          </div>

          {/* Expected */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Elvárt eredmény</label>
            <textarea value={editExpected} onChange={(e) => setEditExpected(e.target.value)}
              onBlur={() => { if (editExpected !== tc.expected) onUpdate({ expected: editExpected }); }}
              rows={2} placeholder="Mi az elvárt viselkedés?"
              className="w-full px-3 py-2 border border-blue-200 dark:border-blue-800 rounded-lg text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 resize-none focus:ring-1 focus:ring-blue-300" />
          </div>

          {/* Priority + Assignee row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Prioritás</label>
              <select value={tc.priority} onChange={(e) => onUpdate({ priority: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
                {Object.entries(priorityConfig).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Felelős</label>
              <select value={tc.assignedTo || ""} onChange={(e) => onUpdate({ assignedTo: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white">
                <option value="">Nincs kijelölve</option>
                {team.map((m) => <option key={m.id} value={m.name}>{m.name} ({m.role})</option>)}
              </select>
            </div>
          </div>

          {/* Status buttons */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Státusz</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusConfig).map(([key, cfg]) => (
                <button key={key} onClick={() => onUpdate({ status: key })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                    status === key ? `${cfg.bg} ${cfg.color} border-current ring-2 ring-current/20` : "border-gray-200 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">Megjegyzés</label>
            <div className="flex gap-2">
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Mi volt a hiba? Részletek..." rows={2}
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 dark:text-white resize-none" />
              <button onClick={() => { onUpdate({ notes }); toast.success("Mentve"); }}
                className="px-3 py-2 bg-[#198296] text-white rounded-lg text-xs font-medium hover:bg-[#146d7d] transition self-end">Mentés</button>
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Screenshotok</label>
            {(tc.screenshots?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tc.screenshots.map((key, i) => <ScreenshotThumb key={i} storageKey={key} />)}
              </div>
            )}
            <button onClick={() => screenshotRef.current?.click()} disabled={uploading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-xs text-gray-500 hover:border-[#198296] hover:text-[#198296] transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {uploading ? "Feltöltés..." : "Screenshot feltöltése"}
            </button>
            <input ref={screenshotRef} type="file" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB"); return; }
                setUploading(true);
                const reader = new FileReader();
                reader.onload = async () => { onUpdate({ screenshotBase64: reader.result as string } as Partial<TestCase>); toast.success("Feltöltve!"); setUploading(false); };
                reader.readAsDataURL(file);
                e.target.value = "";
              }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Screenshot Thumb ───

function ScreenshotThumb({ storageKey }: { storageKey: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    api.get("/admin/testing/screenshot", { params: { key: storageKey } })
      .then((res) => setUrl(res.data.data.url)).catch(() => {});
  }, [storageKey]);

  if (!url) return <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />;

  return (
    <>
      <button onClick={() => setFullscreen(true)} className="relative group">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Screenshot" className="w-16 h-16 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:ring-2 hover:ring-[#198296] transition" />
      </button>
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setFullscreen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Screenshot nagyítva" className="max-w-full max-h-full rounded-lg shadow-2xl" />
          <button onClick={() => setFullscreen(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white text-xl transition">✕</button>
        </div>
      )}
    </>
  );
}
