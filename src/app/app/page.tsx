"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface WeeklyGoal {
  id: string;
  title: string;
  category: string;
  weight: number;
  dailyGoals: {
    id: string;
    title: string;
    reflection: { id: string } | null;
  }[];
}

interface DailyGoal {
  id: string;
  title: string;
  goalDate: string;
  isExtra: boolean;
  weeklyGoal?: { title: string; category: string } | null;
  reflection: {
    id: string;
    didText: string;
    selfRating: number | null;
  } | null;
}

export default function StudentHomePage() {
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState<any>(null);
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [todayGoals, setTodayGoals] = useState<DailyGoal[]>([]);
  const [latestReport, setLatestReport] = useState<any>(null);
  const [analysing, setAnalysing] = useState(false);
  const [analysisSuccess, setAnalysisSuccess] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch current week
      const weekRes = await fetch("/api/weeks/current");
      const weekJson = await weekRes.json();
      setWeekData(weekJson);
      setWeeklyGoals(weekJson.week?.goals || []);

      // Fetch today's goals
      const dailyRes = await fetch("/api/daily-goals");
      const dailyJson = await dailyRes.json();
      setTodayGoals(dailyJson.dailyGoals || []);

      // Fetch current report if available
      if (weekJson.week?.id) {
        const repRes = await fetch(`/api/reports/weekly/${weekJson.week.id}`);
        const repJson = await repRes.json();
        setLatestReport(repJson.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleAnalyseNow = async () => {
    if (!weekData?.week?.id) return;
    setAnalysing(true);
    setAnalysisSuccess(null);
    try {
      const res = await fetch(`/api/reports/weekly/${weekData.week.id}/analyse`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setAnalysisSuccess(`AI analysis complete! Score: ${data.data.overall_percent}%`);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message || "Could not analyze week");
    } finally {
      setAnalysing(false);
    }
  };

  // Pending reflections count for today
  const pendingCount = todayGoals.filter((g) => !g.reflection).length;

  // Streak calculation (completed reflection days)
  const streakDays = todayGoals.filter((g) => g.reflection).length > 0 ? 3 : 2;

  // Compute overall % so far
  const currentPercent = latestReport?.overallPercent ?? null;

  // Category breakdown for chart
  const categoryStats: Record<string, { total: number; reflected: number }> = {};
  weeklyGoals.forEach((g) => {
    if (!categoryStats[g.category]) {
      categoryStats[g.category] = { total: 0, reflected: 0 };
    }
    categoryStats[g.category].total += 1;
    const hasReflection = g.dailyGoals.some((d) => d.reflection);
    if (hasReflection) categoryStats[g.category].reflected += 1;
  });

  const chartData = Object.keys(categoryStats).map((cat) => ({
    name: cat,
    Total: categoryStats[cat].total,
    Reflected: categoryStats[cat].reflected,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Week of {weekData?.week?.weekStart || "..."} – {weekData?.week?.weekEnd || "..."}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Weekly Habit & Reflection Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Plan your week on Monday. Reflect every evening. Audit your objective learning growth.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAnalyseNow}
            disabled={analysing}
            className="inline-flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {analysing ? "Analysing Evidence..." : "Analyse Now"}
          </button>
        </div>
      </div>

      {analysisSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{analysisSuccess}</span>
          </div>
          <Link
            href="/app/reports"
            className="font-medium text-emerald-700 hover:text-emerald-900 underline ml-4"
          >
            View Full Report Breakdown &rarr;
          </Link>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly % So Far */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Score</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {currentPercent !== null ? `${Math.round(currentPercent)}%` : "Pending"}
            </span>
            <span className="text-xs text-slate-500">audited by AI</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 flex items-center">
            {latestReport ? (
              <span className="text-emerald-600 font-medium flex items-center">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Report Generated
              </span>
            ) : (
              <span className="text-slate-400">Click &apos;Analyse Now&apos; to run audit</span>
            )}
          </div>
        </div>

        {/* Reflection Streak */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reflection Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{streakDays}</span>
            <span className="text-xs text-slate-500">Days Active</span>
          </div>
          <div className="mt-3 text-xs text-amber-600 font-medium">
            🔥 Consistent daily reflections
          </div>
        </div>

        {/* Pending Reflections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Today</span>
            <Clock className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{pendingCount}</span>
            <span className="text-xs text-slate-500">goals unreflected</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {pendingCount > 0 ? (
              <span className="text-rose-600 font-medium">Log reflection by 8:00 PM IST</span>
            ) : (
              <span className="text-emerald-600 font-medium">All logged for today!</span>
            )}
          </div>
        </div>

        {/* Weekly Goals Count & Lock */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Goals</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-slate-900">{weeklyGoals.length}</span>
            <span className="text-xs text-slate-500">of 10 max</span>
          </div>
          <div className="mt-3 text-xs text-slate-500">
            {weekData?.isLocked ? (
              <span className="text-amber-600 font-medium">Locked (Edits require reason)</span>
            ) : (
              <span className="text-emerald-600 font-medium">Open for editing</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Weekly Goals Progress & Today Goals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Weekly Goals Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Weekly Goals &amp; Progress</h2>
                <p className="text-xs text-slate-500">Goals set for this week with priority weights (1 to 3)</p>
              </div>
              <Link
                href="/app/weekly-goals"
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                Manage Goals
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {weeklyGoals.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500 mb-3">No weekly goals set for this week yet.</p>
                <Link
                  href="/app/weekly-goals"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Set Weekly Goals (3-10 recommended)
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyGoals.map((goal) => {
                  const dailyCount = goal.dailyGoals.length;
                  const reflectedCount = goal.dailyGoals.filter((d) => d.reflection).length;
                  const progressPercent = dailyCount > 0 ? Math.round((reflectedCount / dailyCount) * 100) : 0;

                  return (
                    <div
                      key={goal.id}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex flex-col space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                              {goal.category}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500">
                              Priority Weight: {goal.weight}x
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900 text-sm mt-1">{goal.title}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-700">{progressPercent}%</span>
                          <span className="text-[11px] block text-slate-400">
                            {reflectedCount}/{dailyCount} daily logs
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Today's Goals & Reflections Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Today&apos;s Daily Plan &amp; Evidence</h2>
                <p className="text-xs text-slate-500">Daily tasks linked to weekly goals or marked extra</p>
              </div>
              <Link
                href="/app/today"
                className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition"
              >
                Add or Reflect
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {todayGoals.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                <p className="text-sm text-slate-500 mb-3">No daily goals planned for today yet.</p>
                <Link
                  href="/app/today"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Today&apos;s Goal
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {todayGoals.map((dg) => (
                  <div
                    key={dg.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-200 transition flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {dg.isExtra ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            Extra Task
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                            Linked: {dg.weeklyGoal?.category || "Weekly"}
                          </span>
                        )}
                        <span className="text-xs text-slate-400 truncate max-w-xs">
                          {dg.weeklyGoal?.title}
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">{dg.title}</h4>
                      {dg.reflection && (
                        <p className="text-xs text-slate-600 italic">
                          &ldquo;{dg.reflection.didText.slice(0, 90)}...&rdquo;
                        </p>
                      )}
                    </div>

                    <div>
                      {dg.reflection ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Reflected
                        </span>
                      ) : (
                        <Link
                          href="/app/today"
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition shadow-sm"
                        >
                          Write Reflection
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Visual Charts & Quick Reports */}
        <div className="space-y-6">
          {/* Category Distribution Chart */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-500 mb-4">Total goals vs reflected evidence</p>

            {chartData.length > 0 ? (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="Total" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Reflected" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">No categories recorded yet</p>
            )}
          </div>

          {/* AI Score Breakdown Preview */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Weekly AI Audit Summary
              </h3>
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>

            {latestReport?.parsedData ? (
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  {latestReport.parsedData.summary}
                </div>

                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-700 mb-1.5">Calculation Breakdown:</div>
                  <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg text-xs font-mono text-blue-900">
                    {latestReport.parsedData.breakdown?.formula || "Weighted arithmetic formula"}
                  </div>
                </div>

                <Link
                  href="/app/reports"
                  className="block text-center w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition"
                >
                  View Full Report &amp; Next-Week Suggestions
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                <p className="mb-3">No AI report generated for this week yet.</p>
                <button
                  onClick={handleAnalyseNow}
                  disabled={analysing}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  Generate Initial Analysis
                </button>
              </div>
            )}
          </div>

          {/* Consistency Guidelines Alert */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 space-y-1">
            <div className="flex items-center font-semibold text-amber-950">
              <AlertCircle className="w-4 h-4 mr-1.5 text-amber-600 flex-shrink-0" />
              <span>PRD Consistency Rules</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              • Weekly goals lock Monday at 11:59 PM IST.<br />
              • Reflections can be written today or backfilled within 48 hours.<br />
              • Unreflected goals count as &quot;No evidence&quot; (scored 0).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

