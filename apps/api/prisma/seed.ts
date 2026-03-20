import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const adminHash = await bcrypt.hash("admin123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@nihongo.id" },
    update: {},
    create: { email: "admin@nihongo.id", name: "Admin", passwordHash: adminHash, role: Role.SUPERADMIN, emailVerified: true },
  });

  const demoHash = await bcrypt.hash("demo123!", 12);
  await prisma.user.upsert({
    where: { email: "demo@nihongo.id" },
    update: {},
    create: { email: "demo@nihongo.id", name: "Demo User", passwordHash: demoHash, emailVerified: true },
  });

  // N5 Vocabulary
  const vocabN5 = [
    { word: "猫", reading: "ねこ", meaning: "Kucing", partOfSpeech: "noun" },
    { word: "犬", reading: "いぬ", meaning: "Anjing", partOfSpeech: "noun" },
    { word: "水", reading: "みず", meaning: "Air", partOfSpeech: "noun" },
    { word: "山", reading: "やま", meaning: "Gunung", partOfSpeech: "noun" },
    { word: "本", reading: "ほん", meaning: "Buku", partOfSpeech: "noun" },
    { word: "食べる", reading: "たべる", meaning: "Makan", partOfSpeech: "verb-ru" },
    { word: "飲む", reading: "のむ", meaning: "Minum", partOfSpeech: "verb-u" },
    { word: "行く", reading: "いく", meaning: "Pergi", partOfSpeech: "verb-u" },
    { word: "来る", reading: "くる", meaning: "Datang", partOfSpeech: "verb-irregular" },
    { word: "見る", reading: "みる", meaning: "Melihat", partOfSpeech: "verb-ru" },
    { word: "大きい", reading: "おおきい", meaning: "Besar", partOfSpeech: "i-adjective" },
    { word: "小さい", reading: "ちいさい", meaning: "Kecil", partOfSpeech: "i-adjective" },
    { word: "好き", reading: "すき", meaning: "Suka", partOfSpeech: "na-adjective" },
    { word: "元気", reading: "げんき", meaning: "Sehat/Bersemangat", partOfSpeech: "na-adjective" },
    { word: "学校", reading: "がっこう", meaning: "Sekolah", partOfSpeech: "noun" },
  ];

  for (const v of vocabN5) {
    await prisma.vocabulary.upsert({
      where: { id: v.word } as any,
      update: {},
      create: { ...v, jlptLevel: "N5", exampleJp: `${v.word}が好きです。`, exampleId: `Saya suka ${v.meaning.toLowerCase()}.`, tags: ["N5"] },
    }).catch(() => prisma.vocabulary.create({ data: { ...v, jlptLevel: "N5", exampleJp: `${v.word}を使います。`, tags: ["N5"] } }));
  }

  // N5 Kanji
  const kanjiN5 = [
    { character: "山", onyomi: ["サン"], kunyomi: ["やま"], meaning: "Gunung", strokeCount: 3 },
    { character: "川", onyomi: ["セン"], kunyomi: ["かわ"], meaning: "Sungai", strokeCount: 3 },
    { character: "日", onyomi: ["ニチ","ジツ"], kunyomi: ["ひ","か"], meaning: "Matahari/Hari", strokeCount: 4 },
    { character: "月", onyomi: ["ゲツ","ガツ"], kunyomi: ["つき"], meaning: "Bulan", strokeCount: 4 },
    { character: "人", onyomi: ["ジン","ニン"], kunyomi: ["ひと"], meaning: "Orang", strokeCount: 2 },
    { character: "大", onyomi: ["ダイ","タイ"], kunyomi: ["おお"], meaning: "Besar", strokeCount: 3 },
    { character: "小", onyomi: ["ショウ"], kunyomi: ["ちい","こ"], meaning: "Kecil", strokeCount: 3 },
    { character: "本", onyomi: ["ホン"], kunyomi: ["もと"], meaning: "Buku/Asal", strokeCount: 5 },
  ];

  for (const k of kanjiN5) {
    await prisma.kanji.upsert({
      where: { character: k.character },
      update: {},
      create: { ...k, jlptLevel: "N5", mnemonic: `Bayangkan ${k.meaning.toLowerCase()} dari bentuk kanji ini.`, relatedVocab: [] },
    });
  }

  // N5 Lessons
  const lessons = [
    { title: "Hiragana — Baris A・I・U・E・O", type: "HIRAGANA" as const, orderIndex: 1, estimatedMinutes: 15, xpReward: 20, contentJson: { characters: ["あ","い","う","え","お"], type: "hiragana-intro" } },
    { title: "Hiragana — Baris K・S・T・N", type: "HIRAGANA" as const, orderIndex: 2, estimatedMinutes: 20, xpReward: 25, contentJson: { characters: ["か行","さ行","た行","な行"], type: "hiragana-rows" } },
    { title: "Hiragana — Semua karakter", type: "HIRAGANA" as const, orderIndex: 3, estimatedMinutes: 30, xpReward: 50, contentJson: { type: "hiragana-complete" } },
    { title: "Katakana — Pengenalan", type: "KATAKANA" as const, orderIndex: 4, estimatedMinutes: 20, xpReward: 25, contentJson: { type: "katakana-intro" } },
    { title: "Kosakata N5 — Unit 1: Alam", type: "VOCABULARY" as const, orderIndex: 5, estimatedMinutes: 15, xpReward: 30, contentJson: { unit: 1, theme: "Alam", type: "vocab-list" } },
    { title: "Kanji N5 — Alam & Angka", type: "KANJI" as const, orderIndex: 6, estimatedMinutes: 20, xpReward: 40, contentJson: { type: "kanji-intro" } },
    { title: "Grammar N5 — は・が・を", type: "GRAMMAR" as const, orderIndex: 7, estimatedMinutes: 20, xpReward: 35, contentJson: { patterns: ["〜は〜です","〜が好き","〜をVerbます"], type: "grammar-lesson" } },
  ];

  for (const l of lessons) {
    await prisma.lesson.create({ data: { ...l, level: "N5", prerequisites: [] } }).catch(() => {});
  }

  console.log("✅ Seed selesai!");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
