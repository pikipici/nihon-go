"use client";
import { useUser } from "../../store/auth.store";
import { useAuth } from "../../hooks/useAuth";

export default function DashboardPage() {
  const user = useUser();
  const { logout } = useAuth();

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium">Selamat datang, {user?.name} 👋</h1>
      <p className="mt-1 text-sm text-gray-500">{user?.email} · {user?.subscriptionTier}</p>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: "Level", value: user?.currentLevel ?? "N5" },
          { label: "Target ujian", value: user?.targetExam ?? "N4" },
          { label: "Plan", value: user?.subscriptionTier ?? "FREE" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 bg-white p-4">
            <p className="text-xs text-gray-400">{s.label}</p>
            <p className="mt-1 text-lg font-medium text-purple-600">{s.value}</p>
          </div>
        ))}
      </div>
      <button onClick={logout} className="mt-8 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
        Keluar
      </button>
    </div>
  );
}
