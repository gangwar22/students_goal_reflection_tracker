"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Medal, AlertCircle } from "lucide-react";

export default function StudentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setEnabled(data.enabled);
        setLeaderboard(data.leaderboard || []);
      });
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Trophy className="w-3.5 h-3.5" />
            <span>Habit Consistency Standings</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cohort Leaderboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ranked on consistency and reflection discipline (50% streak + 50% achievement).
          </p>
        </div>
      </div>

      {!enabled ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-500 text-xs">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          The cohort leaderboard is currently disabled by program administrators to encourage focus on personal growth.
        </div>
      ) : (
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
                      {i === 0 ? (
                        <span className="flex items-center text-amber-500 font-black">
                          <Medal className="w-4 h-4 mr-1 fill-amber-400" /> #1
                        </span>
                      ) : i === 1 ? (
                        <span className="flex items-center text-slate-400 font-black">
                          <Medal className="w-4 h-4 mr-1 fill-slate-300" /> #2
                        </span>
                      ) : i === 2 ? (
                        <span className="flex items-center text-amber-700 font-black">
                          <Medal className="w-4 h-4 mr-1 fill-amber-600" /> #3
                        </span>
                      ) : (
                        `#${i + 1}`
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {st.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {st.batchName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Flame className="w-3.5 h-3.5 mr-1 fill-amber-500 text-amber-500" />
                        {st.streak}d
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {st.consistencyScore}%
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {st.avgScore}%
                    </td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">
                      {st.rankScore} pts
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

