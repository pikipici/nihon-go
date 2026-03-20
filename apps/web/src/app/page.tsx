import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl font-medium text-purple-600 mb-4">にほんご</span>
      <h1 className="text-2xl font-medium text-gray-900 mb-2">Belajar Bahasa Jepang dari Nol</h1>
      <p className="text-gray-500 mb-8 max-w-sm">Kurikulum terstruktur untuk lulus JLPT & JFT. Dengan AI Tutor, SRS, dan Mock Test.</p>
      <div className="flex gap-3">
        <Link href="/auth/register" className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700">Mulai gratis</Link>
        <Link href="/auth/login" className="rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50">Masuk</Link>
      </div>
    </main>
  );
}
