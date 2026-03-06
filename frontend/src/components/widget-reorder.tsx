"use client";

import { useState, useRef, useCallback } from "react";

interface WidgetReorderProps {
  open: boolean;
  onClose: () => void;
  order: string[];
  onSave: (newOrder: string[]) => void;
}

const WIDGET_LABELS: Record<string, string> = {
  expiring: "Lejaro szerzodesek",
  awaiting: "Alairasra var",
  completed: "Nemreg kesz",
  activity: "Tevekenyseg",
  chart: "Havi grafikon",
  usage: "Hasznalat",
};

export default function WidgetReorder({
  open,
  onClose,
  order,
  onSave,
}: WidgetReorderProps) {
  const [items, setItems] = useState<string[]>(order);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragNode = useRef<HTMLLIElement | null>(null);

  // Reset items when the modal opens with a new order
  const prevOpenRef = useRef(open);
  if (open && !prevOpenRef.current) {
    // fresh open – sync state
    if (JSON.stringify(items) !== JSON.stringify(order)) {
      setItems(order);
    }
  }
  prevOpenRef.current = open;

  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLLIElement>, index: number) => {
      setDragIndex(index);
      dragNode.current = e.currentTarget;
      e.dataTransfer.effectAllowed = "move";
      // Make the drag image slightly transparent
      requestAnimationFrame(() => {
        if (dragNode.current) {
          dragNode.current.style.opacity = "0.4";
        }
      });
    },
    []
  );

  const handleDragEnter = useCallback(
    (index: number) => {
      if (dragIndex === null || dragIndex === index) return;
      setOverIndex(index);
      setItems((prev) => {
        const updated = [...prev];
        const [removed] = updated.splice(dragIndex, 1);
        updated.splice(index, 0, removed);
        return updated;
      });
      setDragIndex(index);
    },
    [dragIndex]
  );

  const handleDragEnd = useCallback(() => {
    if (dragNode.current) {
      dragNode.current.style.opacity = "1";
    }
    setDragIndex(null);
    setOverIndex(null);
    dragNode.current = null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleSave = () => {
    localStorage.setItem("dashboard_widget_order", JSON.stringify(items));
    onSave(items);
    onClose();
  };

  const handleCancel = () => {
    setItems(order);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-xl bg-white shadow-2xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Widget sorrend
          </h2>
          <button
            onClick={handleCancel}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* List */}
        <ul className="px-6 py-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {items.map((key, index) => (
            <li
              key={key}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 rounded-lg border px-4 py-3 cursor-grab active:cursor-grabbing
                transition-all duration-200 ease-in-out select-none
                ${
                  dragIndex === index
                    ? "border-[#198296] bg-[#198296]/10 dark:bg-[#198296]/20 scale-[1.02] shadow-lg"
                    : overIndex === index
                    ? "border-[#198296]/50 bg-gray-50 dark:bg-gray-700/50"
                    : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-600 dark:bg-gray-750 dark:hover:border-gray-500"
                }
              `}
            >
              {/* Drag handle – 3 horizontal lines */}
              <div className="flex flex-col gap-[3px] text-gray-400 dark:text-gray-500 flex-shrink-0">
                <span className="block h-[2px] w-4 rounded-full bg-current" />
                <span className="block h-[2px] w-4 rounded-full bg-current" />
                <span className="block h-[2px] w-4 rounded-full bg-current" />
              </div>

              {/* Index badge */}
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#198296]/10 text-xs font-semibold text-[#198296] dark:bg-[#198296]/20">
                {index + 1}
              </span>

              {/* Label */}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {WIDGET_LABELS[key] ?? key}
              </span>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button
            onClick={handleCancel}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          >
            Megse
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#198296" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#14697a")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#198296")
            }
          >
            Mentes
          </button>
        </div>
      </div>
    </div>
  );
}
