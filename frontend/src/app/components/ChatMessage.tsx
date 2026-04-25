"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Lightbulb, Target, List, HelpCircle, CheckCircle2, XCircle, ExternalLink, Play, ChevronRight, LayoutList, Map, ArrowRight, ArrowLeftRight } from "lucide-react";
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
  get_resources:  { label: "📚 Resources",     color: "text-pink-400   bg-pink-400/10   border-pink-400/20"   },
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

// ── Lesson Plan Block ──────────────────────────────────────────────────────
function LessonPlanBlock({ lesson }: { lesson?: Record<string, string> }) {
  if (!lesson || Object.keys(lesson).length === 0) return null;
  const sections = [
    { key: "attention", label: "Gain Attention", icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { key: "objectives", label: "Objectives", icon: <Target className="w-3.5 h-3.5" /> },
    { key: "prior_knowledge", label: "Prior Knowledge", icon: <Map className="w-3.5 h-3.5" /> },
    { key: "content", label: "Content", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: "guided_practice", label: "Guided Practice", icon: <List className="w-3.5 h-3.5" /> },
    { key: "assessment", label: "Assessment", icon: <HelpCircle className="w-3.5 h-3.5" /> },
    { key: "feedback", label: "Feedback", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { key: "improvement", label: "Improvement", icon: <ArrowRight className="w-3.5 h-3.5" /> },
  ];

  return (
    <motion.section variants={blockVariants} className="space-y-4">
      {sections.map((sec) => {
        const val = lesson[sec.key];
        if (!val) return null;
        return (
          <div key={sec.key} className="rounded-xl border border-orange-500/10 bg-orange-500/5 p-4">
            <SectionLabel icon={sec.icon} text={sec.label} color="text-orange-400" />
            {typeof val === "string" ? (
              <p className="text-[14px] text-[#d1d1d6] leading-relaxed whitespace-pre-wrap">{val}</p>
            ) : (
              <div className="space-y-2 text-[14px] text-[#d1d1d6] leading-relaxed">
                {Object.entries(val).map(([k, v]) => (
                  <div key={k}>
                    <strong className="capitalize text-orange-300/80">{k.replace(/_/g, " ")}:</strong>{" "}
                    {typeof v === "string" ? v : JSON.stringify(v)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </motion.section>
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

function PlayableQuiz({ questions }: { questions: Question[] }) {
  const [selections, setSelections] = useState<Record<number, string>>({});

  if (!questions?.length) return null;
  return (
    <motion.section variants={blockVariants}>
      <SectionLabel icon={<Target className="w-3.5 h-3.5" />} text="Interactive Quiz" color="text-yellow-500" />
      <div className="space-y-4">
        {questions.map((q, i) => {
          const selected = selections[i];
          const hasAnswered = selected !== undefined;
          const isCorrect = selected === q.answer;

          return (
            <div key={i} className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4">
              <div className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] text-[11px] font-semibold text-[#888] flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <div className="flex-1 space-y-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#555]">
                    {difficultyLabel[q.type] ?? q.type}
                  </span>
                  <p className="text-[14px] text-[#d1d1d6] leading-relaxed">{q.text}</p>
                  {q.options?.length && (
                    <ul className="space-y-2 mt-2">
                      {q.options.map((opt, oi) => {
                        const optionLetter = String.fromCharCode(65 + oi);
                        const optionText = opt.replace(/^[A-Da-d]\)\s*/, "");
                        const isThisSelected = selected === optionLetter;
                        const isThisCorrectAnswer = q.answer === optionLetter;

                        let bgClass = "bg-[#1a1a1a] border-[#2a2a2a] hover:border-yellow-500/50";
                        let textClass = "text-[#888]";

                        if (hasAnswered) {
                          if (isThisCorrectAnswer) {
                            bgClass = "bg-emerald-500/10 border-emerald-500/50";
                            textClass = "text-emerald-400";
                          } else if (isThisSelected && !isThisCorrectAnswer) {
                            bgClass = "bg-red-500/10 border-red-500/50";
                            textClass = "text-red-400";
                          } else {
                            bgClass = "bg-[#1a1a1a] border-[#2a2a2a] opacity-50";
                          }
                        }

                        return (
                          <li key={oi}>
                            <button
                              disabled={hasAnswered}
                              onClick={() => setSelections(prev => ({ ...prev, [i]: optionLetter }))}
                              className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all duration-200 ${bgClass}`}
                            >
                              <span className={`shrink-0 w-6 h-6 rounded bg-black/20 border border-white/10 text-[11px] font-semibold flex items-center justify-center ${textClass}`}>
                                {optionLetter}
                              </span>
                              <span className={`text-[13px] mt-0.5 ${textClass}`}>
                                {optionText}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Explanation / Hint after answer */}
                  {hasAnswered && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className={`mt-4 p-3 rounded-xl border border-l-2 ${isCorrect ? 'border-emerald-500/30 bg-emerald-500/5 border-l-emerald-500' : 'border-red-500/30 bg-red-500/5 border-l-red-500'}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                        <span className={`text-[12px] font-semibold uppercase tracking-wider ${isCorrect ? "text-emerald-400" : "text-red-400"}`}>
                          {isCorrect ? "Correct!" : "Incorrect"}
                        </span>
                      </div>
                      {q.hint && (
                        <p className="text-[13px] text-[#aaa] leading-relaxed mt-2">{q.hint}</p>
                      )}
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function QuestionsList({ questions, responseType }: { questions: Question[]; responseType?: string }) {
  if (!questions?.length) return null;
  const sectionLabel = responseType === "homework" ? "Practice Problems" :
                       responseType === "revise"   ? "Revision Questions" : "Questions";

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
                {/* Answer for quiz/revise */}
                {q.answer && (
                  <p className="text-[12px] text-emerald-400/80 mt-1">
                    <span className="font-semibold">Answer:</span> {q.answer}
                  </p>
                )}
                {/* Hint for homework */}
                {q.hint && !q.answer && (
                  <p className="text-[12px] text-yellow-500/70 mt-1">
                    <span className="font-semibold">Hint:</span> {q.hint}
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
        {resources.map((r, i) => {
          let href = typeof r.link === "string" ? r.link : (typeof (r as any).url === "string" ? (r as any).url : "#");
          if (typeof href !== "string") href = "#";
          
          return (
            <a
              key={i}
              href={href}
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
          );
        })}
      </div>
    </motion.section>
  );
}

// ── Main ChatMessage component ─────────────────────────────────────────────
export default function ChatMessage({ message }: Props) {
  const [viewMode, setViewMode] = useState<"chat" | "lesson">("chat");
  const [showOriginal, setShowOriginal] = useState(false);

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
  const finalExplanation = showOriginal ? message.explanation : (message.improved_explanation || message.explanation || "");
  const hasLessonStructure = message.lesson_structure && Object.keys(message.lesson_structure).length > 0;
  const hasImprovement = Boolean(message.improved_explanation);

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
        {/* Top bar with badges and toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {intentInfo && (
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${intentInfo.color}`}>
              {intentInfo.label}
            </div>
          )}

          <div className="flex items-center gap-2">
            {hasImprovement && viewMode === "chat" && (
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#2a2a2a] bg-[#111] text-[11px] font-medium text-[#888] hover:text-orange-400 hover:border-orange-500/30 transition-all"
              >
                <ArrowLeftRight className="w-3 h-3" />
                {showOriginal ? "Show Improved" : "Show Original"}
              </button>
            )}

            {hasLessonStructure && (
              <div className="flex bg-[#111] p-0.5 rounded-lg border border-[#2a2a2a]">
                <button
                  onClick={() => setViewMode("chat")}
                  className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === "chat" ? "bg-[#222] text-white shadow-sm" : "text-[#777] hover:text-white"}`}
                >
                  Chat View
                </button>
                <button
                  onClick={() => setViewMode("lesson")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[11px] font-medium transition-all ${viewMode === "lesson" ? "bg-orange-500/20 text-orange-400 shadow-sm" : "text-[#777] hover:text-orange-400"}`}
                >
                  <LayoutList className="w-3 h-3" />
                  Lesson Plan
                </button>
              </div>
            )}
          </div>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {viewMode === "lesson" && message.lesson_structure ? (
            <LessonPlanBlock lesson={message.lesson_structure} />
          ) : (
            <>
              {/* Main explanation */}
              {finalExplanation && (
                <motion.section variants={blockVariants}>
                  <SectionLabel
                    icon={<BookOpen className="w-3.5 h-3.5" />}
                    text={showOriginal ? "Original Explanation" : (message.improved_explanation ? "Improved Explanation" : "Explanation")}
                    color={showOriginal ? "text-[#888]" : (message.improved_explanation ? "text-orange-400" : "text-orange-500")}
                  />
                  <div className={`text-[14px] leading-[1.8] whitespace-pre-wrap ${showOriginal ? 'text-[#888]' : 'text-[#d1d1d6]'}`}>
                    {typeof finalExplanation === 'string' ? finalExplanation : JSON.stringify(finalExplanation, null, 2)}
                  </div>
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
              {message.type === "quiz" ? (
                <>
                  <PlayableQuiz questions={(message.questions ?? []).filter(q => q.type === "mcq")} />
                  <QuestionsList questions={(message.questions ?? []).filter(q => q.type !== "mcq")} responseType={message.type} />
                </>
              ) : (
                <QuestionsList questions={message.questions ?? []} responseType={message.type} />
              )}

              {/* Student attempt + evaluation (only show for original draft or if perfect on first try) */}
              {(!hasImprovement || showOriginal) && (
                <EvaluationBlock attempt={message.student_attempt} evaluation={message.evaluation} />
              )}

              {/* Resources */}
              <ResourcesList resources={message.resources ?? []} />
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
