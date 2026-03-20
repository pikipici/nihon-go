"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { Spinner } from "../../../components/ui";

export default function CallbackPage() {
  const params = useSearchParams();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (token) handleOAuthCallback(token);
    else window.location.href = "/auth/login?error=oauth_failed";
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto h-8 w-8" />
        <p className="mt-3 text-sm text-gray-500">Menghubungkan akun Google...</p>
      </div>
    </div>
  );
}
