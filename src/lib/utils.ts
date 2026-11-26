import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getStatusBadgeClass(status: string) {
  switch (status.toLowerCase()) {
    case "achieved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "partial":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "missed":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "no_evidence":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "achieved":
      return "Achieved (80%+)";
    case "partial":
      return "Partial (40-79%)";
    case "missed":
      return "Missed (<40%)";
    case "no_evidence":
      return "No Evidence (0%)";
    default:
      return status;
  }
}

