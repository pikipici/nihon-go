"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../../lib/api";
import type { Lesson } from "../../../types";
import { Spinner } from "../../../components/ui";

const TYPE_LABEL: Record<string, string> = { HIRAGANA:"ひらがな", KATAKANA:"カタカナ", VOCABULARY:"語彙", KANJI:"漢字", GRAMMAR:"文法", READING:"読解", LISTENING:"聴解" };
const STATUS_COLOR: Record<string, string> = { COMPLETED:"text-green-600 bg-green-50 border-green-200", IN_PROGRESS:"text-purple-600 bg-purple-50 border-purple-200", NOT_STARTED:"text-gray-400 bg-gray-50 border-gray-200" };
const STATUS_LABEL: Record<string, string> = { COMPLETED:"Selesai", IN_PROGRESS:"Lanjutkan", NOT_STARTED:"Mulai" };

export default function LearnPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ lessons: Lesson[] }>("/content/lessons?level=N5&limit=50")
      .then((r) => setLessons(r.data.lessons))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><Spinner /></div>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-medium mb-1">Kurikulum N5</h1>
      <p className="text-sm text-gray-500 mb-6">Selesaikan lesson secara berurutan untuk membuka materi berikutnya.</p>
      <div className="flex flex-col gap-3">
        {lessons.map((l) => {
          const status = l.userProgress?.status ?? "NOT_STARTED";
          return (
            <Link key={l.id} href={`/dashboard/learn/${l.id}`}
              className="flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4 hover:border-purple-200 transition">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-50 text-sm font-medium text-purple-600">
                {TYPE_LABEL[l.type] ?? l.type.slice(0,2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{l.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{l.estimatedMinutes} mnt · {l.xpReward} XP</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLOR[status]}`}>
                {STATUS_LABEL[status]}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
