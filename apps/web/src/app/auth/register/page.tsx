"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../../hooks/useAuth";
import { registerSchema, type RegisterFormData } from "../../../lib/validations";
import { Input, Button, Alert, Divider } from "../../../components/ui";

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFormData) => {
    setError("");
    try { await registerUser(data); }
    catch (e: any) { setError(e?.response?.data?.error ?? "Registrasi gagal. Coba lagi."); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-3xl font-medium text-purple-600">にほんご</span>
          <p className="mt-1 text-sm text-gray-500">Mulai belajar bahasa Jepang hari ini</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-8">
          <Button variant="secondary" fullWidth type="button"
            onClick={() => { window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`; }}>
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Daftar dengan Google
          </Button>
          <Divider label="atau daftar dengan email" className="my-5" />
          {error && <Alert message={error} className="mb-4" />}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input label="Nama lengkap" type="text" placeholder="Ardi Nugroho" error={errors.name?.message} {...register("name")} />
            <Input label="Email" type="email" placeholder="kamu@email.com" error={errors.email?.message} {...register("email")} />
            <Input label="Password" type="password" placeholder="Min. 8 karakter" error={errors.password?.message} {...register("password")} />
            <Input label="Konfirmasi password" type="password" placeholder="Ulangi password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
            <Button type="submit" fullWidth loading={isSubmitting} className="mt-1">Buat akun gratis</Button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-400">
            Dengan mendaftar, kamu setuju dengan{" "}
            <Link href="/terms" className="text-purple-600 hover:underline">Syarat & Ketentuan</Link>
          </p>
          <p className="mt-3 text-center text-sm text-gray-500">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="font-medium text-purple-600 hover:underline">Masuk</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
