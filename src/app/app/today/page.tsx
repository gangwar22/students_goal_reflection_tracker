"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { formatFriendlyDate, getTodayString } from "@/lib/date-utils";

interface WeeklyGoal {
  id: string;
  title: string;
  category: string;
  weight: number;
}

interface Reflection {
  id: string;
  didText: string;
  blockedText: string;
  learnedText: string;
  selfRating: number | null;
}

interface DailyGoal {
  id: string;
  title: string;
  goalDate: string;
  isExtra: boolean;
  weeklyGoalId?: string | null;
  weeklyGoal?: WeeklyGoal | null;
  reflection?: Reflection | null;
}

export default function TodayGoalsPage() {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [todayStr, setTodayStr] = useState<string>("");
  const [dailyGoals, setDailyGoals] = useState<DailyGoal[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Daily Goal Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newWeeklyGoalId, setNewWeeklyGoalId] = useState("");
  const [isExtra, setIsExtra] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Reflection Modal
  const [showReflectModal, setShowReflectModal] = useState(false);
  const [activeGoal, setActiveGoal] = useState<DailyGoal | null>(null);
  const [didText, setDidText] = useState("");
  const [blockedText, setBlockedText] = useState("");
  const [learnedText, setLearnedText] = useState("");
  const [selfRating, setSelfRating] = useState<number>(4);
  const [charWarning, setCharWarning] = useState<string | null>(null);
  const [reflectError, setReflectError] = useState<string | null>(null);
  const [savingReflection, setSavingReflection] = useState(false);

  useEffect(() => {
    const today = getTodayString("Asia/Kolkata");
    setTodayStr(today);
    setSelectedDate(today);
  }, []);

  const loadData = async (date: string) => {
    setLoading(true);
    try {
      // Fetch weekly goals for linking
      const weekRes = await fetch("/api/weeks/current");
      const weekData = await weekRes.json();
      setWeeklyGoals(weekData.week?.goals || []);

      // Fetch daily goals for date
      const dailyRes = await fetch(`/api/daily-goals?date=${date}`);
      const dailyData = await dailyRes.json();
      setDailyGoals(dailyData.dailyGoals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadData(selectedDate);
    }
  }, [selectedDate]);

  // Date navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    const ymd = d.toISOString().substring(0, 10);
    setSelectedDate(ymd);
  };

  // Backfill check (48h rule)
  const isBackfillAllowed = () => {
    if (selectedDate === todayStr) return true;
    const sel = new Date(selectedDate);
    const tod = new Date(todayStr);
    const diffHours = (tod.getTime() - sel.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48 && diffHours >= 0;
  };

  const handleCreateDailyGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    // PRD Acceptance criterion: A daily goal cannot be saved without a linked weekly goal or explicit 'extra' flag.
    if (!isExtra && !newWeeklyGoalId) {
      setAddError("You must select a linked weekly goal or check 'Mark as Extra Task'.");
      return;
    }

    try {
      const res = await fetch("/api/daily-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          weeklyGoalId: isExtra ? null : newWeeklyGoalId,
          isExtra,
          goalDate: selectedDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create");

      setShowAddModal(false);
      setNewTitle("");
      setNewWeeklyGoalId("");
      setIsExtra(false);
      loadData(selectedDate);
    } catch (err: any) {
      setAddError(err.message);
    }
  };

  const openReflectionModal = (g: DailyGoal) => {
    setActiveGoal(g);
    setDidText(g.reflection?.didText || "");
    setBlockedText(g.reflection?.blockedText || "");
    setLearnedText(g.reflection?.learnedText || "");
    setSelfRating(g.reflection?.selfRating || 4);
    setCharWarning(null);
    setReflectError(null);
    setShowReflectModal(true);
  };

  // Update char warning in real time
  const handleTextChange = (field: "did" | "blocked" | "learned", val: string) => {
    let d = didText;
    let b = blockedText;
    let l = learnedText;
    if (field === "did") {
      d = val;
      setDidText(val);
    } else if (field === "blocked") {
      b = val;
      setBlockedText(val);
    } else {
      l = val;
      setLearnedText(val);
    }

    const total = d.trim().length + b.trim().length + l.trim().length;
    if (total > 0 && total < 20) {
      setCharWarning(
        "Reflection is shorter than 20 characters. The AI cannot judge minimal text fairly and will mark it low confidence."
      );
    } else {
      setCharWarning(null);
    }
  };

  const handleSaveReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;
    setReflectError(null);
    setSavingReflection(true);

    try {
      const res = await fetch(`/api/daily-goals/${activeGoal.id}/reflection`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          didText,
          blockedText,
          learnedText,
          selfRating,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      setShowReflectModal(false);
      loadData(selectedDate);
    } catch (err: any) {
      setReflectError(err.message);
    } finally {
      setSavingReflection(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Delete this daily task?")) return;
    try {
      await fetch(`/api/daily-goals/${id}`, { method: "DELETE" });
      loadData(selectedDate);
    } catch {}
  };

  const allowedToReflect = isBackfillAllowed();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => shiftDate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {selectedDate === todayStr ? "Today's Log (Asia/Kolkata)" : "Viewing Date"}
            </div>
            <h1 className="text-xl font-bold text-slate-900">{formatFriendlyDate(selectedDate)}</h1>
          </div>
          <button
            onClick={() => shiftDate(1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center space-x-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-xl bg-slate-50 text-slate-800"
          />

          <button
            onClick={() => {
              setNewWeeklyGoalId(weeklyGoals[0]?.id || "");
              setIsExtra(false);
              setNewTitle("");
              setAddError(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Daily Goal
          </button>
        </div>
      </div>

      {/* Backfill window notice */}
      {!allowedToReflect ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-xl flex items-start space-x-3 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">Backfill Window Expired for {selectedDate}.</span>
            <p className="mt-0.5 text-rose-800">
              PRD Rule: Reflections can only be written for today or backfilled up to 48 hours. Unreflected goals on this date will count as &quot;No evidence&quot; (scored 0).
            </p>
          </div>
        </div>
      ) : selectedDate !== todayStr ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-xl flex items-center space-x-2 text-xs">
          <Clock className="w-4 h-4 text-blue-600" />
          <span>Active 48-Hour Grace Backfill Window. You can still document your reflection for {selectedDate}.</span>
        </div>
      ) : null}

      {/* Daily Goals List */}
      <div className="space-y-4">
        {dailyGoals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 mb-1">No daily goals planned for this day</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5">
              Add actionable tasks linked to your weekly targets or marked as extra.
            </p>
            <button
              onClick={() => {
                setNewWeeklyGoalId(weeklyGoals[0]?.id || "");
                setIsExtra(false);
                setNewTitle("");
                setAddError(null);
                setShowAddModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Daily Goal
            </button>
          </div>
        ) : (
          dailyGoals.map((dg) => (
            <div
              key={dg.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {dg.isExtra ? (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        Extra Task (Unlinked)
                      </span>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Linked: {dg.weeklyGoal?.category || "Weekly Goal"}
                      </span>
                    )}
                    {dg.weeklyGoal && (
                      <span className="text-xs text-slate-500 font-medium">
                        &rarr; {dg.weeklyGoal.title}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 pt-1">{dg.title}</h3>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleDeleteGoal(dg.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Reflection Card Inside Daily Goal */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-3">
                {dg.reflection ? (
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                      <span className="font-bold text-emerald-700 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        Reflection Logged (Evidence for AI Audit)
                      </span>
                      {dg.reflection.selfRating && (
                        <div className="flex items-center text-amber-500">
                          <span className="text-slate-600 font-medium mr-1">Self-Rating:</span>
                          {Array.from({ length: dg.reflection.selfRating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700">What I did:</span>
                      <p className="text-slate-900 mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {dg.reflection.didText}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700">What blocked me:</span>
                      <p className="text-slate-900 mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {dg.reflection.blockedText || "No blockers reported."}
                      </p>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700">What I learned:</span>
                      <p className="text-slate-900 mt-0.5 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-200">
                        {dg.reflection.learnedText || "No learning notes added."}
                      </p>
                    </div>

                    {allowedToReflect && (
                      <div className="pt-1 text-right">
                        <button
                          onClick={() => openReflectionModal(dg)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                        >
                          Edit Reflection &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-slate-500">
                      <span className="font-semibold text-slate-700 block">Reflection Pending</span>
                      <span>The AI cannot award completion credit without written reflection evidence.</span>
                    </div>

                    {allowedToReflect ? (
                      <button
                        onClick={() => openReflectionModal(dg)}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition"
                      >
                        Write Reflection
                      </button>
                    ) : (
                      <span className="text-slate-400 italic">Grace period expired (scored 0)</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Daily Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add Daily Goal</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateDailyGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Daily Task / Target *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Implement index on user_id and benchmark query latency"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Acceptance Criteria check: linked or extra */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isExtraCheck"
                    checked={isExtra}
                    onChange={(e) => setIsExtra(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300"
                  />
                  <label htmlFor="isExtraCheck" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Mark as &quot;Extra&quot; (Independent of weekly goals)
                  </label>
                </div>

                {!isExtra && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Link to Weekly Goal *
                    </label>
                    <select
                      value={newWeeklyGoalId}
                      onChange={(e) => setNewWeeklyGoalId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
                    >
                      <option value="">-- Choose Weekly Goal --</option>
                      {weeklyGoals.map((wg) => (
                        <option key={wg.id} value={wg.id}>
                          [{wg.category}] {wg.title}
                        </option>
                      ))}
                    </select>
                    <span className="text-[11px] text-slate-500 block mt-1">
                      Per PRD: Daily goals must be linked to a weekly goal or explicitly marked &apos;Extra&apos;.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20"
                >
                  Save Daily Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reflection Form Modal */}
      {showReflectModal && activeGoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Daily Reflection (Evidence for AI)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-sm">
                  Goal: {activeGoal.title}
                </p>
              </div>
              <button
                onClick={() => setShowReflectModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            {reflectError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {reflectError}
              </div>
            )}

            {/* PRD Acceptance criteria warning: reflection < 20 chars */}
            {charWarning && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-lg flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>{charWarning}</span>
              </div>
            )}

            <form onSubmit={handleSaveReflection} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  1. What I Did (Concrete evidence of tasks completed) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={didText}
                  onChange={(e) => handleTextChange("did", e.target.value)}
                  placeholder="e.g. Set up test table with 1M rows, executed EXPLAIN ANALYZE, added B-tree index and verified query time dropped."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  2. What Blocked Me (Issues, bugs, interruptions, or none)
                </label>
                <textarea
                  rows={2}
                  value={blockedText}
                  onChange={(e) => handleTextChange("blocked", e.target.value)}
                  placeholder="e.g. Took 30 minutes debugging dummy data script syntax."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  3. What I Learned (Concepts, techniques, insights)
                </label>
                <textarea
                  rows={2}
                  value={learnedText}
                  onChange={(e) => handleTextChange("learned", e.target.value)}
                  placeholder="e.g. Discovered that composite index column order must place highest selectivity column first."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                  4. Optional Self-Rating (1 to 5 Stars)
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSelfRating(star)}
                      className={`p-1.5 rounded-lg border transition ${
                        selfRating >= star
                          ? "bg-amber-50 border-amber-300 text-amber-500"
                          : "bg-slate-50 border-slate-200 text-slate-300"
                      }`}
                    >
                      <Star className={`w-5 h-5 ${selfRating >= star ? "fill-amber-400" : ""}`} />
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 ml-2">
                    {selfRating === 5 ? "Exceptional" : selfRating === 4 ? "Solid execution" : selfRating === 3 ? "Average" : "Struggled"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReflectModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReflection}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {savingReflection ? "Submitting Evidence..." : "Save Reflection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

