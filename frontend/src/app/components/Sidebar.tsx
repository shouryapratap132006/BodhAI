"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Clock, X } from "lucide-react";

type Mode = "beginner" | "balanced" | "advanced";

type HistoryItem = {
  id: number;
  input_text: string;
  mode: Mode;
  explanation: string;
  steps: string[];
  question: string;
  file_type: string | null;
  created_at: string;
};

interface SidebarProps {
  history: HistoryItem[];
  activeId: number | null;
  onSelect: (item: HistoryItem) => void;
  onNewTopic: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const modeColors: Record<Mode, string> = {
  beginner: "text-emerald-400",
  balanced: "text-blue-400",
  advanced: "text-orange-400",
};

export default function Sidebar({
  history,
  activeId,
  onSelect,
  onNewTopic,
  isOpen,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={[
          "fixed inset-y-0 left-0 z-40 flex flex-col w-[260px]",
          "bg-[#0d0d0d] border-r border-[#1e1e1e]",
          "transform transition-transform duration-250 ease-out",
          "md:relative md:translate-x-0 md:flex-shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Logo + close */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">
              <span className="text-orange-400">Bodh</span>
              <span className="text-white">AI</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-[#555] hover:text-white transition-colors p-1"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New topic button */}
        <div className="px-3 pt-3 pb-2">
          <button
            id="new-topic-btn"
            onClick={onNewTopic}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium
              rounded-lg border border-[#242424] text-[#aaa] hover:text-white
              hover:bg-[#1a1a1a] hover:border-[#2e2e2e] transition-all duration-150 group"
          >
            <Plus className="w-4 h-4 text-orange-500 group-hover:rotate-90 transition-transform duration-200" />
            New Topic
          </button>
        </div>

        {/* History list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {history.length > 0 ? (
            <>
              <p className="px-2 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#3a3a3a]">
                Recent
              </p>
              <ul className="space-y-0.5">
                {history.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelect(item)}
                      className={[
                        "w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150",
                        "flex flex-col gap-0.5 outline-none",
                        activeId === item.id
                          ? "bg-orange-500/8 text-white border border-orange-500/15"
                          : "text-[#777] hover:text-[#ccc] hover:bg-[#161616]",
                      ].join(" ")}
                    >
                      <span className="truncate leading-snug">
                        {item.input_text || (item.file_type ? "📄 Document" : "Topic")}
                      </span>
                      <span
                        className={`text-[10px] font-medium uppercase tracking-wide ${modeColors[item.mode]}`}
                      >
                        {item.mode}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 mt-12 px-4">
              <Clock className="w-8 h-8 text-[#2a2a2a]" />
              <p className="text-[12px] text-[#3a3a3a] text-center leading-relaxed">
                Your learning history will appear here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1a1a1a]">
          <p className="text-[10px] text-[#333] text-center">
            BodhAI · Intelligent Learning
          </p>
        </div>
      </aside>
    </>
  );
}
