"use client";
import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { SrsCard } from "../../../types";
import { Button, Spinner } from "../../../components/ui";

const RATING = [
  { value: 1, label: "Lagi", color: "bg-red-50 border-red-200 text-red-700", interval: "1 hr" },
  {
    value: 2,
    label: "Sulit",
    color: "bg-amber-50 border-amber-200 text-amber-700",
    interval: "3 hr",
  },
  {
    value: 3,
    label: "Baik",
    color: "bg-purple-50 border-purple-200 text-purple-700",
    interval: "8 hr",
  },
  {
    value: 4,
    label: "Mudah",
    color: "bg-green-50 border-green-200 text-green-700",
    interval: "15 hr",
  },
];

export default function SrsPage() {
  const [cards, setCards] = useState<SrsCard[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    api
      .get<{ cards: SrsCard[] }>("/srs/due-today")
      .then((r) => setCards(r.data.cards))
      .finally(() => setLoading(false));
  }, []);

  async function rate(rating: number) {
    const card = cards[idx];
    if (!card) return;
    await api.post("/srs/review", { cardId: card.id, rating });
    setStats((s) => ({ correct: s.correct + (rating >= 3 ? 1 : 0), total: s.total + 1 }));
    if (idx + 1 >= cards.length) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setFlipped(false);
  }

  if (loading)
    return (
      <div className="flex justify-center pt-20">
        <Spinner />
      </div>
    );

  if (cards.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-medium mb-1">Semua kartu sudah direview!</h2>
        <p className="text-sm text-gray-500">Tidak ada review yang jatuh tempo hari ini.</p>
      </div>
    );

  if (done)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-medium mb-1">Sesi selesai!</h2>
        <p className="text-sm text-gray-500 mb-4">
          {stats.correct}/{stats.total} benar · {Math.round((stats.correct / stats.total) * 100)}%
          akurasi
        </p>
        <Button
          onClick={() => {
            setIdx(0);
            setDone(false);
            setFlipped(false);
            api.get<{ cards: SrsCard[] }>("/srs/due-today").then((r) => setCards(r.data.cards));
          }}
        >
          Review lagi
        </Button>
      </div>
    );

  const card = cards[idx]!;
  const front = card.vocabulary ? card.vocabulary.word : (card.kanji?.character ?? "");
  const reading = card.vocabulary?.reading ?? card.kanji?.kunyomi?.[0] ?? "";
  const meaning = card.vocabulary?.meaning ?? card.kanji?.meaning ?? "";
  const example = card.vocabulary?.exampleJp;

  return (
    <div className="max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4 text-sm text-gray-500">
        <span>
          Kartu {idx + 1} / {cards.length}
        </span>
        <span className="text-green-600 font-medium">{stats.correct} benar</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-purple-500 rounded-full transition-all"
          style={{ width: `${(idx / cards.length) * 100}%` }}
        />
      </div>

      <div
        className="rounded-2xl border border-gray-100 bg-white overflow-hidden mb-4 cursor-pointer min-h-[220px] flex flex-col"
        onClick={() => setFlipped((f) => !f)}
      >
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div className="text-xs font-medium text-purple-500 bg-purple-50 px-3 py-1 rounded-full mb-4">
            {card.itemType === "VOCABULARY" ? "語彙" : "漢字"} ·{" "}
            {card.vocabulary?.jlptLevel ?? card.kanji?.jlptLevel}
          </div>
          <div className="text-5xl font-medium text-gray-900 mb-2">{front}</div>
          {!flipped && <div className="text-xs text-gray-300 mt-4">Ketuk untuk lihat jawaban</div>}
          {flipped && (
            <div className="mt-4 w-full border-t border-gray-100 pt-4 space-y-2">
              <div className="text-purple-500 font-medium">{reading}</div>
              <div className="text-gray-900 text-lg font-medium">{meaning}</div>
              {example && <div className="text-sm text-gray-500 mt-2 italic">{example}</div>}
            </div>
          )}
        </div>
      </div>

      {flipped ? (
        <div className="grid grid-cols-4 gap-2">
          {RATING.map((r) => (
            <button
              key={r.value}
              onClick={() => rate(r.value)}
              className={`rounded-xl border p-3 text-center transition active:scale-95 ${r.color}`}
            >
              <div className="text-sm font-medium">{r.label}</div>
              <div className="text-xs opacity-70 mt-0.5">{r.interval}</div>
            </button>
          ))}
        </div>
      ) : (
        <Button fullWidth onClick={() => setFlipped(true)}>
          Tampilkan jawaban
        </Button>
      )}
    </div>
  );
}
