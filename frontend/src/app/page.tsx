"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, BookOpen } from "lucide-react";
import Sidebar from "./components/Sidebar";
import InputBox from "./components/InputBox";
import ResponseCard from "./components/ResponseCard";

// ── Types ─────────────────────────────────────────────────────
type Mode = "beginner" | "balanced" | "advanced";

type Result = {
  explanation: string;
  steps: string[];
  question: string;
};

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

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

// ── Loading skeleton ──────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Section label */}
      <div>
        <div className="h-2.5 w-20 bg-[#222] rounded-full mb-4" />
        <div className="space-y-2.5">
          <div className="h-3 bg-[#1e1e1e] rounded-full w-full" />
          <div className="h-3 bg-[#1e1e1e] rounded-full w-[92%]" />
          <div className="h-3 bg-[#1e1e1e] rounded-full w-[85%]" />
          <div className="h-3 bg-[#1e1e1e] rounded-full w-[78%]" />
        </div>
      </div>
      <div>
        <div className="h-2.5 w-14 bg-[#222] rounded-full mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[#1e1e1e] shrink-0" />
              <div className="flex-1 space-y-1.5 pt-1">
                <div className="h-3 bg-[#1e1e1e] rounded-full w-full" />
                <div className="h-3 bg-[#1e1e1e] rounded-full w-[80%]" />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-[#222] bg-[#111] p-4">
        <div className="h-2.5 w-28 bg-[#222] rounded-full mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-[#1a1a1a] rounded-full w-full" />
          <div className="h-3 bg-[#1a1a1a] rounded-full w-[70%]" />
        </div>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState() {
  return (
    <motion.div
      key="empty"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center text-center select-none"
      style={{ minHeight: "55vh" }}
    >
      {/* Logo mark */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20"
      >
        <BookOpen className="w-7 h-7 text-white" strokeWidth={2} />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-[32px] md:text-[38px] font-semibold tracking-tight glow-text mb-2"
      >
        <span className="text-orange-400">Bodh</span>
        <span className="text-white">AI</span>
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-[15px] text-[#4a4a58] max-w-sm font-light"
      >
        Your intelligent learning assistant.
        <br />
        Enter a topic or upload a document to begin.
      </motion.p>

      {/* Subtle feature chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex flex-wrap justify-center gap-2 mt-8"
      >
        {["Explain anything", "Step-by-step", "Practice questions", "PDF & PPT support"].map(
          (tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-[11px] rounded-full border border-[#1e1e1e] text-[#3a3a3a] bg-[#0d0d0d]"
            >
              {tag}
            </span>
          )
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Home() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("balanced");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/history/`);
      if (!res.ok) return;
      const data: HistoryItem[] = await res.json();
      setHistory(data);
    } catch {
      // silently ignore — history is non-critical
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Auto-scroll to result
  useEffect(() => {
    if (result) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    }
  }, [result]);

  // Close sidebar on desktop resize
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleLearn = async () => {
    if (!input.trim() && !file) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setActiveId(null);

    const formData = new FormData();
    formData.append("input", input);
    formData.append("mode", mode);
    if (file) formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/learn/`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data: Result = await res.json();
      setResult(data);
      setInput("");
      setFile(null);
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setResult({ explanation: item.explanation, steps: item.steps, question: item.question });
    setActiveId(item.id);
    setInput("");
    setFile(null);
    setMode(item.mode);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const handleNewTopic = () => {
    setResult(null);
    setInput("");
    setFile(null);
    setMode("balanced");
    setActiveId(null);
    setError(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const hasContent = loading || result !== null || error !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
      {/* ── Sidebar ── */}
      <Sidebar
        history={history}
        activeId={activeId}
        onSelect={handleSelectHistory}
        onNewTopic={handleNewTopic}
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

        {/* ── Scrollable content area ── */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[720px] mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              {!hasContent ? (
                <EmptyState key="empty" />
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="pb-52"
                >
                  {/* Error state */}
                  {error && (
                    <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
                      {error}
                    </div>
                  )}

                  {/* Loading skeleton */}
                  {loading && <LoadingSkeleton />}

                  {/* Response */}
                  {result && !loading && (
                    <ResponseCard
                      explanation={result.explanation}
                      steps={result.steps}
                      question={result.question}
                    />
                  )}
                  <div ref={chatEndRef} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* ── Fixed input at bottom ── */}
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
              onSubmit={handleLearn}
              compact={hasContent}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}
