"use client";

import { useEffect, useState } from "react";
import {
  BookOpen,
  Search,
  Plus,
} from "lucide-react";

interface Learning {
  id: string;
  source: string; // "daily", "weekly", "monthly"
  theme?: string | null;
  text: string;
  tags: string;
  date: string;
}

export default function LearningsPage() {
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [level, setLevel] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // New manual learning modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [theme, setTheme] = useState("");
  const [text, setText] = useState("");
  const [tags, setTags] = useState("");

  const fetchLearnings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level !== "all") params.append("level", level);
      if (search.trim()) params.append("search", search.trim());

      const res = await fetch(`/api/learnings?${params.toString()}`);
      const data = await res.json();
      setLearnings(data.learnings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearnings();
  }, [level, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/learnings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme, text, tags, source: "daily" }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setTheme("");
        setText("");
        setTags("");
        fetchLearnings();
      }
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Habit &amp; Growth Journal</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Learning Timeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Unified timeline of daily, weekly clustered, and monthly learning milestones.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Learning Note
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Level Filters */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600 w-full sm:w-auto">
          {[
            { id: "all", label: "All Levels" },
            { id: "daily", label: "Daily Logs" },
            { id: "weekly", label: "Weekly Themes" },
            { id: "monthly", label: "Monthly Skills" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setLevel(item.id)}
              className={`px-3 py-1.5 rounded-lg transition ${
                level === item.id ? "bg-white text-blue-700 shadow-sm" : "hover:text-slate-900"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, keyword, tag..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Timeline List */}
      <div className="space-y-4">
        {learnings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
            No learning records found matching current filter.
          </div>
        ) : (
          learnings.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2 hover:border-blue-200 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      item.source === "weekly"
                        ? "bg-purple-100 text-purple-700"
                        : item.source === "monthly"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {item.source}
                  </span>
                  {item.theme && (
                    <span className="text-xs font-semibold text-slate-700">
                      {item.theme}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-400">{item.date}</span>
              </div>

              <p className="text-xs text-slate-900 leading-relaxed font-medium">
                {item.text}
              </p>

              {item.tags && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {item.tags.split(",").map((tag, tIdx) => (
                    <span
                      key={tIdx}
                      className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-mono"
                    >
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Learning Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add Learning Note</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Topic / Theme
                </label>
                <input
                  type="text"
                  required
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Distributed Systems, Redis Caching"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  What did you learn? *
                </label>
                <textarea
                  required
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Key takeaway, technical gotcha, or workflow revelation..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="redis, caching, performance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

