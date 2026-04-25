"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, BookOpen, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiUrl: string;
}

export default function LearningDashboard({ isOpen, onClose, apiUrl }: Props) {
  const [loading, setLoading] = useState(false);
  const [paths, setPaths] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [newTopic, setNewTopic] = useState("");

  const loadData = async () => {
    try {
      const [pathRes, progRes] = await Promise.all([
        fetch(`${apiUrl}/learning-path/`),
        fetch(`${apiUrl}/topic-progress/`)
      ]);
      if (pathRes.ok) setPaths(await pathRes.json());
      if (progRes.ok) setProgress(await progRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const generatePath = async () => {
    if (!newTopic.trim()) return;
    setLoading(true);
    try {
      await fetch(`${apiUrl}/learning-path/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ main_topic: newTopic })
      });
      setNewTopic("");
      loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const avgAccuracy = progress.length > 0 
    ? Math.round(progress.reduce((sum, p) => sum + p.accuracy, 0) / progress.length)
    : 0;

  const weakTopics = progress.filter(p => p.accuracy < 50);

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
            {/* Stats Overview */}
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[11px] font-semibold uppercase text-[#666] tracking-wider mb-1">Avg Accuracy</p>
                <p className="text-2xl font-semibold text-emerald-400">{avgAccuracy}%</p>
              </div>
              <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                <p className="text-[11px] font-semibold uppercase text-[#666] tracking-wider mb-1">Topics Studied</p>
                <p className="text-2xl font-semibold text-blue-400">{progress.length}</p>
              </div>
            </section>

            {/* Weak Topics */}
            {weakTopics.length > 0 && (
              <section className="space-y-3">
                <h3 className="text-[12px] font-semibold uppercase text-[#666] tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  Weak Areas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {weakTopics.map(w => (
                    <span key={w.id} className="px-2.5 py-1 text-[12px] bg-red-500/10 border border-red-500/20 text-red-400 rounded-md">
                      {w.topic} ({Math.round(w.accuracy)}%)
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Learning Paths */}
            <section className="space-y-4">
              <h3 className="text-[12px] font-semibold uppercase text-[#666] tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-orange-400" />
                Your Learning Paths
              </h3>
              
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="E.g., Machine Learning"
                  className="flex-1 bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 text-[13px] text-white outline-none focus:border-orange-500/50"
                  onKeyDown={e => e.key === 'Enter' && generatePath()}
                />
                <button 
                  onClick={generatePath}
                  disabled={loading || !newTopic}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg text-[13px] font-medium disabled:opacity-50"
                >
                  {loading ? "Generating..." : "Generate"}
                </button>
              </div>

              <div className="space-y-4 mt-4">
                {paths.map(path => (
                  <div key={path.id} className="bg-[#141414] border border-[#2a2a2a] rounded-xl p-4">
                    <h4 className="text-[14px] font-semibold text-white mb-3">{path.main_topic}</h4>
                    <ol className="space-y-2 border-l border-[#2a2a2a] ml-2">
                      {path.topics.map((t: string, i: number) => {
                        const isStudied = progress.find(p => p.topic.toLowerCase() === t.toLowerCase());
                        return (
                          <li key={i} className="relative pl-4">
                            <span className={`absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#141414] ${isStudied ? "bg-emerald-500" : "bg-[#444]"}`}></span>
                            <span className={`text-[13px] ${isStudied ? "text-[#bbb]" : "text-[#777]"}`}>{t}</span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
