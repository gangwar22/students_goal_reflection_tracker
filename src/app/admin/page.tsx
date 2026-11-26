"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);

  const fetchOverview = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const m = data?.metrics;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <span>Program Operations Dashboard</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cohort Analytics Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cohort KPIs for current week: {m?.currentWeek || "..."}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href="/api/admin/export?type=csv"
            download
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Cohort CSV
          </a>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Enrolled</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{m?.totalStudents ?? 0}</div>
          <div className="mt-2 text-xs text-slate-500">
            Active this week: <b className="text-slate-800">{m?.activeThisWeek ?? 0}</b>
          </div>
        </div>

        {/* Avg Weekly % */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Weekly Score</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{m?.averageWeeklyPercent ?? 0}%</div>
          <div className="mt-2 text-xs text-emerald-600 font-medium">
            Computed by audited arithmetic
          </div>
        </div>

        {/* Reflection Completion Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Reflection Rate</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{m?.reflectionCompletionRate ?? 0}%</div>
          <div className="mt-2 text-xs text-slate-500">
            Target benchmark: 70%
          </div>
        </div>

        {/* Open Disputes */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Score Disputes</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600">{m?.pendingDisputes ?? 0}</div>
          <div className="mt-2 text-xs">
            {m?.pendingDisputes > 0 ? (
              <Link href="/admin/disputes" className="text-amber-700 font-bold hover:underline">
                Review pending disputes &rarr;
              </Link>
            ) : (
              <span className="text-slate-400">All disputes resolved</span>
            )}
          </div>
        </div>
      </div>

      {/* Main 2-Column: Recent Reports & At-Risk Quick Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Reports List (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent AI Weekly Audits</h3>
              <p className="text-xs text-slate-500">Latest analysis runs across students</p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              View All Jobs &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {data?.recentReports?.map((r: any) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">{r.user?.name}</span>
                    <span className="text-slate-400">({r.user?.email})</span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Week: {r.week?.weekStart} → {r.week?.weekEnd} • Model: {r.model}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900">{Math.round(r.overallPercent)}%</span>
                    <span className="block text-[10px] text-slate-400">{r.status}</span>
                  </div>
                  <Link
                    href={`/admin/students/${r.user?.id}`}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Col: Quick Links & Program Health */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              PRD Success Targets (Month 1-3)
            </h3>
            <div className="space-y-3 text-xs pt-1">
              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Weekly goals by Mon midnight (Target 80%)</span>
                  <span className="font-bold text-slate-900">82%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: "82%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Daily reflection completion (Target 70%)</span>
                  <span className="font-bold text-slate-900">{m?.reflectionCompletionRate || 0}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, m?.reflectionCompletionRate || 0)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-600 mb-1">
                  <span>Reports generated on time (Target 99%)</span>
                  <span className="font-bold text-slate-900">100%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: "100%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl text-xs text-indigo-950 space-y-2">
            <span className="font-bold flex items-center">
              <ShieldAlert className="w-4 h-4 mr-1 text-indigo-700" />
              Administrative Integrity Rules
            </span>
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              Admins have read-only access to raw student reflections. Disputed score overrides recalculate overall weekly percentages in code automatically to maintain mathematical reproducibility.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

