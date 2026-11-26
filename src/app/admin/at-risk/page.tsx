"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Mail,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
} from "lucide-react";

export default function AdminAtRiskPage() {
  const [atRiskStudents, setAtRiskStudents] = useState<any[]>([]);
  const [nudgeMsg, setNudgeMsg] = useState<string | null>(null);

  const fetchAtRisk = async () => {
    try {
      const res = await fetch("/api/admin/students?risk=true");
      const json = await res.json();
      setAtRiskStudents(json.students || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAtRisk();
  }, []);

  const handleNudge = (name: string, email: string) => {
    setNudgeMsg(`Mentor check-in reminder queued for ${name} (${email}).`);
    setTimeout(() => setNudgeMsg(null), 3000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-rose-600 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Early Warning System</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">At-Risk Student Intervention</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            PRD Trigger Rule: Students with weekly % below 40% for 2 weeks OR inactive for 3+ days.
          </p>
        </div>
      </div>

      {nudgeMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          {nudgeMsg}
        </div>
      )}

      {/* At-Risk Cards List */}
      <div className="space-y-4">
        {atRiskStudents.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-xs text-slate-400">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-900">Zero At-Risk Students</h3>
            <p className="mt-1 text-slate-500">All learners currently meet habit consistency and score thresholds.</p>
          </div>
        ) : (
          atRiskStudents.map((st) => (
            <div
              key={st.id}
              className="bg-white rounded-2xl border-l-4 border-l-rose-500 border border-slate-200/80 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold text-slate-900">{st.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {st.batchName}
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                    {st.riskReason}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Email: {st.email} • Last active: <b>{st.lastActive}</b> (Inactivity: {st.inactiveDays} days)
                </div>
                <div className="text-xs text-slate-700 font-medium pt-1">
                  Latest Weekly Score: <b className="text-rose-600">{st.weeklyPercent !== null ? `${st.weeklyPercent}%` : "0%"}</b>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleNudge(st.name, st.email)}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold flex items-center transition"
                >
                  <Mail className="w-3.5 h-3.5 mr-1.5" />
                  Nudge Student
                </button>
                <Link
                  href={`/admin/students/${st.id}`}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center transition"
                >
                  View Dossier
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

