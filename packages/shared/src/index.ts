// Shared types between apps/api and apps/web

export type JlptLevel = "N5" | "N4" | "N3" | "N2" | "N1" | "JFT";
export type SubscriptionTier = "FREE" | "BASIC" | "PRO" | "LIFETIME";
export type Role = "USER" | "ADMIN" | "SUPERADMIN";
export type LessonType = "HIRAGANA" | "KATAKANA" | "VOCABULARY" | "KANJI" | "GRAMMAR" | "READING" | "LISTENING";
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type SrsItemType = "VOCABULARY" | "KANJI" | "GRAMMAR";

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: Role;
  subscriptionTier: SubscriptionTier;
  currentLevel: JlptLevel;
  targetExam: JlptLevel;
  targetExamDate?: string;
  streakCount: number;
  xpTotal: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
