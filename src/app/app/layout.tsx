"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BrainCircuit,
  Home,
  Target,
  CheckSquare,
  Calendar,
  BookOpen,
  History,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  Clock,
  Sparkles,
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  batchName?: string;
  timezone: string;
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentWeekInfo, setCurrentWeekInfo] = useState<{
    weekStart: string;
    weekEnd: string;
    isLocked: boolean;
    hoursUntilLock: number;
  } | null>(null);

  useEffect(() => {
    // Fetch auth user
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.user) {
          if (data.user.role === "admin" || data.user.role === "mentor") {
            router.push("/admin");
          } else {
            setUser(data.user);
          }
        } else {
          router.push("/login");
        }
      })
      .catch(() => router.push("/login"));

    // Fetch current week info
    fetch("/api/weeks/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.week) {
          setCurrentWeekInfo({
            weekStart: data.week.weekStart,
            weekEnd: data.week.weekEnd,
            isLocked: data.isLocked,
            hoursUntilLock: data.hoursUntilLock,
          });
        }
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "POST" });
    router.push("/login");
  };

  const navItems = [
    { label: "Home", href: "/app", icon: Home },
    { label: "Weekly Goals", href: "/app/weekly-goals", icon: Target },
    { label: "Today & Reflect", href: "/app/today", icon: CheckSquare },
    { label: "AI Weekly Report", href: "/app/reports", icon: Sparkles },
    { label: "Monthly View", href: "/app/monthly", icon: Calendar },
    { label: "Learning Log", href: "/app/learnings", icon: BookOpen },
    { label: "History & Compare", href: "/app/history", icon: History },
    { label: "Leaderboard", href: "/app/leaderboard", icon: Trophy },
    { label: "Profile", href: "/app/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 select-none">
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/app" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/25">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">ReflectAI</span>
              <span className="text-[10px] block text-blue-400 font-medium">STUDENT PORTAL</span>
            </div>
          </Link>
        </div>

        {/* Lock status banner in sidebar */}
        {currentWeekInfo && (
          <div className="m-3 p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-xs">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Current Week</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50">IST</span>
            </div>
            <div className="text-white font-semibold text-xs mb-1.5">
              {currentWeekInfo.weekStart} → {currentWeekInfo.weekEnd}
            </div>
            {currentWeekInfo.isLocked ? (
              <div className="flex items-center text-amber-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 mr-1" />
                <span>Goals Locked (Mon 23:59)</span>
              </div>
            ) : (
              <div className="flex items-center text-emerald-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 mr-1" />
                <span>Locks in {currentWeekInfo.hoursUntilLock}h</span>
              </div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30 flex-shrink-0">
              {user?.name?.slice(0, 2).toUpperCase() || "ST"}
            </div>
            <div className="truncate text-xs">
              <div className="font-medium text-white truncate">{user?.name || "Loading..."}</div>
              <div className="text-slate-400 truncate text-[11px]">{user?.email}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/app" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <span className="font-bold text-base text-white">ReflectAI</span>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-800"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 pt-16 px-4 pb-6 overflow-y-auto flex flex-col justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-base font-medium ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3 text-slate-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="pt-6 border-t border-slate-800">
            <div className="text-sm font-medium text-white mb-1">{user?.name}</div>
            <div className="text-xs text-slate-400 mb-4">{user?.email}</div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2.5 bg-slate-800 text-rose-400 rounded-xl text-sm font-medium"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

