"use client";

import { useEffect, useState } from "react";
import {
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  Download,
} from "lucide-react";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [rerunningId, setRerunningId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/admin/overview");
      const json = await res.json();
      setReports(json.recentReports || []);
    } catch {}
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRerun = async (reportId: string) => {
    setRerunningId(reportId);
    setStatusMsg(null);
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/rerun`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rerun failed");

      setStatusMsg(`Successfully re-analyzed week. Recalculated score: ${data.report.overallPercent}%`);
      fetchReports();
    } catch (err: any) {
      alert(err.message || "Error running analysis");
    } finally {
      setRerunningId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>AI Audit Jobs &amp; Runs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Weekly Analysis Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit executed analysis runs, inspect prompt versions and hash logs, or trigger instant reruns.
          </p>
        </div>

        <a
          href="/api/admin/export?type=csv"
          download
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Export All (CSV)
        </a>
      </div>

      {statusMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {statusMsg}
        </div>
      )}

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Week Start &rarr; End</th>
                <th className="py-3 px-4">Calculated Score</th>
                <th className="py-3 px-4">Model &amp; Prompt</th>
                <th className="py-3 px-4">Audit Hash</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{r.user?.name}</div>
                    <div className="text-slate-400 text-[11px]">{r.user?.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">
                    {r.week?.weekStart} &rarr; {r.week?.weekEnd}
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                    {Math.round(r.overallPercent)}%
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    <span className="font-mono text-[11px] block">{r.model}</span>
                    <span className="text-[10px] text-slate-400">Prompt: {r.promptVersion}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    {r.inputHash}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleRerun(r.id)}
                      disabled={rerunningId === r.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs transition disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 mr-1 ${rerunningId === r.id ? "animate-spin" : ""}`} />
                      {rerunningId === r.id ? "Auditing..." : "Re-Run"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

