"use client";

import { motion } from "framer-motion";
import { BookOpen, Lightbulb, Target, List, HelpCircle, CheckCircle2, XCircle, ExternalLink, Play, ChevronRight } from "lucide-react";
import type { TurnMessage, Question, Resource, Evaluation } from "../page";

interface Props { message: TurnMessage; }

const blockVariants = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.38, ease: "easeOut" as const } },
};

const containerVariants = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08 } },
};

// ── Intent badge ───────────────────────────────────────────────────────────
const intentConfig: Record<string, { label: string; color: string }> = {
  learn_topic:    { label: "📖 Learn",         color: "text-blue-400   bg-blue-400/10   border-blue-400/20"    },
  solve_question: { label: "🔍 Solve",         color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
  quiz_me:        { label: "🎯 Quiz",          color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" },
  homework:       { label: "📝 Homework",      color: "text-green-400  bg-green-400/10  border-green-400/20"  },
  revise:         { label: "⚡ Revise",        color: "text-cyan-400   bg-cyan-400/10   border-cyan-400/20"   },
  explain_again:  { label: "🔄 Re-explain",    color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
};

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest mb-3 ${color}`}>
      {icon}
      {text}
    </div>
  );
}

// ── Steps list ─────────────────────────────────────────────────────────────
function StepsList({ steps }: { steps: string[] }) {
  if (!steps?.length) return null;
  return (
    <motion.section variants={blockVariants}>
      <SectionLabel icon={<List className="w-3.5 h-3.5" />} text="Steps" color="text-emerald-500" />
      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <span className="text-[#c0c0c8] text-[14px] leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </motion.section>
  );
}

// ── Hint block ─────────────────────────────────────────────────────────────
function HintBlock({ hint }: { hint: string }) {
  if (!hint) return null;
  return (
    <motion.section variants={blockVariants}>
      <div className="rounded-xl border border-yellow-500/25 bg-yellow-500/5 p-4 border-l-2 border-l-yellow-500">
        <SectionLabel icon={<Lightbulb className="w-3.5 h-3.5" />} text="Hint" color="text-yellow-500" />
        <p className="text-[#e0d8a8] text-[14px] leading-relaxed">{hint}</p>
      </div>
    </motion.section>
  );
}

// ── Solution block ─────────────────────────────────────────────────────────
function SolutionBlock({ solution }: { solution: string }) {
  if (!solution) return null;
  return (
    <motion.section variants={blockVariants}>
      <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-4 border-l-2 border-l-purple-500">
        <SectionLabel icon={<Target className="w-3.5 h-3.5" />} text="Full Solution" color="text-purple-400" />
        <p className="text-[#d8c8f0] text-[14px] leading-relaxed whitespace-pre-wrap">{solution}</p>
      </div>
    </motion.section>
  );
}

// ── Example block ──────────────────────────────────────────────────────────
function ExampleBlock({ example }: { example: string }) {
  if (!example) return null;
  return (
    <motion.section variants={blockVariants}>
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <SectionLabel icon={<ChevronRight className="w-3.5 h-3.5" />} text="Example" color="text-blue-400" />
        <p className="text-[#c8d8f0] text-[14px] leading-relaxed whitespace-pre-wrap">{example}</p>
      </div>
    </motion.section>
  );
}

// ── Questions (quiz / homework / revise) ───────────────────────────────────
const difficultyColors: Record<string, string> = {
  mcq:        "border-yellow-500/30 bg-yellow-500/5",
  short:      "border-cyan-500/30   bg-cyan-500/5",
  easy:       "border-emerald-500/30 bg-emerald-500/5",
  medium:     "border-blue-500/30   bg-blue-500/5",
  hard:       "border-orange-500/30 bg-orange-500/5",
  challenge:  "border-red-500/30    bg-red-500/5",
  conceptual: "border-purple-500/30 bg-purple-500/5",
};
const difficultyLabel: Record<string, string> = {
  mcq: "MCQ", short: "Short Answer", easy: "Easy", medium: "Medium",
  hard: "Hard", challenge: "Challenge", conceptual: "Conceptual",
};

function QuestionsList({ questions, responseType }: { questions: Question[]; responseType?: string }) {
  if (!questions?.length) return null;
  const sectionLabel = responseType === "homework" ? "Practice Problems" :
                       responseType === "revise"   ? "Revision Questions" : "Quiz";

  return (
    <motion.section variants={blockVariants}>
      <SectionLabel icon={<HelpCircle className="w-3.5 h-3.5" />} text={sectionLabel} color="text-yellow-500" />
      <div className="space-y-3">
        {questions.map((q, i) => (
          <div key={i} className={`rounded-xl border p-4 ${difficultyColors[q.type] ?? "border-[#242424] bg-[#111]"}`}>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] text-[11px] font-semibold text-[#888] flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 space-y-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                  {difficultyLabel[q.type] ?? q.type}
                </span>
                <p className="text-[14px] text-[#d1d1d6] leading-relaxed">{q.text}</p>
                {/* MCQ options */}
                {q.options?.length && (
                  <ul className="space-y-1.5 mt-2">
                    {q.options.map((opt, oi) => (
                      <li key={oi} className="flex items-start gap-2 text-[13px] text-[#888]">
                        <span className="shrink-0 w-5 h-5 rounded bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] font-semibold text-[#666] flex items-center justify-center">
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt.replace(/^[A-Da-d]\)\s*/, "")}
                      </li>
                    ))}
                  </ul>
                )}
                {/* Hint for homework */}
                {q.hint && (
                  <p className="text-[12px] text-yellow-500/70 mt-1">
                    <span className="font-semibold">Hint:</span> {q.hint}
                  </p>
                )}
                {/* Answer for quiz/revise */}
                {q.answer && responseType !== "quiz" && (
                  <p className="text-[12px] text-emerald-400/80 mt-1">
                    <span className="font-semibold">Answer:</span> {q.answer}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ── Student attempt + evaluation ───────────────────────────────────────────
function EvaluationBlock({ attempt, evaluation }: { attempt?: string; evaluation?: Evaluation }) {
  if (!attempt && !evaluation?.feedback) return null;
  return (
    <motion.section variants={blockVariants}>
      <div className="space-y-3">
        {attempt && (
          <div className="rounded-xl border border-[#2a2a2a] bg-[#111] p-4">
            <SectionLabel icon={<HelpCircle className="w-3.5 h-3.5" />} text="Student Attempt" color="text-[#666]" />
            <p className="text-[13px] text-[#888] italic leading-relaxed">&quot;{attempt}&quot;</p>
          </div>
        )}
        {evaluation && (
          <div className={`rounded-xl border p-4 border-l-2 ${evaluation.correct
            ? "border-emerald-500/30 bg-emerald-500/5 border-l-emerald-500"
            : "border-orange-500/30 bg-orange-500/5 border-l-orange-500"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              {evaluation.correct
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                : <XCircle className="w-4 h-4 text-orange-400" />}
              <span className={`text-[12px] font-semibold uppercase tracking-wider ${evaluation.correct ? "text-emerald-400" : "text-orange-400"}`}>
                {evaluation.correct ? "Looks good!" : "Needs improvement"}
              </span>
            </div>
            {evaluation.feedback && (
              <p className="text-[13px] text-[#aaa] leading-relaxed">{evaluation.feedback}</p>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
}

// ── Resources ──────────────────────────────────────────────────────────────
function ResourcesList({ resources }: { resources: Resource[] }) {
  if (!resources?.length) return null;
  return (
    <motion.section variants={blockVariants}>
      <SectionLabel icon={<ExternalLink className="w-3.5 h-3.5" />} text="Resources" color="text-[#555]" />
      <div className="flex flex-wrap gap-2">
        {resources.map((r, i) => (
          <a
            key={i}
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#242424] bg-[#0f0f0f]
              hover:border-orange-500/30 hover:bg-[#141414] transition-all duration-200 group"
          >
            {r.type === "video"
              ? <Play className="w-3.5 h-3.5 text-red-400 shrink-0" />
              : <ExternalLink className="w-3.5 h-3.5 text-blue-400 shrink-0" />}
            <span className="text-[12px] text-[#777] group-hover:text-[#aaa] transition-colors max-w-[200px] truncate">
              {r.title}
            </span>
          </a>
        ))}
      </div>
    </motion.section>
  );
}

// ── Main ChatMessage component ─────────────────────────────────────────────
export default function ChatMessage({ message }: Props) {
  if (message.role === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-end mb-6"
      >
        <div className="max-w-[80%] bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-tr-sm px-4 py-3">
          <p className="text-[14px] text-[#e0e0e8] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </motion.div>
    );
  }

  // ── Assistant message ──────────────────────────────────────────────────
  const intentInfo = intentConfig[message.intent ?? ""] ?? null;
  const finalExplanation = message.improved_explanation || message.explanation || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex items-start gap-3 mb-8"
    >
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shrink-0 mt-0.5 shadow-md shadow-orange-500/20">
        <BookOpen className="w-4 h-4 text-white" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0 space-y-6">
        {/* Intent badge */}
        {intentInfo && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${intentInfo.color}`}>
            {intentInfo.label}
          </div>
        )}

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Main explanation */}
          {finalExplanation && (
            <motion.section variants={blockVariants}>
              <SectionLabel
                icon={<BookOpen className="w-3.5 h-3.5" />}
                text={message.improved_explanation ? "Improved Explanation" : "Explanation"}
                color={message.improved_explanation ? "text-orange-400" : "text-orange-500"}
              />
              <p className="text-[#d1d1d6] text-[14px] leading-[1.8] whitespace-pre-wrap">{finalExplanation}</p>
            </motion.section>
          )}

          {/* Hint (solve mode) */}
          <HintBlock hint={message.hint ?? ""} />

          {/* Steps */}
          <StepsList steps={message.steps ?? []} />

          {/* Example */}
          <ExampleBlock example={message.example ?? ""} />

          {/* Full solution (solve mode) */}
          <SolutionBlock solution={message.solution ?? ""} />

          {/* Questions (quiz / homework / revise) */}
          <QuestionsList questions={message.questions ?? []} responseType={message.type} />

          {/* Student attempt + evaluation */}
          <EvaluationBlock attempt={message.student_attempt} evaluation={message.evaluation} />

          {/* Resources */}
          <ResourcesList resources={message.resources ?? []} />
        </motion.div>
      </div>
    </motion.div>
  );
}
