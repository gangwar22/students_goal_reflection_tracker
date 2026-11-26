"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  TrendingUp,
  AlertOctagon,
  BrainCircuit,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getTodayString } from "@/lib/date-utils";

export default function MonthlyViewPage() {
  const [selectedMonth, setSelectedMonth] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = getTodayString();
    setSelectedMonth(today.substring(0, 7)); // YYYY-MM
  }, []);

  const fetchMonthlyData = async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?month=${month}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchMonthlyData(selectedMonth);
    }
  }, [selectedMonth]);

  // Transform weeks into trend data
  const trendData =
    data?.weeks?.map((w: any, idx: number) => ({
      name: `Week ${idx + 1} (${w.weekStart.slice(5)})`,
      Achievement: w.percent !== null ? Math.round(w.percent) : null,
      GoalCount: w.goalCount,
    })) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Month Picker Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Monthly Rollup &amp; Trajectory</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Monthly Habit View</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Aggregated performance of all weeks ending in {selectedMonth}.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-600">Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-slate-50 text-slate-900"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Monthly Weighted Average
          </span>
          <div className="text-3xl font-extrabold text-blue-600 mt-1">
            {data?.monthlyPercent ? `${Math.round(data.monthlyPercent)}%` : "N/A"}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Weighted by goal count per week
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Weeks Recorded
          </span>
          <div className="text-3xl font-extrabold text-slate-900 mt-1">
            {data?.totalWeeks || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Weeks ending in this month
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Repeated Misses
          </span>
          <div className="text-3xl font-extrabold text-rose-600 mt-1">
            {data?.repeatedMisses?.length || 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Bottlenecks across multiple weeks
          </p>
        </div>
      </div>

      {/* Trend Line Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Weekly Achievement Trend</h3>
            <p className="text-xs text-slate-500">Historical velocity across weeks of the month</p>
          </div>
          <TrendingUp className="w-5 h-5 text-blue-600" />
        </div>

        {trendData.length > 0 ? (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Achievement"
                  stroke="#2563eb"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#2563eb" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No completed weeks recorded in this month yet.
          </div>
        )}
      </div>

      {/* Weeks as Cards Grid */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-slate-900">All Weeks in Month</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data?.weeks?.map((w: any, idx: number) => (
            <div
              key={w.weekId || idx}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:border-blue-200 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    Week {idx + 1}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">
                    {w.weekStart} &rarr; {w.weekEnd}
                  </h4>
                  <span className="text-xs text-slate-500">{w.goalCount} weekly goals</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-900">
                    {w.percent !== null ? `${Math.round(w.percent)}%` : "N/A"}
                  </span>
                  <span className="block text-[10px] text-slate-400">Score</span>
                </div>
              </div>

              {/* Goal Titles list */}
              <div className="pt-2 border-t border-slate-100 space-y-1">
                {w.goals?.map((g: any) => (
                  <div key={g.id} className="text-xs text-slate-600 flex items-center justify-between">
                    <span className="truncate max-w-xs">• {g.title}</span>
                    <span className="text-[11px] text-slate-400">{g.category}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Repeated Misses & Monthly Learning Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Repeated Misses */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-rose-700 font-bold text-sm">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <span>Repeated Misses Across Month</span>
          </div>
          {data?.repeatedMisses?.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No recurring blockers detected this month.</p>
          ) : (
            <ul className="space-y-2 text-xs text-slate-700">
              {data?.repeatedMisses?.map((rm: any, i: number) => (
                <li key={i} className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl space-y-1">
                  <div className="font-semibold text-rose-900">{rm.title}</div>
                  {rm.reasons && rm.reasons.length > 0 && (
                    <p className="text-rose-800 text-[11px]">Reason: {rm.reasons[0]}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recurring Skills / Learnings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center space-x-2 text-indigo-700 font-bold text-sm">
            <BrainCircuit className="w-4 h-4 text-indigo-600" />
            <span>Recurring Skills &amp; Mastery</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            {data?.recurringSkills?.map((skill: string, i: number) => (
              <li key={i} className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                <span className="font-medium text-indigo-950">{skill}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

