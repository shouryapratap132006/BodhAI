"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, File as FileIcon, X, Loader2, ArrowUp } from "lucide-react";
import type { Mode } from "../page";

interface InputBoxProps {
  input: string;
  setInput: (v: string) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  teachingMode: "learn" | "test";
  setTeachingMode: (m: "learn" | "test") => void;
  file: File | null;
  setFile: (f: File | null) => void;
  loading: boolean;
  onSubmit: () => void;
  compact?: boolean;
}

const MODES: { value: Mode; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "balanced", label: "Balanced" },
  { value: "advanced", label: "Advanced" },
];

const modeAccent: Record<Mode, string> = {
  beginner: "text-emerald-400 bg-emerald-400/8 border-emerald-400/20",
  balanced: "text-blue-400   bg-blue-400/8   border-blue-400/20",
  advanced: "text-orange-400 bg-orange-400/8 border-orange-400/20",
};

// Quick-prompt pills shown above input when empty
const QUICK_PROMPTS = [
  { label: "📖 Learn", prompt: "Explain " },
  { label: "🔍 Solve", prompt: "Help me solve: " },
  { label: "🎯 Quiz",  prompt: "Quiz me on " },
  { label: "📝 Homework", prompt: "Give me practice problems on " },
  { label: "⚡ Revise", prompt: "Quick revision of " },
];

export default function InputBox({
  input, setInput, mode, setMode, teachingMode, setTeachingMode, file, setFile, loading, onSubmit, compact = false,
}: InputBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canSubmit = (input.trim().length > 0 || file !== null) && !loading;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) onSubmit();
    }
  };

  return (
    <div className="w-full max-w-[720px] mx-auto px-4">
      {/* Quick-prompt pills — only show when not compact and no input */}
      <AnimatePresence>
        {!compact && !input && !file && (
          <motion.div
            key="quick-prompts"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-wrap gap-1.5 mb-3"
          >
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p.label}
                onClick={() => setInput(p.prompt)}
                className="px-2.5 py-1 text-[11px] rounded-full border border-[#1e1e1e] text-[#444]
                  hover:text-[#888] hover:border-[#2e2e2e] bg-[#0d0d0d] transition-all duration-150"
              >
                {p.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attached file pill */}
      <AnimatePresence>
        {file && (
          <motion.div
            key="file-pill"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="mb-2 inline-flex items-center gap-2 bg-[#181818] px-3 py-1.5 rounded-full border border-[#282828]"
          >
            <FileIcon className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            <span className="text-[12px] text-[#aaa] truncate max-w-[220px]">{file.name}</span>
            <button
              onClick={() => setFile(null)}
              className="ml-1 text-[#555] hover:text-white transition-colors"
              aria-label="Remove file"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main input container */}
      <div className="input-box relative flex flex-col bg-[#141414] rounded-2xl border border-[#242424] shadow-2xl">
        {/* Textarea */}
        <textarea
          id="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            file
              ? "Add context for this document (optional)…"
              : "Ask anything — learn, solve, quiz, revise…"
          }
          rows={compact ? 1 : 2}
          className={[
            "w-full bg-transparent outline-none resize-none",
            "text-[15px] leading-relaxed text-white placeholder-[#3d3d3d]",
            "px-4 pt-4 pb-3 min-h-[52px] max-h-[240px]",
          ].join(" ")}
        />

        {/* Toolbar row */}
        <div className="flex items-center justify-between px-3 pb-3 pt-0">
          {/* Left: mode + upload */}
          <div className="flex items-center gap-2">
            {/* Teaching Mode Toggle */}
            <div className="flex items-center gap-1 rounded-lg bg-[#0d0d0d] border border-[#1e1e1e] p-0.5">
              <button
                onClick={() => setTeachingMode("learn")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${teachingMode === "learn" ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]" : "text-[#4a4a4a] hover:text-[#888]"}`}
              >
                Teach Me
              </button>
              <button
                onClick={() => setTeachingMode("test")}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150 ${teachingMode === "test" ? "bg-[#1a1a1a] text-white border border-[#2a2a2a]" : "text-[#4a4a4a] hover:text-[#888]"}`}
              >
                Test Me
              </button>
            </div>
            
            {/* Mode selector */}
            <div className="flex items-center gap-1 rounded-lg bg-[#0d0d0d] border border-[#1e1e1e] p-0.5">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  id={`mode-${m.value}`}
                  onClick={() => setMode(m.value)}
                  className={[
                    "px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-150",
                    mode === m.value
                      ? modeAccent[m.value] + " border"
                      : "text-[#4a4a4a] hover:text-[#888]",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* File upload */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf,.ppt,.pptx,.jpg,.jpeg,.png"
              onChange={(e) => {
                if (e.target.files?.[0]) setFile(e.target.files[0]);
                e.target.value = "";
              }}
            />
            <button
              id="upload-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Attach file (PDF, PPT, Image)"
              className="p-1.5 rounded-lg text-[#444] hover:text-[#aaa] hover:bg-[#1e1e1e] transition-all duration-150"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>

          {/* Right: submit */}
          <motion.button
            id="submit-btn"
            onClick={onSubmit}
            disabled={!canSubmit}
            whileHover={canSubmit ? { scale: 1.05 } : {}}
            whileTap={canSubmit ? { scale: 0.95 } : {}}
            className={[
              "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200",
              canSubmit
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:bg-orange-400"
                : "bg-[#1e1e1e] text-[#3a3a3a] cursor-not-allowed",
            ].join(" ")}
            aria-label="Send"
          >
            {loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />}
          </motion.button>
        </div>
      </div>

      <p className="text-center text-[11px] text-[#2e2e2e] mt-2.5">
        BodhAI may make mistakes — verify important information.
      </p>
    </div>
  );
}
