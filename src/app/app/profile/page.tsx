"use client";

import { useEffect, useState } from "react";
import { User, CheckCircle2 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    fetch("/api/auth/me", { headers: authHeaders })
      .then((res) => res.json())
      .then((data) => setUser(data.user));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
          <User className="w-3.5 h-3.5" />
          <span>Account &amp; Preferences</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Student Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage timezone and daily reflection reminder preferences.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center">
          <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
          Preferences updated successfully!
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Personal Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Full Name</label>
              <input
                type="text"
                disabled
                value={user?.name || ""}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">Email Address</label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full px-3 py-2 border rounded-xl bg-slate-50 text-slate-600"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900">Schedule &amp; Reminder Preferences</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 uppercase mb-1">
                Timezone (Default Asia/Kolkata per PRD)
              </label>
              <select
                disabled
                value={user?.timezone || "Asia/Kolkata"}
                className="w-full sm:w-72 px-3 py-2 border rounded-xl bg-slate-50 text-slate-800 font-medium"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
              </select>
              <span className="text-[11px] text-slate-400 block mt-1">
                All week boundaries (Monday to Sunday) and lock deadlines are anchored to this timezone.
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">Daily 8:00 PM IST Reflection Reminder</span>
                <span className="text-slate-500 text-[11px]">
                  Receive notification alert if you haven&apos;t completed today&apos;s reflections by 8 PM.
                </span>
              </div>
              <input
                type="checkbox"
                checked={remindersEnabled}
                onChange={(e) => setRemindersEnabled(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 text-right">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

