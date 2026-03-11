"use client";

import { useRef, useCallback, useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  variables?: string[];
}

const toolbarButtons = [
  { cmd: "bold", icon: "B", title: "Félkövér", style: "font-bold" },
  { cmd: "italic", icon: "I", title: "Dőlt", style: "italic" },
  { cmd: "underline", icon: "U", title: "Aláhúzott", style: "underline" },
  { cmd: "strikeThrough", icon: "S", title: "Áthúzott", style: "line-through" },
  { cmd: "separator" },
  { cmd: "justifyLeft", icon: "\u2190", title: "Balra igazítás" },
  { cmd: "justifyCenter", icon: "\u2194", title: "Középre igazítás" },
  { cmd: "justifyRight", icon: "\u2192", title: "Jobbra igazítás" },
  { cmd: "separator" },
  { cmd: "insertUnorderedList", icon: "\u2022", title: "Felsorolás" },
  { cmd: "insertOrderedList", icon: "1.", title: "Számozott lista" },
  { cmd: "separator" },
  { cmd: "formatBlock_h1", icon: "H1", title: "Főcímsor" },
  { cmd: "formatBlock_h2", icon: "H2", title: "Címsor" },
  { cmd: "formatBlock_h3", icon: "H3", title: "Alcímsor" },
  { cmd: "formatBlock_p", icon: "P", title: "Bekezdés" },
  { cmd: "separator" },
  { cmd: "indent", icon: "\u21E5", title: "Behúzás" },
  { cmd: "outdent", icon: "\u21E4", title: "Behúzás csökkentése" },
  { cmd: "removeFormat", icon: "\u2718", title: "Formázás törlése" },
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

export default function WysiwygEditor({ value, onChange, placeholder, variables }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync value prop to editor only when it changes externally
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
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
              title={btn.title}
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
              <option value="" disabled>+ Változó beszúrása</option>
              {variables.map((v) => (
                <option key={v} value={v}>{`!!${v}!!`}</option>
              ))}
            </select>
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
        data-placeholder={placeholder || "Illessze be vagy írja a szöveget..."}
        className="min-h-[350px] max-h-[600px] overflow-y-auto px-6 py-5 text-sm leading-relaxed text-gray-800 dark:text-gray-100 outline-none focus:ring-2 focus:ring-[#198296]/20 focus:ring-inset empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none prose prose-sm max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mb-2 [&_p]:mb-2 [&_ul]:pl-5 [&_ol]:pl-5 [&_li]:mb-1"
      />
    </div>
  );
}
