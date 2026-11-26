"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  Calendar,
  BarChart3,
  ShieldCheck,
  UserCheck,
  TrendingUp,
  BrainCircuit,
  ArrowRight,
  Clock,
  Award,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loadingUser, setLoadingUser] = useState<string | null>(null);

  const demoLogin = async (email: string, pass: string, role: string) => {
    setLoadingUser(email);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      if (res.ok) {
        if (role === "admin" || role === "mentor") {
          router.push("/admin");
        } else {
          router.push("/app");
        }
      } else {
        alert("Demo login failed, please try logging in manually.");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoadingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">ReflectAI</span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  PRD Platform
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition shadow-sm hover:shadow"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col items-center text-center">
        {/* Subtle pill tag */}
        <div className="inline-flex items-center space-x-2 bg-blue-50 border border-blue-200/70 text-blue-700 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Evidence-Based AI Weekly Goal Tracker & Reflection Engine</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 max-w-4xl leading-[1.15]">
          Set Weekly Goals. Log Daily Evidence.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            Get Auditable AI Truth.
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
          Say goodbye to superficial progress. ReflectAI verifies daily written reflections against locked weekly targets, calculating transparent weighted achievement percentages and real learning insights.
        </p>

        {/* 1-Click Quick Demo Box */}
        <div className="mt-10 p-6 sm:p-7 bg-white border border-slate-200 rounded-3xl max-w-4xl w-full shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1-Click Quick Demo Logins
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Click any role to test immediately</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-left">
            {/* Admin */}
            <button
              onClick={() => demoLogin("admin@tracker.com", "admin123", "admin")}
              disabled={loadingUser !== null}
              className="p-3.5 bg-slate-50/70 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl transition group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                  Admin
                </span>
                <ShieldCheck className="w-4 h-4 text-blue-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-slate-900">Program Staff</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Cohort operations</div>
            </button>

            {/* Mentor */}
            <button
              onClick={() => demoLogin("mentor@tracker.com", "mentor123", "mentor")}
              disabled={loadingUser !== null}
              className="p-3.5 bg-slate-50/70 hover:bg-indigo-50/60 border border-slate-200 hover:border-indigo-300 rounded-2xl transition group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                  Mentor
                </span>
                <UserCheck className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-slate-900">Academic Mentor</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Check student data</div>
            </button>

            {/* Top Student */}
            <button
              onClick={() => demoLogin("alex@student.com", "student123", "student")}
              disabled={loadingUser !== null}
              className="p-3.5 bg-slate-50/70 hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-2xl transition group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-md">
                  Top Student
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-slate-900">Alex Chen</div>
              <div className="text-[11px] text-slate-500 mt-0.5">85% score, daily logs</div>
            </button>

            {/* Dispute Student */}
            <button
              onClick={() => demoLogin("maya@student.com", "student123", "student")}
              disabled={loadingUser !== null}
              className="p-3.5 bg-slate-50/70 hover:bg-amber-50/60 border border-slate-200 hover:border-amber-300 rounded-2xl transition group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                  Dispute
                </span>
                <Clock className="w-4 h-4 text-amber-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-slate-900">Maya Patel</div>
              <div className="text-[11px] text-slate-500 mt-0.5">64% score, dispute</div>
            </button>

            {/* At Risk Student */}
            <button
              onClick={() => demoLogin("rohit@student.com", "student123", "student")}
              disabled={loadingUser !== null}
              className="p-3.5 bg-slate-50/70 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-300 rounded-2xl transition group relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-md">
                  At-Risk
                </span>
                <TrendingUp className="w-4 h-4 text-rose-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-sm font-bold text-slate-900">Rohit Sharma</div>
              <div className="text-[11px] text-slate-500 mt-0.5">&lt;40% score, inactive</div>
            </button>
          </div>

          {loadingUser && (
            <div className="mt-4 text-xs font-medium text-blue-700 animate-pulse text-center">
              Logging into {loadingUser}... Please wait.
            </div>
          )}
        </div>

        {/* Feature Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          {/* Feature 1 */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Monday Goal Habit Loop
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Plan 3 to 10 weekly goals each Monday with weight tags (1-3). Deadlines lock automatically on Monday 11:59 PM IST to ensure accountability.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Daily Evidence Reflections
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Log daily targets linked to weekly goals. Answer what you did, blockers faced, and what you learned within a strict 48-hour backfill window.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm hover:shadow-md transition">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1.5">
              Auditable AI Arithmetic
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              AI evaluates subjective reflections against goals, while rigorous code computes the weighted arithmetic percentage. Transparent and disputable.
            </p>
          </div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        ReflectAI Platform • Built strictly to PRD Specifications • IST Timezone & MongoDB Enabled
      </footer>
    </div>
  );
}
