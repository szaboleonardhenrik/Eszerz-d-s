"use client";

import { useRef, useCallback } from "react";

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
  { cmd: "formatBlock_h2", icon: "H2", title: "Címsor" },
  { cmd: "formatBlock_h3", icon: "H3", title: "Alcímsor" },
  { cmd: "formatBlock_p", icon: "P", title: "Bekezdés" },
];

export default function WysiwygEditor({ value, onChange, placeholder, variables }: WysiwygEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const execCmd = useCallback((cmd: string) => {
    if (cmd.startsWith("formatBlock_")) {
      const tag = cmd.replace("formatBlock_", "");
      document.execCommand("formatBlock", false, tag);
    } else {
      document.execCommand(cmd, false);
    }
    if (editorRef.current) {
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
      span.textContent = `{{${varName}}}`;
      range.deleteContents();
      range.insertNode(span);
      range.setStartAfter(span);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain");
    document.execCommand("insertHTML", false, text);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  return (
    <div className="border rounded-xl overflow-hidden bg-white dark:bg-gray-800">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b bg-gray-50 dark:bg-gray-700">
        {toolbarButtons.map((btn, i) => {
          if (btn.cmd === "separator") {
            return <div key={i} className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />;
          }
          return (
            <button
              key={btn.cmd}
              type="button"
              onClick={() => execCmd(btn.cmd)}
              title={btn.title}
              className={`w-8 h-8 flex items-center justify-center rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition ${btn.style || ""}`}
            >
              {btn.icon}
            </button>
          );
        })}

        {variables && variables.length > 0 && (
          <>
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  insertVariable(e.target.value);
                  e.target.value = "";
                }
              }}
              className="text-xs px-2 py-1 border rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              defaultValue=""
            >
              <option value="" disabled>+ Változó</option>
              {variables.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        dangerouslySetInnerHTML={{ __html: value }}
        data-placeholder={placeholder || "Kezdjen el írni..."}
        className="min-h-[300px] max-h-[600px] overflow-y-auto px-6 py-4 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-[#198296] focus:ring-inset empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none prose prose-sm max-w-none"
      />
    </div>
  );
}
