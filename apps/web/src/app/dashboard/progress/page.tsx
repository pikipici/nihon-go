"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import { Spinner } from "../../../components/ui";

export default function ProgressPage() {
  const [stats, setStats] = useState<any>(null);
  const [srs, setSrs]     = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get("/users/me/stats").then(r => setStats(r.data.stats)),
      api.get("/srs/stats").then(r => setSrs(r.data.stats)),
    ]);
  }, []);

  if (!stats || !srs) return <div className="flex justify-center pt-20"><Spinner /></div>;

  const cards = [
    { label: "Hari streak",      value: stats.streakCount,    color: "text-amber-500" },
    { label: "Total XP",         value: stats.xpTotal,        color: "text-purple-600" },
    { label: "Hari ke ujian",    value: stats.daysUntilExam ?? "–", color: "text-blue-600" },
    { label: "Kartu SRS total",  value: srs.total,            color: "text-gray-900" },
    { label: "Review hari ini",  value: srs.dueToday,         color: "text-red-500" },
    { label: "Direview hari ini",value: srs.reviewedToday,    color: "text-green-600" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium mb-1">Progress saya</h1>
      <p className="text-sm text-gray-500 mb-6">
        Level {stats.currentLevel} → Target {stats.targetExam}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-100 bg-white p-4">
            <div className={`text-2xl font-medium ${c.color}`}>{c.value}</div>
            <div className="text-xs text-gray-400 mt-1">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
