"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from "lucide-react";

interface WeeklyGoal {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  weight: number;
  isCarriedForward: boolean;
  editedAfterLock: boolean;
  editReason?: string | null;
  createdAt: string;
}

export default function WeeklyGoalsPage() {
  const [goals, setGoals] = useState<WeeklyGoal[]>([]);
  const [weekInfo, setWeekInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<WeeklyGoal | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Technical");
  const [weight, setWeight] = useState(2);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carry-forward modal
  const [showCarryModal, setShowCarryModal] = useState(false);
  const [carryCandidates, setCarryCandidates] = useState<any[]>([]);

  const fetchWeekAndGoals = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/weeks/current");
      const data = await res.json();
      setWeekInfo(data);
      setGoals(data.week?.goals || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekAndGoals();
  }, []);

  const openAddModal = () => {
    setEditingGoal(null);
    setTitle("");
    setDescription("");
    setCategory("Technical");
    setWeight(2);
    setReason("");
    setError(null);
    setShowModal(true);
  };

  const openEditModal = (g: WeeklyGoal) => {
    setEditingGoal(g);
    setTitle(g.title);
    setDescription(g.description || "");
    setCategory(g.category);
    setWeight(g.weight);
    setReason("");
    setError(null);
    setShowModal(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (weekInfo?.isLocked && !reason.trim()) {
      setError("Because the Monday 11:59 PM deadline has passed, a reason is required to modify goals.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingGoal) {
        // PATCH
        const res = await fetch(`/api/weekly-goals/${editingGoal.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            weight,
            reason: reason.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Update failed");
      } else {
        // POST
        const res = await fetch("/api/weekly-goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            category,
            weight,
            weekId: weekInfo.week?.id,
            reason: reason.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Create failed");
      }

      setShowModal(false);
      fetchWeekAndGoals();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm("Are you sure you want to delete this weekly goal?")) return;
    try {
      const res = await fetch(`/api/weekly-goals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      } else {
        fetchWeekAndGoals();
      }
    } catch (err) {
      alert("Error deleting goal");
    }
  };

  const openCarryForward = async () => {
    try {
      // Find past missed goals from monthly or report
      const res = await fetch("/api/reports/monthly");
      const data = await res.json();
      const candidates = data.repeatedMisses || [];
      setCarryCandidates(candidates);
      setShowCarryModal(true);
    } catch {
      alert("Failed to load past goals");
    }
  };

  const handleCarryForwardItem = async (candidateTitle: string) => {
    setTitle(candidateTitle);
    setDescription("Carried forward from previous week's missed goals");
    setCategory("Technical");
    setWeight(3);
    setShowCarryModal(false);
    setShowModal(true);
  };

  const categories = ["Technical", "Academic", "Career", "Health", "Personal"];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <span>Monday Planning Loop</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Goals Planning</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Set 3 to 10 goals per week with priority weights (1 = Normal, 2 = High, 3 = Critical).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={openCarryForward}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Carry Forward Missed
          </button>

          <button
            onClick={openAddModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Lock status banner */}
      {weekInfo?.isLocked ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
          <Lock className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">Goals Locked (Monday 11:59 PM IST has passed).</span>
            <p className="mt-0.5 text-amber-800">
              Per PRD integrity rules, students can still edit or add goals, but every change requires an explicit reason and is logged in the cohort audit trail for program advisors.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 font-medium">
            <Unlock className="w-4 h-4 text-emerald-600" />
            <span>Open Planning Window: Locks Monday at 11:59 PM IST ({weekInfo?.hoursUntilLock || 0} hours remaining).</span>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600 mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">No weekly goals set yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
              PRD recommends setting 3 to 10 goals each Monday to establish a clear weekly habit loop.
            </p>
            <button
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((g, idx) => (
            <div
              key={g.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-400">#{idx + 1}</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                      {g.category}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        g.weight === 3
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : g.weight === 2
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      Weight: {g.weight}x {g.weight === 3 ? "(Critical)" : g.weight === 2 ? "(High)" : "(Normal)"}
                    </span>
                    {g.isCarriedForward && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        Carried Forward
                      </span>
                    )}
                    {g.editedAfterLock && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Edited Post-Lock
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 pt-1">{g.title}</h3>
                  {g.description && (
                    <p className="text-xs text-slate-600 leading-relaxed">{g.description}</p>
                  )}
                  {g.editReason && (
                    <p className="text-[11px] text-amber-800 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 mt-2">
                      <span className="font-semibold">Post-Lock Edit Reason:</span> {g.editReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => openEditModal(g)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Goal"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGoal ? "Edit Weekly Goal" : "Add Weekly Goal"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master PostgreSQL Indexing and Query Optimizations"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Description / Milestones (Optional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details of deliverables, target exercises, or chapters..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Priority Weight (1 to 3)
                  </label>
                  <select
                    value={weight}
                    onChange={(e) => setWeight(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white"
                  >
                    <option value={1}>1 - Normal Weight</option>
                    <option value={2}>2 - High Weight</option>
                    <option value={3}>3 - Critical (Highest Impact)</option>
                  </select>
                </div>
              </div>

              {/* Reason required if locked */}
              {weekInfo?.isLocked && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <div className="flex items-center text-xs font-semibold text-amber-900">
                    <AlertTriangle className="w-4 h-4 mr-1 text-amber-600" />
                    <span>Post-Lock Edit Reason (Mandatory)</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Why are you modifying this goal after Monday midnight?"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs bg-white text-slate-900"
                  />
                  <span className="text-[10px] text-amber-700 block">
                    This reason is recorded in the program audit log.
                  </span>
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? "Saving..." : editingGoal ? "Update Goal" : "Create Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Carry Forward Modal */}
      {showCarryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Carry Forward Past Goal (1-Click)
              </h3>
              <button
                onClick={() => setShowCarryModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              PRD Feature F13: Pull an uncompleted or missed goal from a past week into this week to recommit focus.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {carryCandidates.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No previous missed goals found in the recent archive.
                </div>
              ) : (
                carryCandidates.map((c, i) => (
                  <div
                    key={i}
                    onClick={() => handleCarryForwardItem(c.title || c.goalTitle)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer transition flex items-center justify-between group"
                  >
                    <span className="text-xs font-medium text-slate-800">
                      {c.title || c.goalTitle}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowCarryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

