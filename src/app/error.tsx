"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertCircle, RotateCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center font-bold text-rose-600 mb-6">
        <AlertCircle className="w-6 h-6" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full mb-3">
        Unexpected Error
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
        Something went wrong
      </h1>

      <p className="mt-2 text-sm text-slate-500 max-w-md">
        An error occurred while loading this page. Please try again or return to the dashboard.
      </p>

      <div className="mt-6 flex items-center space-x-3">
        <button
          onClick={() => reset()}
          className="inline-flex items-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
        >
          <RotateCcw className="w-4 h-4 mr-1.5" />
          Try Again
        </button>
        <Link
          href="/app"
          className="inline-flex items-center px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition"
        >
          <Home className="w-4 h-4 mr-1.5" />
          Dashboard
        </Link>
      </div>
    </div>
  );
}
