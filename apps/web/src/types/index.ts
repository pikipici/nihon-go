export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "JFT";
export type SubscriptionTier = "FREE" | "BASIC" | "PRO" | "LIFETIME";
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface Vocabulary {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  jlptLevel: JlptLevel;
  audioUrl?: string;
  exampleJp?: string;
  exampleId?: string;
}

export interface Kanji {
  id: string;
  character: string;
  onyomi: string[];
  kunyomi: string[];
  meaning: string;
  strokeCount: number;
  jlptLevel: JlptLevel;
  mnemonic?: string;
}

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  level: JlptLevel;
  type: string;
  contentJson: Record<string, unknown>;
  orderIndex: number;
  estimatedMinutes: number;
  xpReward: number;
  prerequisites: string[];
  userProgress?: { status: ProgressStatus; score?: number };
}

export interface SrsCard {
  id: string;
  itemType: "VOCABULARY" | "KANJI";
  easeFactor: number;
  intervalDays: number;
  nextReviewAt: string;
  vocabulary?: Vocabulary;
  kanji?: Kanji;
}
