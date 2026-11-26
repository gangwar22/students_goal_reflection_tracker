"use client";

import { useEffect, useState } from "react";
import { Sliders, CheckCircle2, Save } from "lucide-react";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    minWeeklyGoals: 3,
    maxWeeklyGoals: 10,
    lockTime: "Monday 23:59",
    reminderTime: "20:00",
    scoreThresholdAchieved: 80,
    scoreThresholdPartial: 40,
    promptVersion: "v1.2",
    aiProvider: "auto",
    leaderboardEnabled: true,
  });
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) setSettings(data.settings);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSavedMsg(true);
        setTimeout(() => setSavedMsg(false), 2500);
      }
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>Platform Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure goal thresholds, lock timings, reflection grace periods, and AI engine versions.
          </p>
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          System settings saved and active across all cohort workflows!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Goal Limits & Deadlines */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Goal Limits &amp; Lock Timing
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Minimum Weekly Goals
              </label>
              <input
                type="number"
                min={1}
                value={settings.minWeeklyGoals}
                onChange={(e) => setSettings({ ...settings, minWeeklyGoals: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Maximum Weekly Goals
              </label>
              <input
                type="number"
                max={20}
                value={settings.maxWeeklyGoals}
                onChange={(e) => setSettings({ ...settings, maxWeeklyGoals: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Goal Lock Deadline (IST)
              </label>
              <input
                type="text"
                value={settings.lockTime}
                onChange={(e) => setSettings({ ...settings, lockTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900"
              />
              <span className="text-[11px] text-slate-400 block mt-1">Default: Monday 23:59</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Daily Reminder Time (IST)
              </label>
              <input
                type="text"
                value={settings.reminderTime}
                onChange={(e) => setSettings({ ...settings, reminderTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900"
              />
              <span className="text-[11px] text-slate-400 block mt-1">Default: 20:00 (8:00 PM)</span>
            </div>
          </div>
        </div>

        {/* AI Scoring Engine & Thresholds */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            AI Scoring Thresholds &amp; Engine
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Achieved Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={settings.scoreThresholdAchieved}
                onChange={(e) => setSettings({ ...settings, scoreThresholdAchieved: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900"
              />
              <span className="text-[11px] text-slate-400 block mt-1">PRD Spec: 80% or higher</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Partial Threshold (%)
              </label>
              <input
                type="number"
                min={20}
                max={79}
                value={settings.scoreThresholdPartial}
                onChange={(e) => setSettings({ ...settings, scoreThresholdPartial: Number(e.target.value) })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900"
              />
              <span className="text-[11px] text-slate-400 block mt-1">PRD Spec: 40% to 79% (Below 40% is Missed)</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Prompt Version Key
              </label>
              <input
                type="text"
                value={settings.promptVersion}
                onChange={(e) => setSettings({ ...settings, promptVersion: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                AI Provider Mode
              </label>
              <select
                value={settings.aiProvider}
                onChange={(e) => setSettings({ ...settings, aiProvider: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl bg-white text-slate-900"
              >
                <option value="auto">Auto (Live Claude API if key present, else Deterministic Audit Engine)</option>
                <option value="claude">Claude 3.5 Sonnet Only</option>
                <option value="mock">Deterministic Reflection Engine Only</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-right">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md shadow-indigo-500/20"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save System Settings
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

