"use client";

import Link from "next/link";
import { BrainCircuit, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-md shadow-blue-500/20 mb-6">
        <BrainCircuit className="w-6 h-6" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full mb-3">
        404 • Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
        Lost in your goals?
      </h1>

      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="mt-6 flex items-center space-x-3">
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <Home className="w-4 h-4 mr-1.5" />
          Go to Home
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Sign In
        </Link>
      </div>
    </div>
  );
}
