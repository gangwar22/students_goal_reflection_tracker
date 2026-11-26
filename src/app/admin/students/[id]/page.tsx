"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Shield,
} from "lucide-react";

export default function AdminStudentDetailPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"goals" | "reports" | "learnings">("goals");

  useEffect(() => {
    if (!studentId) return;
    fetch(`/api/admin/students/${studentId}`)
      .then((res) => res.json())
      .then((data) => setStudent(data.student))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-400">Loading student dossier...</div>;
  }

  if (!student) {
    return (
      <div className="p-8 text-center text-xs text-rose-500">
        Student profile not found.
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/admin/students"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Students Cohort
        </Link>
      </div>

      {/* Student Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-lg">
            {student.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{student.name}</h1>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {student.batch?.name || "General Batch"}
              </span>
            </div>
            <p className="text-xs text-slate-500">{student.email} • Timezone: {student.timezone}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-slate-600">
          <Shield className="w-4 h-4 text-indigo-600" />
          <span>Read-Only Administrative View</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("goals")}
          className={`pb-3 px-4 transition border-b-2 ${
            activeTab === "goals"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Weekly &amp; Daily Goals ({student.weeks?.length || 0} Weeks)
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          className={`pb-3 px-4 transition border-b-2 ${
            activeTab === "reports"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          AI Reflection Reports
        </button>
        <button
          onClick={() => setActiveTab("learnings")}
          className={`pb-3 px-4 transition border-b-2 ${
            activeTab === "learnings"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Learning Logs ({student.learnings?.length || 0})
        </button>
      </div>

      {/* Tab 1: Goals & Reflections */}
      {activeTab === "goals" && (
        <div className="space-y-6">
          {student.weeks?.map((w: any) => (
            <div key={w.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                <div>
                  <span className="text-xs font-bold text-indigo-600 uppercase">Week Cycle</span>
                  <h3 className="text-base font-bold text-slate-900">
                    {w.weekStart} &rarr; {w.weekEnd}
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                  Status: {w.status}
                </span>
              </div>

              <div className="space-y-4">
                {w.goals?.map((g: any) => (
                  <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {g.category}
                        </span>
                        <span className="text-xs text-slate-500">Weight: {g.weight}x</span>
                        <span className="text-sm font-bold text-slate-900">{g.title}</span>
                      </div>
                    </div>

                    {/* Daily goals & reflections */}
                    <div className="pl-4 space-y-2 border-l-2 border-slate-200 pt-1">
                      {g.dailyGoals?.map((dg: any) => (
                        <div key={dg.id} className="text-xs bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-900">{dg.title}</span>
                            <span className="text-slate-400 font-mono text-[10px]">{dg.goalDate}</span>
                          </div>

                          {dg.reflection ? (
                            <div className="mt-1 space-y-1 text-slate-700 bg-slate-50 p-2 rounded">
                              <div><span className="font-semibold text-slate-900">What student did:</span> {dg.reflection.didText}</div>
                              {dg.reflection.blockedText && (
                                <div><span className="font-semibold text-slate-900">Blockers:</span> {dg.reflection.blockedText}</div>
                              )}
                              {dg.reflection.learnedText && (
                                <div><span className="font-semibold text-slate-900">Learnings:</span> {dg.reflection.learnedText}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-rose-500 italic block text-[11px]">No reflection recorded (Score 0)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Reports */}
      {activeTab === "reports" && (
        <div className="space-y-6">
          {student.weeks?.map((w: any) => {
            const report = w.reports?.[0];
            let reportData = null;
            if (report?.reportJson) {
              try {
                reportData = JSON.parse(report.reportJson);
              } catch {}
            }

            return (
              <div key={w.id} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-slate-100">
                  <div>
                    <span className="text-xs font-bold text-indigo-600 uppercase">Week Report</span>
                    <h3 className="text-base font-bold text-slate-900">{w.weekStart} &rarr; {w.weekEnd}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {report ? `${Math.round(report.overallPercent)}%` : "Not Analysed"}
                    </span>
                    <span className="block text-[10px] text-slate-400">Audited Score</span>
                  </div>
                </div>

                {reportData && (
                  <div className="space-y-3 text-xs">
                    <p className="p-3 rounded-xl bg-slate-50 text-slate-800 leading-relaxed">
                      {reportData.summary}
                    </p>
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 font-mono text-blue-900">
                      Formula: {reportData.breakdown?.formula}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Learnings */}
      {activeTab === "learnings" && (
        <div className="space-y-3">
          {student.learnings?.map((l: any) => (
            <div key={l.id} className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {l.theme || l.source}
                </span>
                <span className="text-slate-400">{l.date}</span>
              </div>
              <p className="text-slate-900 font-medium leading-relaxed">{l.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

