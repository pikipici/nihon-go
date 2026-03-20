"use client";

import { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../../../hooks/useAuth";
import { Spinner } from "../../../components/ui";

function CallbackInner() {
  const params = useSearchParams();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      handleOAuthCallback(token);
    } else {
      window.location.href = "/auth/login?error=oauth_failed";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Spinner className="mx-auto h-8 w-8" />
        </div>
      }
    >
      <CallbackInner />
    </Suspense>
  );
}
