"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Scale,
} from "lucide-react";

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<any[]>([]);

  // Resolution modal
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [overrideScore, setOverrideScore] = useState<number>(80);
  const [adminNotes, setAdminNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchDisputes = async () => {
    try {
      const res = await fetch("/api/admin/disputes");
      const json = await res.json();
      setDisputes(json.disputes || []);
    } catch {}
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const openResolveModal = (d: any) => {
    setSelectedDispute(d);
    setOverrideScore(d.goalScore?.score ? Math.min(100, d.goalScore.score + 25) : 80);
    setAdminNotes("");
    setStatusMsg(null);
  };

  const handleResolve = async (action: "resolve" | "reject") => {
    if (!selectedDispute) return;
    setSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await fetch(`/api/admin/disputes/${selectedDispute.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          overrideScore,
          adminNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");

      setStatusMsg(data.message);
      setTimeout(() => {
        setSelectedDispute(null);
        fetchDisputes();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Failed to resolve dispute");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-600 uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Academic Integrity &amp; Fairness</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student AI Score Disputes</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review student appeals against AI scoring. Overriding a score automatically recalculates the student&apos;s weekly % in code.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {statusMsg}
        </div>
      )}

      {/* Disputes List */}
      <div className="space-y-4">
        {disputes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            No open disputes at this time.
          </div>
        ) : (
          disputes.map((d) => (
            <div
              key={d.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:border-slate-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 border-slate-100">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{d.user?.name}</span>
                    <span className="text-xs text-slate-400">({d.user?.email})</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.status === "pending"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : d.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {d.status === "pending" && (
                  <button
                    onClick={() => openResolveModal(d)}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition self-start sm:self-auto"
                  >
                    Resolve Dispute
                  </button>
                )}
              </div>

              {/* Dispute Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Left: Original AI Evaluation */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Goal &amp; AI Judgment
                  </span>
                  <div className="font-semibold text-slate-900">
                    {d.goalScore?.dailyGoal?.title || "Daily Task"}
                  </div>
                  <div className="text-slate-600">
                    Original Score: <b className="text-slate-900">{d.goalScore?.score}% ({d.goalScore?.status})</b>
                  </div>
                  <p className="text-slate-700 italic bg-white p-2.5 rounded border border-slate-200">
                    &ldquo;{d.goalScore?.reason}&rdquo;
                  </p>
                </div>

                {/* Right: Student Appeal */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 uppercase tracking-wider text-[10px]">
                    Student Appeal Argument
                  </span>
                  <p className="text-amber-950 font-medium leading-relaxed bg-white p-2.5 rounded border border-amber-200">
                    &ldquo;{d.comment}&rdquo;
                  </p>
                  {d.adminNotes && (
                    <div className="pt-2 text-[11px] text-slate-600 border-t border-amber-200">
                      <b>Admin Resolution:</b> {d.adminNotes} (Resolved by {d.resolvedBy})
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Scale className="w-4 h-4 mr-2 text-indigo-600" />
                Resolve Score Dispute
              </h3>
              <button onClick={() => setSelectedDispute(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border text-xs space-y-1">
              <div><span className="font-semibold">Student:</span> {selectedDispute.user?.name}</div>
              <div><span className="font-semibold">Original Score:</span> {selectedDispute.goalScore?.score}%</div>
              <div><span className="font-semibold">Student Appeal:</span> &ldquo;{selectedDispute.comment}&rdquo;</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Override Score (0 to 100%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border rounded-xl font-bold text-sm text-slate-900"
                />
                <span className="text-[11px] text-slate-500 block mt-1">
                  Overriding this score will immediately recalculate the student&apos;s overall weekly % using the weighted formula.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">
                  Decision Notes / Feedback to Student
                </label>
                <textarea
                  rows={2}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="e.g. Reviewed test cases evidence; upgraded score to reflect 95% branch coverage achieved."
                  className="w-full px-3 py-2 border rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleResolve("reject")}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold transition"
                >
                  Reject &amp; Uphold AI Score
                </button>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="px-4 py-2 font-semibold text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleResolve("resolve")}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20"
                  >
                    {submitting ? "Recalculating..." : "Apply Override"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

