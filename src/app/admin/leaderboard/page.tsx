"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Medal, Eye, EyeOff } from "lucide-react";

export default function AdminLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [toggling, setToggling] = useState(false);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch("/api/leaderboard");
      const json = await res.json();
      setEnabled(json.enabled);
      setLeaderboard(json.leaderboard || []);
    } catch {}
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const toggleVisibility = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaderboardEnabled: !enabled }),
      });
      if (res.ok) {
        setEnabled(!enabled);
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Cohort Culture &amp; Consistency</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leaderboard Administration</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ranked by reflection streak and habit discipline (50% consistency + 50% achievement).
          </p>
        </div>

        <div>
          <button
            onClick={toggleVisibility}
            disabled={toggling}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold transition ${
              enabled
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : "bg-indigo-600 text-white hover:bg-indigo-500"
            }`}
          >
            {enabled ? (
              <>
                <EyeOff className="w-4 h-4 mr-1.5" />
                Hide from Students
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-1.5" />
                Show to Students
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Cohort</th>
                <th className="py-3 px-4">Streak</th>
                <th className="py-3 px-4">Reflection Rate</th>
                <th className="py-3 px-4">Avg Score</th>
                <th className="py-3 px-4">Composite Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((st, i) => (
                <tr key={st.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {i === 0 ? "🥇 #1" : i === 1 ? "🥈 #2" : i === 2 ? "🥉 #3" : `#${i + 1}`}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{st.name}</td>
                  <td className="py-3.5 px-4 text-slate-500">{st.batchName}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Flame className="w-3.5 h-3.5 mr-1 fill-amber-500" />
                      {st.streak}d
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{st.consistencyScore}%</td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{st.avgScore}%</td>
                  <td className="py-3.5 px-4 font-bold text-indigo-600">{st.rankScore} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

