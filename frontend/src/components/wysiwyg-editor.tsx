"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useI18n } from "@/lib/i18n";
import ClauseInsertPanel from "./clause-insert-panel";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  variables?: string[];
  showClauseInsert?: boolean;
}

const toolbarButtons = [
  { cmd: "bold", icon: "B", titleKey: "wysiwyg.bold", style: "font-bold" },
  { cmd: "italic", icon: "I", titleKey: "wysiwyg.italic", style: "italic" },
  { cmd: "underline", icon: "U", titleKey: "wysiwyg.underline", style: "underline" },
  { cmd: "strikeThrough", icon: "S", titleKey: "wysiwyg.strikethrough", style: "line-through" },
  { cmd: "separator" },
  { cmd: "justifyLeft", icon: "\u2190", titleKey: "wysiwyg.alignLeft" },
  { cmd: "justifyCenter", icon: "\u2194", titleKey: "wysiwyg.alignCenter" },
  { cmd: "justifyRight", icon: "\u2192", titleKey: "wysiwyg.alignRight" },
  { cmd: "separator" },
  { cmd: "insertUnorderedList", icon: "\u2022", titleKey: "wysiwyg.bulletList" },
  { cmd: "insertOrderedList", icon: "1.", titleKey: "wysiwyg.numberedList" },
  { cmd: "separator" },
  { cmd: "formatBlock_h1", icon: "H1", titleKey: "wysiwyg.heading1" },
  { cmd: "formatBlock_h2", icon: "H2", titleKey: "wysiwyg.heading2" },
  { cmd: "formatBlock_h3", icon: "H3", titleKey: "wysiwyg.heading3" },
  { cmd: "formatBlock_p", icon: "P", titleKey: "wysiwyg.paragraph" },
  { cmd: "separator" },
  { cmd: "indent", icon: "\u21E5", titleKey: "wysiwyg.indent" },
  { cmd: "outdent", icon: "\u21E4", titleKey: "wysiwyg.outdent" },
  { cmd: "removeFormat", icon: "\u2718", titleKey: "wysiwyg.removeFormat" },
];

/** Convert plain text to structured HTML paragraphs */
function plainTextToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block.trim().split(/\n/);
      return `<p>${lines.join("<br>")}</p>`;
    })
    .filter((p) => p !== "<p></p>")
    .join("");
}

export default function WysiwygEditor({ value, onChange, placeholder, variables, showClauseInsert = true }: WysiwygEditorProps) {
  const { t } = useI18n();
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);
  const [clausePanelOpen, setClausePanelOpen] = useState(false);

  const insertClauseHtml = useCallback((html: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, html);
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Sync value prop to editor only when it changes externally
  // Skip sync when editor is focused (user is typing) to prevent cursor jumping
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      const isFocused = document.activeElement === editorRef.current || editorRef.current.contains(document.activeElement);
      if (!isFocused && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const execCmd = useCallback((cmd: string) => {
    if (cmd.startsWith("formatBlock_")) {
      const tag = cmd.replace("formatBlock_", "");
      document.execCommand("formatBlock", false, tag);
    } else {
      document.execCommand(cmd, false);
    }
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const insertVariable = useCallback((varName: string) => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      const span = document.createElement("span");
      span.style.backgroundColor = "#dbeafe";
      span.style.padding = "2px 6px";
      span.style.borderRadius = "4px";
      span.style.fontWeight = "600";
      span.style.fontSize = "0.875rem";
      span.contentEditable = "false";
      span.textContent = `!!${varName}!!`;
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();

    const htmlData = e.clipboardData.getData("text/html");
    const plainData = e.clipboardData.getData("text/plain");

    if (htmlData) {
      // HTML paste — sanitize and insert
      document.execCommand("insertHTML", false, sanitizeHtml(htmlData));
    } else if (plainData) {
      // Plain text paste — convert to structured HTML paragraphs
      const html = plainTextToHtml(plainData);
      document.execCommand("insertHTML", false, html);
    }

    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
        {toolbarButtons.map((btn, i) => {
          if (btn.cmd === "separator") {
            return <div key={i} className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-0.5" />;
          }
          return (
            <button
              key={btn.cmd}
              type="button"
              onClick={() => execCmd(btn.cmd)}
              title={btn.titleKey ? t(btn.titleKey) : ""}
              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors ${btn.style || ""}`}
            >
              {btn.icon}
            </button>
          );
        })}

        {variables && variables.length > 0 && (
          <>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-0.5" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  insertVariable(e.target.value);
                  e.target.value = "";
                }
              }}
              className="text-xs px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:border-[#198296] transition-colors"
              defaultValue=""
            >
              <option value="" disabled>{t("wysiwyg.insertVariable")}</option>
              {variables.map((v) => (
                <option key={v} value={v}>{`!!${v}!!`}</option>
              ))}
            </select>
          </>
        )}

        {showClauseInsert && (
          <>
            <div className="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-0.5" />
            <button
              type="button"
              onClick={() => setClausePanelOpen(true)}
              title={t("clauses.insertTitle")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-pointer hover:border-[#198296] hover:text-[#198296] transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              {t("clauses.insertBtn")}
            </button>
          </>
        )}
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder || t("wysiwyg.defaultPlaceholder")}
        className="min-h-[350px] max-h-[600px] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#198296]/20 focus:ring-inset empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1"
      />

      {showClauseInsert && (
        <ClauseInsertPanel
          open={clausePanelOpen}
          onClose={() => setClausePanelOpen(false)}
          onInsert={insertClauseHtml}
        />
      )}
    </div>
  );
}
