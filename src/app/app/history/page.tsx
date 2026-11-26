"use client";

import { useEffect, useState } from "react";
import {
  History,
} from "lucide-react";

export default function HistoryComparePage() {
  const [weeks, setWeeks] = useState<any[]>([]);
  const [selectedWeekA, setSelectedWeekA] = useState<string>("");
  const [selectedWeekB, setSelectedWeekB] = useState<string>("");
  const [reportA, setReportA] = useState<any>(null);
  const [reportB, setReportB] = useState<any>(null);

  useEffect(() => {
    // Fetch all user weeks
    fetch("/api/reports/monthly")
      .then((res) => res.json())
      .then((data) => {
        const wList = data.weeks || [];
        setWeeks(wList);
        if (wList.length >= 2) {
          setSelectedWeekA(wList[wList.length - 1].weekId);
          setSelectedWeekB(wList[wList.length - 2].weekId);
        } else if (wList.length === 1) {
          setSelectedWeekA(wList[0].weekId);
        }
      });
  }, []);

  const fetchWeekReport = async (weekId: string, setFn: (r: any) => void) => {
    if (!weekId) {
      setFn(null);
      return;
    }
    try {
      const res = await fetch(`/api/reports/weekly/${weekId}`);
      const json = await res.json();
      setFn(json.report);
    } catch {
      setFn(null);
    }
  };

  useEffect(() => {
    fetchWeekReport(selectedWeekA, setReportA);
  }, [selectedWeekA]);

  useEffect(() => {
    fetchWeekReport(selectedWeekB, setReportB);
  }, [selectedWeekB]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <History className="w-3.5 h-3.5" />
          <span>Historical Archive</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Week Comparison &amp; History</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Select any two weeks to compare goal achievements, completion rates, and learning outcomes side by side.
        </p>
      </div>

      {/* Week Selectors */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Baseline Week (Week A)
          </label>
          <select
            value={selectedWeekA}
            onChange={(e) => setSelectedWeekA(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-slate-50 text-slate-900"
          >
            <option value="">-- Choose Week A --</option>
            {weeks.map((w) => (
              <option key={w.weekId} value={w.weekId}>
                {w.weekStart} &rarr; {w.weekEnd} ({w.percent !== null ? `${Math.round(w.percent)}%` : "Pending"})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
            Comparison Week (Week B)
          </label>
          <select
            value={selectedWeekB}
            onChange={(e) => setSelectedWeekB(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium bg-slate-50 text-slate-900"
          >
            <option value="">-- Choose Week B --</option>
            {weeks.map((w) => (
              <option key={w.weekId} value={w.weekId}>
                {w.weekStart} &rarr; {w.weekEnd} ({w.percent !== null ? `${Math.round(w.percent)}%` : "Pending"})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side by Side Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Week A Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800">
              Week A
            </span>
            <span className="text-2xl font-black text-slate-900">
              {reportA ? `${Math.round(reportA.overallPercent)}%` : "N/A"}
            </span>
          </div>

          {reportA ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Summary</span>
                <p className="p-3 rounded-xl bg-slate-50 text-slate-800 leading-relaxed">
                  {reportA.parsedData?.summary}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">What Was Achieved</span>
                <ul className="space-y-1 text-slate-700">
                  {reportA.parsedData?.achieved?.map((a: string, i: number) => (
                    <li key={i} className="p-2 rounded bg-emerald-50 text-emerald-900">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Missed Items</span>
                <ul className="space-y-1 text-slate-700">
                  {reportA.parsedData?.missed?.map((m: any, i: number) => (
                    <li key={i} className="p-2 rounded bg-rose-50 text-rose-900">
                      • {m.why}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No report data selected for Week A.
            </div>
          )}
        </div>

        {/* Week B Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="border-b pb-3 border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold px-2.5 py-1 rounded bg-indigo-100 text-indigo-800">
              Week B
            </span>
            <span className="text-2xl font-black text-slate-900">
              {reportB ? `${Math.round(reportB.overallPercent)}%` : "N/A"}
            </span>
          </div>

          {reportB ? (
            <div className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-slate-700 block mb-1">Summary</span>
                <p className="p-3 rounded-xl bg-slate-50 text-slate-800 leading-relaxed">
                  {reportB.parsedData?.summary}
                </p>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">What Was Achieved</span>
                <ul className="space-y-1 text-slate-700">
                  {reportB.parsedData?.achieved?.map((a: string, i: number) => (
                    <li key={i} className="p-2 rounded bg-emerald-50 text-emerald-900">
                      • {a}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-700 block mb-1">Missed Items</span>
                <ul className="space-y-1 text-slate-700">
                  {reportB.parsedData?.missed?.map((m: any, i: number) => (
                    <li key={i} className="p-2 rounded bg-rose-50 text-rose-900">
                      • {m.why}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No report data selected for Week B.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

