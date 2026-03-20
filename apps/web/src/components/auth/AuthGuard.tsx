"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../../store/auth.store";
import { Spinner } from "../ui";
import { api } from "../../lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router      = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setToken    = useAuthStore((s) => s.setAccessToken);
  const setUser     = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!accessToken) {
      api.post<{ accessToken: string }>("/auth/refresh", {})
        .then(async (res) => {
          setToken(res.data.accessToken);
          const me = await api.get<{ user: any }>("/auth/me");
          setUser(me.data.user);
        })
        .catch(() => router.replace("/auth/login"));
    }
  }, []);

  if (!accessToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
