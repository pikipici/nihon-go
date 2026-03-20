"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";
import { Button } from "../../components/ui";

const EXAMS = [
  { id: "N5",  label: "JLPT N5",    desc: "Pemula — mulai dari nol" },
  { id: "N4",  label: "JLPT N4",    desc: "Dasar — sudah tahu hiragana" },
  { id: "N3",  label: "JLPT N3",    desc: "Menengah" },
  { id: "JFT", label: "JFT-Basic",  desc: "Untuk kerja di Jepang" },
];

const MINS = [10, 20, 30, 60];

const MIN_DATE = new Date();
MIN_DATE.setDate(MIN_DATE.getDate() + 30);

type Step = "exam" | "date" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep]       = useState<Step>("exam");
  const [exam, setExam]       = useState("N4");
  const [date, setDate]       = useState("");
  const [mins, setMins]       = useState(30);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await api.post("/onboarding/study-plan", {
        targetExam:   exam,
        targetDate:   new Date(date).toISOString(),
        dailyMinutes: mins,
      });
      router.push("/dashboard");
    } catch { /* ignore */ } finally { setLoading(false); }
  }

  if (step === "exam") return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-medium text-purple-600">にほんご</span>
          <p className="mt-2 text-sm text-gray-500">Pilih target ujianmu</p>
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {EXAMS.map((e) => (
            <button key={e.id} onClick={() => setExam(e.id)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${exam === e.id ? "border-purple-500 bg-purple-50" : "border-gray-200 bg-white hover:border-purple-300"}`}>
              <div className={`mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center ${exam === e.id ? "border-purple-600 bg-purple-600" : "border-gray-300"}`}>
                {exam === e.id && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <div>
                <div className="text-sm font-medium">{e.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{e.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <Button fullWidth onClick={() => setStep("date")}>Lanjut</Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl font-medium text-purple-600">にほんご</span>
          <p className="mt-2 text-sm text-gray-500">Kapan kamu ingin ujian?</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal ujian</label>
            <input type="date" min={MIN_DATE.toISOString().split("T")[0]} value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Belajar per hari</label>
            <div className="grid grid-cols-4 gap-2">
              {MINS.map((m) => (
                <button key={m} onClick={() => setMins(m)}
                  className={`rounded-lg border py-2 text-sm font-medium transition ${mins === m ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 hover:border-purple-300"}`}>
                  {m < 60 ? `${m}m` : "1j"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" onClick={() => setStep("exam")}>Kembali</Button>
            <Button fullWidth onClick={submit} loading={loading} disabled={!date}>Buat rencana belajar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
