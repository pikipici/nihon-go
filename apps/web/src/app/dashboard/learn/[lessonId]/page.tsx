"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../../lib/api";
import { Button, Spinner } from "../../../../components/ui";
import { useAuthStore } from "../../../../store/auth.store";

interface Lesson {
  id: string;
  title: string;
  type: string;
  level: string;
  contentJson: Record<string, unknown>;
  xpReward: number;
  estimatedMinutes: number;
}

// ── Hiragana Lesson ──────────────────────────────────────────────────────────
const HIRAGANA_DATA = [
  { char: "あ", roma: "a" }, { char: "い", roma: "i" }, { char: "う", roma: "u" },
  { char: "え", roma: "e" }, { char: "お", roma: "o" }, { char: "か", roma: "ka" },
  { char: "き", roma: "ki" }, { char: "く", roma: "ku" }, { char: "け", roma: "ke" },
  { char: "こ", roma: "ko" }, { char: "さ", roma: "sa" }, { char: "し", roma: "shi" },
  { char: "す", roma: "su" }, { char: "せ", roma: "se" }, { char: "そ", roma: "so" },
  { char: "た", roma: "ta" }, { char: "ち", roma: "chi" }, { char: "つ", roma: "tsu" },
  { char: "て", roma: "te" }, { char: "と", roma: "to" }, { char: "な", roma: "na" },
  { char: "に", roma: "ni" }, { char: "ぬ", roma: "nu" }, { char: "ね", roma: "ne" },
  { char: "の", roma: "no" },
];

function HiraganaLesson({ onComplete }: { onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<"study" | "quiz">("study");
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const items = HIRAGANA_DATA.slice(0, 10);
  const current = items[idx]!;

  // Generate 4 choices
  const getChoices = () => {
    const wrong = HIRAGANA_DATA
      .filter((h) => h.roma !== current.roma)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((h) => h.roma);
    return [...wrong, current.roma].sort(() => Math.random() - 0.5);
  };
  const [choices] = useState(() => getChoices());

  if (phase === "study") {
    return (
      <div className="max-w-sm mx-auto">
        <div className="flex gap-1.5 justify-center mb-6">
          {items.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? "w-4 bg-purple-500" : i === idx ? "w-4 bg-purple-300" : "w-1.5 bg-gray-200"}`} />
          ))}
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center mb-6">
          <div className="text-8xl font-medium text-gray-900 mb-4">{current.char}</div>
          <div className="text-2xl text-purple-600 font-medium">{current.roma}</div>
        </div>
        <div className="flex gap-3">
          {idx > 0 && (
            <Button variant="secondary" onClick={() => setIdx((i) => i - 1)}>←</Button>
          )}
          {idx < items.length - 1 ? (
            <Button fullWidth onClick={() => setIdx((i) => i + 1)}>Berikutnya</Button>
          ) : (
            <Button fullWidth onClick={() => setPhase("quiz")}>Mulai kuis →</Button>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">{idx + 1} / {items.length}</p>
      </div>
    );
  }

  // Quiz phase
  const quizChoices = getChoices();
  return (
    <div className="max-w-sm mx-auto">
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Soal {idx + 1} / {items.length}</span>
        <span className="text-green-600 font-medium">{correct} benar</span>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center mb-6">
        <div className="text-7xl font-medium text-gray-900">{current.char}</div>
        <div className="text-sm text-gray-400 mt-2">Pilih cara baca yang benar</div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {quizChoices.map((choice) => (
          <button
            key={choice}
            onClick={() => { if (!revealed) setSelected(choice); }}
            className={[
              "rounded-xl border p-3 text-center font-medium transition",
              !revealed && selected === choice ? "border-purple-500 bg-purple-50 text-purple-700" :
              revealed && choice === current.roma ? "border-green-400 bg-green-50 text-green-700" :
              revealed && selected === choice && choice !== current.roma ? "border-red-300 bg-red-50 text-red-600" :
              "border-gray-200 hover:border-purple-200",
            ].join(" ")}
          >
            {choice}
          </button>
        ))}
      </div>
      {!revealed ? (
        <Button fullWidth onClick={() => setRevealed(true)} disabled={!selected}>Cek jawaban</Button>
      ) : (
        <Button fullWidth onClick={() => {
          if (selected === current.roma) setCorrect((c) => c + 1);
          if (idx + 1 < items.length) {
            setIdx((i) => i + 1);
            setSelected(null);
            setRevealed(false);
          } else {
            const score = Math.round(((correct + (selected === current.roma ? 1 : 0)) / items.length) * 100);
            onComplete(score);
          }
        }}>
          {idx + 1 < items.length ? "Soal berikutnya" : "Selesai"}
        </Button>
      )}
    </div>
  );
}

// ── Vocabulary Lesson ─────────────────────────────────────────────────────────
function VocabLesson({ onComplete }: { onComplete: (score: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [phase, setPhase] = useState<"study" | "quiz">("study");
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    api.get("/content/vocabulary?level=N5&limit=10")
      .then((r: any) => setItems(r.data.items))
      .catch(() => {});
  }, []);

  if (items.length === 0) return <div className="flex justify-center pt-10"><Spinner /></div>;

  const current = items[idx];

  if (phase === "study") {
    return (
      <div className="max-w-sm mx-auto">
        <div className="flex gap-1.5 justify-center mb-6">
          {items.map((_: any, i: number) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? "w-4 bg-purple-500" : i === idx ? "w-4 bg-purple-300" : "w-1.5 bg-gray-200"}`} />
          ))}
        </div>
        <div
          className="rounded-2xl border border-gray-100 bg-white p-10 text-center mb-6 cursor-pointer min-h-[200px] flex flex-col items-center justify-center"
          onClick={() => setFlipped((f) => !f)}
        >
          {!flipped ? (
            <>
              <div className="text-5xl font-medium text-gray-900 mb-2">{current.word}</div>
              <div className="text-xl text-purple-500">{current.reading}</div>
              <div className="text-xs text-gray-300 mt-4">Ketuk untuk lihat arti</div>
            </>
          ) : (
            <>
              <div className="text-2xl font-medium text-purple-700 mb-3">{current.meaning}</div>
              {current.exampleJp && (
                <div className="text-sm text-gray-500 border-t border-gray-100 pt-3 text-left w-full">
                  <div>{current.exampleJp}</div>
                  <div className="text-gray-400 mt-1">{current.exampleId}</div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex gap-3">
          {idx > 0 && <Button variant="secondary" onClick={() => { setIdx((i) => i - 1); setFlipped(false); }}>←</Button>}
          {idx < items.length - 1 ? (
            <Button fullWidth onClick={() => { setIdx((i) => i + 1); setFlipped(false); }}>Berikutnya</Button>
          ) : (
            <Button fullWidth onClick={() => { setPhase("quiz"); setIdx(0); }}>Mulai kuis →</Button>
          )}
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">{idx + 1} / {items.length}</p>
      </div>
    );
  }

  // Quiz
  const wrong = items.filter((_: any, i: number) => i !== idx).sort(() => Math.random() - 0.5).slice(0, 3).map((v: any) => v.meaning);
  const choices = [...wrong, current.meaning].sort(() => Math.random() - 0.5);

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex justify-between text-sm text-gray-400 mb-4">
        <span>Soal {idx + 1} / {items.length}</span>
        <span className="text-green-600 font-medium">{correct} benar</span>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center mb-6">
        <div className="text-4xl font-medium text-gray-900 mb-1">{current.word}</div>
        <div className="text-purple-500">{current.reading}</div>
      </div>
      <div className="flex flex-col gap-2.5 mb-6">
        {choices.map((choice: string) => (
          <button key={choice} onClick={() => { if (!revealed) setSelected(choice); }}
            className={[
              "rounded-xl border p-3 text-left text-sm transition",
              !revealed && selected === choice ? "border-purple-500 bg-purple-50" :
              revealed && choice === current.meaning ? "border-green-400 bg-green-50 text-green-700" :
              revealed && selected === choice ? "border-red-300 bg-red-50 text-red-600" :
              "border-gray-200 hover:border-purple-200",
            ].join(" ")}
          >{choice}</button>
        ))}
      </div>
      {!revealed ? (
        <Button fullWidth onClick={() => setRevealed(true)} disabled={!selected}>Cek jawaban</Button>
      ) : (
        <Button fullWidth onClick={() => {
          if (selected === current.meaning) setCorrect((c) => c + 1);
          if (idx + 1 < items.length) { setIdx((i) => i + 1); setSelected(null); setRevealed(false); }
          else { const score = Math.round(((correct + (selected === current.meaning ? 1 : 0)) / items.length) * 100); onComplete(score); }
        }}>
          {idx + 1 < items.length ? "Berikutnya" : "Selesai"}
        </Button>
      )}
    </div>
  );
}

// ── Kanji Lesson ──────────────────────────────────────────────────────────────
function KanjiLesson({ onComplete }: { onComplete: (score: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    api.get("/content/kanji?level=N5&limit=10")
      .then((r: any) => setItems(r.data.items))
      .catch(() => {});
  }, []);

  if (items.length === 0) return <div className="flex justify-center pt-10"><Spinner /></div>;

  const k = items[idx];

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex gap-1.5 justify-center mb-6">
        {items.map((_: any, i: number) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? "w-4 bg-purple-500" : i === idx ? "w-4 bg-purple-300" : "w-1.5 bg-gray-200"}`} />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center mb-4 cursor-pointer"
        onClick={() => setShowDetail((s) => !s)}>
        <div className="text-8xl font-medium text-gray-900 mb-4">{k.character}</div>
        {showDetail ? (
          <div className="space-y-2 text-sm text-left border-t border-gray-100 pt-4">
            <div><span className="text-gray-400">Arti: </span><span className="font-medium">{k.meaning}</span></div>
            <div><span className="text-gray-400">On'yomi: </span><span className="text-purple-600">{k.onyomi?.join("、")}</span></div>
            <div><span className="text-gray-400">Kun'yomi: </span><span className="text-teal-600">{k.kunyomi?.join("、")}</span></div>
            <div><span className="text-gray-400">Goresan: </span>{k.strokeCount}</div>
            {k.mnemonic && <div className="bg-amber-50 rounded-lg p-3 text-amber-800 text-xs mt-2">{k.mnemonic}</div>}
          </div>
        ) : (
          <div className="text-xs text-gray-300">Ketuk untuk lihat detail</div>
        )}
      </div>
      <div className="flex gap-3">
        {idx > 0 && <Button variant="secondary" onClick={() => { setIdx((i) => i - 1); setShowDetail(false); }}>←</Button>}
        {idx < items.length - 1 ? (
          <Button fullWidth onClick={() => { setIdx((i) => i + 1); setShowDetail(false); }}>Berikutnya</Button>
        ) : (
          <Button fullWidth onClick={() => onComplete(100)}>Selesai</Button>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">{idx + 1} / {items.length}</p>
    </div>
  );
}

// ── Grammar Lesson ────────────────────────────────────────────────────────────
function GrammarLesson({ onComplete }: { onComplete: (score: number) => void }) {
  const [items, setItems] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    api.get("/content/grammar?level=N5&limit=5")
      .then((r: any) => setItems(r.data.items))
      .catch(() => {});
  }, []);

  if (items.length === 0) return <div className="flex justify-center pt-10"><Spinner /></div>;

  const g = items[idx];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex gap-1.5 justify-center mb-6">
        {items.map((_: any, i: number) => (
          <div key={i} className={`h-1.5 rounded-full transition-all ${i < idx ? "w-4 bg-purple-500" : i === idx ? "w-4 bg-purple-300" : "w-1.5 bg-gray-200"}`} />
        ))}
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 mb-4">
        <div className="inline-block bg-purple-50 text-purple-700 text-xs font-medium px-3 py-1 rounded-full mb-3">{g.pattern}</div>
        <h3 className="text-lg font-medium text-gray-900 mb-3">{g.title}</h3>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{g.explanation}</p>
        {g.examples && (
          <div className="space-y-3 border-t border-gray-100 pt-4">
            <div className="text-xs font-medium text-gray-400 mb-2">Contoh kalimat:</div>
            {g.examples.map((ex: any, i: number) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-900">{ex.jp}</div>
                <div className="text-xs text-gray-400 mt-1">{ex.id}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-3">
        {idx > 0 && <Button variant="secondary" onClick={() => setIdx((i) => i - 1)}>←</Button>}
        {idx < items.length - 1 ? (
          <Button fullWidth onClick={() => setIdx((i) => i + 1)}>Pola berikutnya</Button>
        ) : (
          <Button fullWidth onClick={() => onComplete(100)}>Selesai</Button>
        )}
      </div>
      <p className="text-center text-xs text-gray-400 mt-3">Pola {idx + 1} / {items.length}</p>
    </div>
  );
}

// ── Main Lesson Page ───────────────────────────────────────────────────────────
export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    api.get<{ lesson: Lesson }>(`/content/lessons/${lessonId}`)
      .then((r) => setLesson(r.data.lesson))
      .catch(() => router.push("/dashboard/learn"))
      .finally(() => setLoading(false));
  }, [lessonId]);

  async function completeLesson(score: number) {
    const timeSpentSecs = Math.round((Date.now() - startTime) / 1000);
    try {
      const res = await api.post<{ xpAwarded: number }>(
        `/content/lessons/${lessonId}/complete`,
        { score, timeSpentSecs }
      );
      setXpEarned(res.data.xpAwarded);

      // Refresh user data (XP, streak)
      const meRes = await api.get<{ user: any }>("/auth/me");
      if (meRes.data.user) setUser(meRes.data.user);
    } catch { /* ignore */ }
    setFinished(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  if (!lesson) return null;

  // Completion screen
  if (finished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-sm mx-auto">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-medium mb-2">Lesson selesai!</h2>
        <p className="text-gray-500 mb-2 text-sm">{lesson.title}</p>
        {xpEarned > 0 && (
          <div className="my-4 px-6 py-3 bg-purple-50 rounded-xl">
            <span className="text-purple-600 font-medium text-xl">+{xpEarned} XP</span>
          </div>
        )}
        <p className="text-sm text-gray-400 mb-8">Materi baru otomatis ditambahkan ke SRS deck kamu.</p>
        <div className="flex gap-3 w-full">
          <Button variant="secondary" fullWidth onClick={() => router.push("/dashboard/learn")}>
            Kembali
          </Button>
          <Button fullWidth onClick={() => router.push("/dashboard/srs")}>
            SRS Review →
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-sm text-gray-400 hover:text-gray-600">← Kembali</button>
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full" />
        <span className="text-xs text-gray-400">{lesson.estimatedMinutes} mnt · {lesson.xpReward} XP</span>
      </div>
      <h1 className="text-xl font-medium mb-8">{lesson.title}</h1>

      {lesson.type === "HIRAGANA" || lesson.type === "KATAKANA" ? (
        <HiraganaLesson onComplete={completeLesson} />
      ) : lesson.type === "VOCABULARY" ? (
        <VocabLesson onComplete={completeLesson} />
      ) : lesson.type === "KANJI" ? (
        <KanjiLesson onComplete={completeLesson} />
      ) : lesson.type === "GRAMMAR" ? (
        <GrammarLesson onComplete={completeLesson} />
      ) : (
        <div className="text-center py-12 text-gray-400">
          <p className="mb-4">Tipe lesson: {lesson.type}</p>
          <Button onClick={() => completeLesson(100)}>Tandai selesai</Button>
        </div>
      )}
    </div>
  );
}
