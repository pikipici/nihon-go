import { z } from "zod";

export const registerSchema = z.object({
  email:    z.string().email("Format email tidak valid"),
  name:     z.string().min(2, "Nama minimal 2 karakter").max(80),
  password: z.string()
    .min(8, "Password minimal 8 karakter")
    .regex(/[A-Z]/, "Harus ada huruf kapital")
    .regex(/[0-9]/, "Harus ada angka"),
});

export const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z.object({
  name:           z.string().min(2).max(80).optional(),
  avatarUrl:      z.string().url().optional(),
  targetExam:     z.enum(["N5","N4","N3","N2","N1","JFT"]).optional(),
  targetExamDate: z.string().datetime().optional(),
});

export type RegisterInput      = z.infer<typeof registerSchema>;
export type LoginInput         = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
