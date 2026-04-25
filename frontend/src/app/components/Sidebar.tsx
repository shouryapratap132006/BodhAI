"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, BookOpen, Clock, X, Trash2, MessageSquare, TrendingUp } from "lucide-react";
import type { ConversationSummary, Mode } from "../page";

const intentEmoji: Record<string, string> = {
  learn_topic: "📖", solve_question: "🔍", quiz_me: "🎯",
  homework: "📝", revise: "⚡", explain_again: "🔄", get_resources: "📚",
};

const modeColors: Record<string, string> = {
  beginner: "text-emerald-400",
  balanced: "text-blue-400",
  advanced: "text-orange-400",
};

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: number | null;
  onSelect: (conv: ConversationSummary) => void;
  onNewChat: () => void;
  onDelete: (id: number) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenDashboard: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function Sidebar({
  conversations, activeId, onSelect, onNewChat, onDelete, isOpen, onClose, onOpenDashboard
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
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm shadow-orange-500/30">
              <BookOpen className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">
              <span className="text-orange-400">Bodh</span>
              <span className="text-white">AI</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-[#555] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1a1a1a]"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New chat button */}
        <div className="px-3 pt-3 pb-2">
          <button
            id="new-chat-btn"
            onClick={onNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] font-medium
              rounded-lg border border-[#242424] text-[#aaa] hover:text-white
              hover:bg-[#1a1a1a] hover:border-[#2e2e2e] transition-all duration-150 group"
          >
            <Plus className="w-4 h-4 text-orange-500 group-hover:rotate-90 transition-transform duration-200 shrink-0" />
            New Chat
          </button>
        </div>

        {/* Conversations list */}
        <div className="flex-1 overflow-y-auto px-2 py-1">
          {conversations.length > 0 ? (
            <>
              <p className="px-2 pt-2 pb-1.5 text-[11px] font-semibold uppercase tracking-widest text-[#3a3a3a]">
                Recent
              </p>
              <ul className="space-y-0.5">
                {conversations.map((conv) => {
                  const isActive = activeId === conv.id;
                  const emoji = conv.last_message
                    ? (intentEmoji[conv.last_message.intent] ?? "💬")
                    : "💬";
                  return (
                    <li key={conv.id}>
                      <div className={[
                        "group flex items-start gap-1 rounded-lg transition-all duration-150",
                        isActive
                          ? "bg-orange-500/8 border border-orange-500/15"
                          : "border border-transparent hover:bg-[#161616]",
                      ].join(" ")}>
                        <button
                          onClick={() => onSelect(conv)}
                          className="flex-1 text-left px-3 py-2.5 min-w-0"
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[13px]">{emoji}</span>
                            <span className={`truncate text-[13px] leading-snug ${isActive ? "text-white" : "text-[#777] group-hover:text-[#ccc]"}`}>
                              {conv.title || "Untitled"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-medium uppercase tracking-wide ${modeColors[conv.mode] ?? "text-[#555]"}`}>
                              {conv.mode}
                            </span>
                            <span className="text-[10px] text-[#333]">·</span>
                            <span className="text-[10px] text-[#333]">{timeAgo(conv.updated_at)}</span>
                          </div>
                        </button>
                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 mt-2 mr-1 rounded-md text-[#444]
                            hover:text-red-400 hover:bg-red-400/10 transition-all duration-150 shrink-0"
                          aria-label="Delete conversation"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 mt-12 px-4">
              <div className="w-12 h-12 rounded-xl bg-[#111] border border-[#1e1e1e] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#2a2a2a]" />
              </div>
              <p className="text-[12px] text-[#3a3a3a] text-center leading-relaxed">
                Start a conversation to see your history here
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[#1a1a1a]">
          <button onClick={onOpenDashboard} className="w-full flex items-center justify-between group py-1">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <p className="text-[12px] font-medium text-[#ccc] group-hover:text-white transition-colors">Learning Dashboard</p>
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
