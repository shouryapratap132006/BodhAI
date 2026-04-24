"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, BookOpen } from "lucide-react";
import Sidebar from "./components/Sidebar";
import InputBox from "./components/InputBox";
import ChatMessage from "./components/ChatMessage";

// ── Types ──────────────────────────────────────────────────────────────────
export type Intent =
  | "learn_topic"
  | "solve_question"
  | "quiz_me"
  | "homework"
  | "revise"
  | "explain_again";

export type ResponseType = "learn" | "solve" | "quiz" | "homework" | "revise";
export type Mode = "beginner" | "balanced" | "advanced";

export type Resource = { title: string; type: "article" | "video"; link: string };
export type Question = {
  type: "mcq" | "short" | "easy" | "medium" | "hard" | "challenge" | "conceptual";
  text: string;
  options?: string[];
  answer?: string;
  hint?: string;
};
export type Evaluation = { correct: boolean; feedback: string };

export type TurnMessage = {
  role: "user" | "assistant";
  content?: string;             // user text
  // assistant payload
  intent?: Intent;
  type?: ResponseType;
  explanation?: string;
  steps?: string[];
  hint?: string;
  solution?: string;
  example?: string;
  questions?: Question[];
  student_attempt?: string;
  evaluation?: Evaluation;
  improved_explanation?: string;
  resources?: Resource[];
};

export type ConversationSummary = {
  id: number;
  title: string;
  mode: Mode;
  created_at: string;
  updated_at: string;
  last_message?: { intent: string; user_input: string } | null;
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

const ACTION_CHIPS = [
  { label: "Learn a topic", example: "Explain Newton's laws of motion" },
  { label: "Solve a problem", example: "How do I solve a quadratic equation?" },
  { label: "Quiz me", example: "Quiz me on photosynthesis" },
  { label: "Homework", example: "Give me practice problems on integration" },
  { label: "Revise", example: "Quick revision of World War II causes" },
  { label: "Explain again", example: "Explain recursion in simpler terms" },
];

// ── Empty / Welcome state ──────────────────────────────────────────────────
function EmptyState({ onChipClick }: { onChipClick: (text: string) => void }) {


  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center select-none pt-16 pb-8"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20"
      >
        <BookOpen className="w-8 h-8 text-white" strokeWidth={2} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-[34px] md:text-[42px] font-semibold tracking-tight glow-text mb-2"
      >
        <span className="text-orange-400">Bodh</span>
        <span className="text-white">AI</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-[15px] text-[#4a4a58] max-w-sm font-light mb-10"
      >
        Your personal AI tutor. Teach, test, guide and adapt — just like a real teacher.
      </motion.p>

      {/* Prompt chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-[560px] px-2"
      >
        {ACTION_CHIPS.map((chip, i) => (
          <button
            key={i}
            onClick={() => onChipClick(chip.example)}
            className="text-left px-4 py-3 rounded-xl border border-[#1e1e1e] bg-[#0f0f0f]
              hover:border-orange-500/30 hover:bg-[#141414] transition-all duration-200 group w-full"
          >
            <p className="text-[12px] font-semibold text-orange-500/80 mb-0.5 uppercase tracking-wider">
              {chip.label}
            </p>
            <p className="text-[13px] text-[#444] group-hover:text-[#666] transition-colors leading-snug">
              {chip.example}
            </p>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// ── Typing indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 mt-0.5">
        <BookOpen className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      <div className="flex items-center gap-1.5 bg-[#141414] border border-[#242424] rounded-2xl rounded-tl-sm px-4 py-3">
        {[0, 0.15, 0.3].map((delay, i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-orange-500/60"
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("balanced");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Chat turns: array of user + assistant messages
  const [turns, setTurns] = useState<TurnMessage[]>([]);
  const [activeConvId, setActiveConvId] = useState<number | null>(null);

  // Sidebar conversations list
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // ── Load conversations list ───────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/conversations/`);
      if (!res.ok) return;
      const data: ConversationSummary[] = await res.json();
      setConversations(data);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Auto-scroll ───────────────────────────────────────────────────
  useEffect(() => {
    if (turns.length > 0 || loading) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [turns, loading]);

  // ── Resize handler ────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setSidebarOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Send message ──────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() && !file) return;
    setLoading(true);
    setError(null);

    const userMessage: TurnMessage = { role: "user", content: input };
    setTurns(prev => [...prev, userMessage]);

    const formData = new FormData();
    formData.append("input", input);
    formData.append("mode", mode);
    if (activeConvId) formData.append("conversation_id", String(activeConvId));
    if (file) formData.append("file", file);

    setInput("");
    setFile(null);

    try {
      const res = await fetch(`${API_URL}/chat/`, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();

      // Set active conversation
      if (data.conversation_id) setActiveConvId(data.conversation_id);

      const assistantMessage: TurnMessage = {
        role: "assistant",
        intent: data.intent,
        type: data.type,
        explanation: data.explanation,
        steps: data.steps,
        hint: data.hint,
        solution: data.solution,
        example: data.example,
        questions: data.questions,
        student_attempt: data.student_attempt,
        evaluation: data.evaluation,
        improved_explanation: data.improved_explanation,
        resources: data.resources,
      };
      setTurns(prev => [...prev, assistantMessage]);
      loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
      // Remove the optimistic user message on error
      setTurns(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  // ── Load existing conversation ────────────────────────────────────
  const handleSelectConversation = async (conv: ConversationSummary) => {
    if (conv.id === activeConvId) {
      if (window.innerWidth < 768) setSidebarOpen(false);
      return;
    }
    setLoading(true);
    setTurns([]);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/conversations/${conv.id}/`);
      if (!res.ok) throw new Error("Failed to load conversation");
      const data = await res.json();
      setActiveConvId(conv.id);
      setMode(conv.mode as Mode);

      // Reconstruct turns from messages
      const rebuilt: TurnMessage[] = [];
      for (const msg of data.messages ?? []) {
        rebuilt.push({ role: "user", content: msg.user_input });
        rebuilt.push({
          role: "assistant",
          intent: msg.intent,
          type: msg.response_type,
          explanation: msg.explanation,
          steps: msg.steps,
          hint: msg.hint,
          solution: msg.solution,
          example: msg.example,
          questions: msg.questions,
          student_attempt: msg.student_attempt,
          evaluation: msg.evaluation,
          improved_explanation: msg.improved_explanation,
          resources: msg.resources,
        });
      }
      setTurns(rebuilt);
    } catch {
      setError("Could not load conversation.");
    } finally {
      setLoading(false);
      if (window.innerWidth < 768) setSidebarOpen(false);
    }
  };

  // ── Delete conversation ───────────────────────────────────────────
  const handleDeleteConversation = async (convId: number) => {
    try {
      await fetch(`${API_URL}/conversations/${convId}/`, { method: "DELETE" });
      if (convId === activeConvId) handleNewChat();
      loadConversations();
    } catch { /* ignore */ }
  };

  // ── New chat ──────────────────────────────────────────────────────
  const handleNewChat = () => {
    setTurns([]);
    setInput("");
    setFile(null);
    setMode("balanced");
    setActiveConvId(null);
    setError(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const hasContent = turns.length > 0 || loading || error !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* ── Sidebar ── */}
      <Sidebar
        conversations={conversations}
        activeId={activeConvId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-[#1a1a1a] shrink-0">
          <button
            id="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-[15px] tracking-tight">
            <span className="text-orange-400">Bodh</span>
            <span className="text-white">AI</span>
          </span>
        </header>

        {/* ── Scrollable chat area ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              {!hasContent ? (
                <EmptyState key="empty" onChipClick={(text) => {
                  setInput(text);
                  const inputEl = document.querySelector('textarea');
                  if (inputEl) {
                    inputEl.focus();
                  }
                }} />
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="pb-52"
                >
                  {/* Error banner */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400 mb-6"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Chat turns */}
                  {turns.map((turn, idx) => (
                    <ChatMessage key={idx} message={turn} />
                  ))}

                  {/* Typing indicator */}
                  {loading && <TypingIndicator />}

                  {/* Quick Actions (visible when chat has content) */}
                  {!loading && turns.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 flex flex-wrap gap-2"
                    >
                      {ACTION_CHIPS.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            setInput(chip.example);
                            const inputEl = document.querySelector('textarea');
                            if (inputEl) {
                              inputEl.focus();
                            }
                          }}
                          className="px-3 py-1.5 rounded-full border border-[#242424] bg-[#111] text-[12px] text-[#888] hover:text-[#d1d1d6] hover:bg-[#1a1a1a] hover:border-orange-500/30 transition-all duration-200"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </motion.div>
                  )}

                  <div ref={chatEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ── Fixed input ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
          className="absolute bottom-0 left-0 right-0 pb-5 pt-8 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent pointer-events-none"
        >
          <div className="pointer-events-auto">
            <InputBox
              input={input}
              setInput={setInput}
              mode={mode}
              setMode={setMode}
              file={file}
              setFile={setFile}
              loading={loading}
              onSubmit={handleSend}
              compact={hasContent}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
