"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Brain,
  Lightbulb,
  Calculator,
  Printer,
} from "lucide-react";
import { getStatusBadgeClass, getStatusLabel } from "@/lib/utils";

export default function WeeklyReportPage() {
  const [report, setReport] = useState<any>(null);
  const [weekInfo, setWeekInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analysing, setAnalysing] = useState(false);

  // Dispute modal
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeGoal, setDisputeGoal] = useState<any>(null);
  const [disputeComment, setDisputeComment] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeMsg, setDisputeMsg] = useState<string | null>(null);

  // Breakdown modal
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const weekRes = await fetch("/api/weeks/current");
      const weekJson = await weekRes.json();
      setWeekInfo(weekJson);

      if (weekJson.week?.id) {
        const repRes = await fetch(`/api/reports/weekly/${weekJson.week.id}`);
        const repJson = await repRes.json();
        setReport(repJson.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleGenerateAnalysis = async () => {
    if (!weekInfo?.week?.id) return;
    setAnalysing(true);
    try {
      const res = await fetch(`/api/reports/weekly/${weekInfo.week.id}/analyse`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      fetchReport();
    } catch (err: any) {
      alert(err.message || "Failed to generate report");
    } finally {
      setAnalysing(false);
    }
  };

  const openDispute = (goalScore: any) => {
    setDisputeGoal(goalScore);
    setDisputeComment("");
    setDisputeMsg(null);
    setShowDisputeModal(true);
  };

  const handleSubmitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeGoal) return;
    setSubmittingDispute(true);
    setDisputeMsg(null);

    try {
      const res = await fetch(`/api/goal-scores/${disputeGoal.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: disputeComment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to file dispute");

      setDisputeMsg("Dispute filed successfully! An administrator will review your reflection evidence.");
      setTimeout(() => {
        setShowDisputeModal(false);
        fetchReport();
      }, 1500);
    } catch (err: any) {
      setDisputeMsg(`Error: ${err.message}`);
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const data = report?.parsedData;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm no-print">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Evidence Evaluation Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Reflection Report</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Transparent breakdown of achievements, missed targets, learnings, and arithmetic.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Export / Print PDF
          </button>

          <button
            onClick={handleGenerateAnalysis}
            disabled={analysing}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {analysing ? "Auditing Week..." : report ? "Re-Run Analysis" : "Generate Analysis"}
          </button>
        </div>
      </div>

      {!report ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center space-y-4">
          <Brain className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Weekly Report Available Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Once you log daily goals and evening reflections, trigger the AI analysis engine to produce your auditable score breakdown.
          </p>
          <button
            onClick={handleGenerateAnalysis}
            disabled={analysing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-sm"
          >
            <Sparkles className="w-4 h-4 mr-1.5" />
            {analysing ? "Evaluating Evidence..." : "Analyse This Week Now"}
          </button>
        </div>
      ) : (
        <div className="space-y-6 print:space-y-4">
          {/* Print Header */}
          <div className="hidden print-only border-b pb-4 mb-4">
            <h1 className="text-2xl font-bold">ReflectAI - Weekly Reflection Audit Report</h1>
            <p className="text-sm text-gray-600">Week of {data?.week_start}</p>
          </div>

          {/* Hero Score & Mathematical Formula Breakdown */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-900/60 px-2.5 py-1 rounded-md border border-blue-700/60">
                  Week of {data?.week_start}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Overall Achievement: {Math.round(data?.overall_percent || 0)}%
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed pt-1">
                  {data?.summary}
                </p>
              </div>

              {/* Arithmetic Formula Box */}
              <div className="bg-slate-800/80 border border-slate-700/80 p-5 rounded-2xl flex flex-col justify-between text-left space-y-3">
                <div className="flex items-center justify-between text-slate-300 text-xs">
                  <span className="font-semibold flex items-center">
                    <Calculator className="w-4 h-4 mr-1.5 text-blue-400" />
                    Arithmetic Breakdown
                  </span>
                  <button
                    onClick={() => setShowBreakdownModal(true)}
                    className="text-[11px] text-blue-400 hover:text-blue-300 underline"
                  >
                    View Steps
                  </button>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-700/50 font-mono text-xs text-blue-200">
                  {data?.breakdown?.formula || `Weekly% = (${data?.overall_percent}%)`}
                </div>

                <div className="text-[11px] text-slate-400">
                  Formula: <span className="font-mono text-slate-300">&sum;(weight &times; score) &divide; &sum;weight</span>
                </div>
              </div>
            </div>
          </div>

          {/* Goals Breakdown List */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Per-Goal Scores &amp; Evidence Quotes</h3>
                <p className="text-xs text-slate-500">Each score is audited directly from your written daily reflections.</p>
              </div>
            </div>

            <div className="space-y-3">
              {data?.goals?.map((g: any, i: number) => {
                // Find matching score record from report.goalScores if available
                const matchingGoalScore = report.goalScores?.find(
                  (gs: any) => gs.dailyGoal?.weeklyGoalId === g.goal_id || gs.dailyGoalId === g.goal_id
                ) || report.goalScores?.[i];

                return (
                  <div
                    key={g.goal_id || i}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                            {g.category}
                          </span>
                          <span className="text-xs text-slate-500 font-medium">
                            Weight: {g.weight}x
                          </span>
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(
                              g.status
                            )}`}
                          >
                            {getStatusLabel(g.status)} ({g.score}%)
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{g.title}</h4>
                      </div>

                      {matchingGoalScore && (
                        <div className="no-print">
                          {matchingGoalScore.disputes && matchingGoalScore.disputes.length > 0 ? (
                            <span className="text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-medium">
                              Dispute {matchingGoalScore.disputes[0].status}
                            </span>
                          ) : (
                            <button
                              onClick={() => openDispute(matchingGoalScore)}
                              className="text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm transition"
                            >
                              Dispute Score
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      <span className="font-semibold text-slate-900">AI Evaluation:</span> {g.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achieved vs Missed Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Achieved */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>What Was Achieved</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {data?.achieved?.map((item: string, idx: number) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-100 flex items-start space-x-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Missed with AI Reasons */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>What Was Missed &amp; Quoted Reasons</span>
              </div>
              {data?.missed?.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No missed goals for this week!</p>
              ) : (
                <ul className="space-y-2 text-xs text-slate-700">
                  {data?.missed?.map((item: any, idx: number) => (
                    <li key={idx} className="p-2.5 rounded-lg bg-rose-50/60 border border-rose-100 flex items-start space-x-2">
                      <span className="text-rose-600 font-bold">•</span>
                      <span>{item.why}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Patterns & Clustered Learnings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patterns Observed */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Observed Execution Patterns</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {data?.patterns?.map((pat: string, idx: number) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start space-x-2">
                    <span className="text-indigo-600 font-bold">&rarr;</span>
                    <span>{pat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Next-Week 3 Suggestions */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-amber-700 font-bold text-sm">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>3 Actionable Suggestions for Next Week</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {data?.next_week_suggestions?.map((sug: string, idx: number) => (
                  <li key={idx} className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 flex items-start space-x-2">
                    <span className="text-amber-600 font-bold">{idx + 1}.</span>
                    <span>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Clustered Learnings (3 to 5 themes per PRD) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <div className="flex items-center space-x-2 text-purple-700 font-bold text-sm">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>Clustered Weekly Learnings (AI Extracted)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.learnings?.map((l: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl bg-purple-50/50 border border-purple-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">{l.theme}</h4>
                  <ul className="space-y-1.5 text-xs text-purple-800">
                    {l.points?.map((pt: string, pidx: number) => (
                      <li key={pidx} className="flex items-start space-x-1.5">
                        <span className="text-purple-500">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Arithmetic Breakdown Modal */}
      {showBreakdownModal && data?.breakdown && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <Calculator className="w-4 h-4 mr-2 text-blue-600" />
                Auditable % Calculation Breakdown
              </h3>
              <button onClick={() => setShowBreakdownModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              PRD Requirement: Percentages are never computed by the AI model. The code strictly calculates weighted averages so scores are completely reproducible.
            </p>

            <div className="space-y-2 border rounded-xl p-3 bg-slate-50 text-xs">
              <div className="font-semibold text-slate-700">Formula Breakdown:</div>
              <div className="p-2 rounded bg-white font-mono text-blue-900 border">
                {data.breakdown.formula}
              </div>

              <div className="pt-2 text-slate-600 space-y-1">
                <div>• Total Weights (&sum; w): <b>{data.breakdown.totalWeight}</b></div>
                <div>• Weighted Sum (&sum; w &times; s): <b>{data.breakdown.weightedScoreSum}</b></div>
                <div>• Final %: <b>{data.breakdown.calculatedPercent}%</b></div>
              </div>
            </div>

            <div className="text-right pt-2">
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Score Dispute Modal */}
      {showDisputeModal && disputeGoal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Dispute AI Score (Feature F14)
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border text-xs space-y-1">
              <div><span className="font-semibold">Goal:</span> {disputeGoal.dailyGoal?.title || disputeGoal.reason}</div>
              <div><span className="font-semibold">Current Score:</span> {disputeGoal.score}% ({disputeGoal.status})</div>
              <div><span className="font-semibold">AI Reason:</span> {disputeGoal.reason}</div>
            </div>

            {disputeMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-lg text-xs">
                {disputeMsg}
              </div>
            )}

            <form onSubmit={handleSubmitDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Why do you believe this score was judged unfairly? *
                </label>
                <textarea
                  required
                  rows={4}
                  value={disputeComment}
                  onChange={(e) => setDisputeComment(e.target.value)}
                  placeholder="Explain why your written reflection shows higher completion than the AI judged..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {submittingDispute ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

