import { z } from "zod";

export const registerSchema = z
  .object({
    name:            z.string().min(2, "Nama minimal 2 karakter").max(80),
    email:           z.string().email("Format email tidak valid"),
    password:        z.string().min(8, "Min. 8 karakter").regex(/[A-Z]/, "Harus ada huruf kapital").regex(/[0-9]/, "Harus ada angka"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, { message: "Konfirmasi password tidak cocok", path: ["confirmPassword"] });

export const loginSchema = z.object({
  email:    z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export type LoginFormData    = z.infer<typeof loginSchema>;
