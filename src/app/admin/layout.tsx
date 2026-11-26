"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  Users,
  AlertTriangle,
  Trophy,
  Layers,
  FileSpreadsheet,
  MessageSquareWarning,
  Sliders,
  UserCog,
  LogOut,
  Download,
  Menu,
  X,
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    fetch("/api/auth/me", {
      headers: authHeaders,
    })
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.user?.role !== "admin" && data.user?.role !== "mentor") {
          window.location.href = "/app";
        } else {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      });
  }, []);

  const handleLogout = async () => {
    localStorage.removeItem("token");
    await fetch("/api/auth/me", { method: "POST" });
    window.location.href = "/login";
  };

  const isMentor = user?.role === "mentor";

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Students", href: "/admin/students", icon: Users },
    { label: "At-Risk Tracking", href: "/admin/at-risk", icon: AlertTriangle },
    { label: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
    { label: "Batches", href: "/admin/batches", icon: Layers },
    { label: "Reports & Jobs", href: "/admin/reports", icon: FileSpreadsheet },
    { label: "Score Disputes", href: "/admin/disputes", icon: MessageSquareWarning },
    ...(!isMentor
      ? [
          { label: "System Settings", href: "/admin/settings", icon: Sliders },
          { label: "User Management", href: "/admin/users", icon: UserCog },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Admin Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 text-slate-300 select-none">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/25">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight">ReflectAI</span>
              <span className="text-[10px] block text-indigo-400 font-bold uppercase tracking-wider">
                {isMentor ? "Mentor Console" : "Admin Console"}
              </span>
            </div>
          </Link>
        </div>

        {/* Quick CSV Export Button in Sidebar */}
        <div className="p-3">
          <a
            href="/api/admin/export?type=csv"
            download
            className="w-full flex items-center justify-center py-2 px-3 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-2 text-indigo-400" />
            Export Cohort CSV
          </a>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 mr-3 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Admin Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          <div className="truncate text-xs">
            <div className="font-bold text-white truncate">{user?.name || (isMentor ? "Mentor" : "Admin")}</div>
            <div className="text-[11px] text-indigo-400">{isMentor ? "Academic Mentor" : "Program Director"}</div>
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

      {/* Mobile Admin Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 text-white h-16 px-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-base">Admin Console</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-slate-300 hover:bg-slate-800"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 pt-16 px-4 pb-6 overflow-y-auto flex flex-col justify-between">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold ${
                    isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="pt-6 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center py-2.5 bg-slate-800 text-rose-400 rounded-xl text-sm font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

