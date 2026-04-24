"use client";

import { motion } from "framer-motion";

interface ResponseCardProps {
  explanation: string;
  steps: string[];
  question: string;
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
} as const;

export default function ResponseCard({ explanation, steps, question }: ResponseCardProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 text-[15px] leading-relaxed"
    >
      {/* ── Explanation ─────────────────────────────────────── */}
      <motion.section variants={blockVariants}>
        <h2 className="text-[11px] font-semibold uppercase tracking-widest text-orange-500 mb-3">
          Explanation
        </h2>
        <p className="text-[#d1d1d6] whitespace-pre-wrap">{explanation}</p>
      </motion.section>

      {/* ── Steps ────────────────────────────────────────────── */}
      {steps && Array.isArray(steps) && steps.length > 0 && (
        <motion.section variants={blockVariants}>
          <h2 className="text-[11px] font-semibold uppercase tracking-widest text-emerald-500 mb-3">
            Steps
          </h2>
          <ol className="space-y-3">
            {steps.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center justify-center mt-0.5">
                  {idx + 1}
                </span>
                <span className="text-[#c0c0c8]">{step}</span>
              </li>
            ))}
          </ol>
        </motion.section>
      )}

      {/* ── Practice question ────────────────────────────────── */}
      {question && (
        <motion.section variants={blockVariants}>
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 pl-5 border-l-2 border-l-yellow-500">
            <h2 className="text-[11px] font-semibold uppercase tracking-widest text-yellow-500 mb-2">
              Practice Question
            </h2>
            <p className="text-[#e0d8b8] leading-relaxed">{question}</p>
          </div>
        </motion.section>
      )}
    </motion.div>
  );
}
