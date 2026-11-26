"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Calendar, Users } from "lucide-react";

export default function AdminBatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);

  // New batch modal
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2027-01-31");

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/admin/batches");
      const json = await res.json();
      setBatches(json.batches || []);
    } catch {}
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, startDate, endDate }),
      });
      if (res.ok) {
        setShowModal(false);
        setName("");
        fetchBatches();
      }
    } catch {}
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Academic Programs</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Batches &amp; Cohort Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure cohorts, timeline boundaries, and analyze batch-wise average performance.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-500/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Create New Batch
        </button>
      </div>

      {/* Batches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {batches.map((b) => (
          <div
            key={b.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4 hover:border-indigo-200 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase">Cohort</span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{b.name}</h3>
                <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {new Date(b.startDate).toLocaleDateString()} &rarr; {new Date(b.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black text-slate-900">{b.averagePercent}%</span>
                <span className="block text-[10px] text-slate-400">Cohort Average</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1.5 text-slate-400" />
                <b>{b.studentCount}</b> students enrolled
              </span>
              <span className="text-indigo-600 font-semibold">Active Cycle</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Batch Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Create New Cohort</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Batch Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Full Stack Cohort 2027-A"
                  className="w-full px-3 py-2 border rounded-xl text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-xl"
                >
                  Create Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

