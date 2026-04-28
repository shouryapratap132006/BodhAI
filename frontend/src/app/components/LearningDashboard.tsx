"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, BookOpen, AlertCircle, Clock, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

export default function LearningDashboard({ isOpen, onClose, apiUrl }: Props) {
  const [data, setData] = useState<any>(null);

  const loadData = async () => {
    try {
      const res = await fetch(`${apiUrl}/dashboard/`);
      if (res.ok) setData(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="w-full max-w-md bg-[#0d0d0d] border-l border-[#1e1e1e] h-full flex flex-col"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a]">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Learning Dashboard
            </h2>
            <button onClick={onClose} className="p-2 text-[#555] hover:text-white rounded-lg hover:bg-[#1a1a1a]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Topics Learned */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold uppercase text-[#666] tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                Topics Learned
              </h3>
              <div className="space-y-3">
                {data?.topics?.map((t: any, i: number) => (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="text-[14px] font-medium text-white">{t.topic_name}</h4>
                      <p className="text-[11px] text-[#888] mt-1">Last accessed: {new Date(t.last_accessed).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-400">{Math.round(t.progress)}%</div>
                      <div className="text-[10px] text-[#666] uppercase">Progress</div>
                    </div>
                  </div>
                ))}
                {(!data || data.topics.length === 0) && <p className="text-[13px] text-[#555]">No topics studied yet.</p>}
              </div>
            </section>

            {/* Quiz Scores */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold uppercase text-[#666] tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                Quiz Assessments
              </h3>
              <div className="space-y-3">
                {data?.quizzes?.map((q: any, i: number) => (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-[13px] font-medium text-[#ddd]">{q.topic}</h4>
                      <span className="text-[13px] font-bold text-blue-400">{q.score} pts</span>
                    </div>
                    {q.mistakes && Object.keys(q.mistakes).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#2a2a2a]">
                        <div className="text-[11px] font-semibold text-red-400 mb-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Weak Areas
                        </div>
                        <p className="text-[12px] text-[#888] line-clamp-2">{JSON.stringify(q.mistakes)}</p>
                      </div>
                    )}
                  </div>
                ))}
                {(!data || data.quizzes.length === 0) && <p className="text-[13px] text-[#555]">No quizzes taken yet.</p>}
              </div>
            </section>

            {/* Recent Activity */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold uppercase text-[#666] tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                Recent Activity
              </h3>
              <div className="space-y-3">
                {data?.recent_activity?.map((a: any, i: number) => (
                  <div key={i} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-3 flex gap-3">
                    <div className="shrink-0 w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                    <div>
                      <p className="text-[13px] font-medium text-[#ccc]">{a.topic}</p>
                      <p className="text-[11px] text-[#888] mt-1">{a.mode.toUpperCase()} • {new Date(a.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {(!data || data.recent_activity.length === 0) && <p className="text-[13px] text-[#555]">No activity.</p>}
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
