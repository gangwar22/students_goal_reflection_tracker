"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  AlertTriangle,
  Flame,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [riskOnly, setRiskOnly] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedBatch) params.append("batch", selectedBatch);
      if (riskOnly) params.append("risk", "true");
      if (query.trim()) params.append("q", query.trim());

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const json = await res.json();
      setStudents(json.students || []);

      // Fetch batches for filter
      const bRes = await fetch("/api/admin/batches");
      const bJson = await bRes.json();
      setBatches(bJson.batches || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedBatch, riskOnly, query]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Learner Cohorts</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Cohort List</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Monitor weekly and monthly scores, reflection streaks, and risk alerts.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {/* Batch Filter */}
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-800 font-medium"
          >
            <option value="">All Cohorts</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          {/* At-Risk Toggle */}
          <button
            onClick={() => setRiskOnly(!riskOnly)}
            className={`px-3 py-2 rounded-xl font-semibold flex items-center transition ${
              riskOnly
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
            At-Risk Only
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student by name or email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Cohort</th>
                <th className="py-3 px-4">Weekly %</th>
                <th className="py-3 px-4">Monthly %</th>
                <th className="py-3 px-4">Streak</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Status / Risk Flag</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No students found matching current filters.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition group">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{st.name}</div>
                      <div className="text-[11px] text-slate-400">{st.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      {st.batchName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 text-sm">
                        {st.weeklyPercent !== null ? `${st.weeklyPercent}%` : "Pending"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-700">
                        {st.monthlyPercent !== null ? `${st.monthlyPercent}%` : "N/A"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Flame className="w-3.5 h-3.5 mr-1 fill-amber-500" />
                        {st.streak}d
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {st.lastActive}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.isAtRisk ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                          {st.riskReason || "At-Risk"}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          On Track
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/students/${st.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition"
                      >
                        Inspect
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

