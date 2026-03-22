"use client";

import { useEffect, useState } from "react";
import { useUser } from "../../store/auth.store";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../lib/api";

interface Stats {
  streakCount: number;
  xpTotal: number;
  currentLevel: string;
  targetExam: string;
  targetExamDate: string | null;
  daysUntilExam: number | null;
}

export default function DashboardPage() {
  const user = useUser();
  const { logout } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    api.get<{ stats: Stats }>("/users/me/stats")
      .then((r) => setStats(r.data.stats))
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium">
        Selamat datang, {user?.name} 👋
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {user?.email} · {user?.subscriptionTier}
      </p>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: "Level saat ini",
            value: stats?.currentLevel ?? user?.currentLevel ?? "N5",
            color: "text-purple-600",
          },
          {
            label: "Target ujian",
            value: stats?.targetExam ?? user?.targetExam ?? "N4",
            color: "text-purple-600",
          },
          {
            label: "Hari ke ujian",
            value: stats?.daysUntilExam ? `${stats.daysUntilExam} hari` : "–",
            color: "text-amber-600",
          },
          {
            label: "Total XP",
            value: stats?.xpTotal ?? 0,
            color: "text-green-600",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className={`mt-1 text-lg font-medium ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Study plan info */}
      {stats?.targetExamDate && (
        <div className="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-700">Rencana belajar aktif</p>
          <p className="text-xs text-purple-500 mt-1">
            Target {stats.targetExam} ·{" "}
            {new Date(stats.targetExamDate).toLocaleDateString("id-ID", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <a href="/dashboard/learn"
          className="rounded-xl border border-gray-100 bg-white p-4 hover:border-purple-200 transition">
          <p className="text-sm font-medium text-gray-900">📚 Mulai belajar</p>
          <p className="text-xs text-gray-400 mt-1">Lanjutkan kurikulum N5</p>
        </a>
        <a href="/dashboard/srs"
          className="rounded-xl border border-gray-100 bg-white p-4 hover:border-purple-200 transition">
          <p className="text-sm font-medium text-gray-900">🃏 SRS Review</p>
          <p className="text-xs text-gray-400 mt-1">Review kartu hari ini</p>
        </a>
      </div>

      <button
        onClick={logout}
        className="mt-8 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
      >
        Keluar
      </button>
    </div>
  );
}
