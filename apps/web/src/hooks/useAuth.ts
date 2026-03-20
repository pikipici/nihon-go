"use client";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../store/auth.store";
import { api } from "../lib/api";

export function useAuth() {
  const router = useRouter();
  const { setUser, setAccessToken, setLoading, logout: clearStore } = useAuthStore();

  async function register(data: { email: string; name: string; password: string }) {
    setLoading(true);
    try {
      await api.post("/auth/register", data);
      await login({ email: data.email, password: data.password });
    } finally { setLoading(false); }
  }

  async function login(data: { email: string; password: string }) {
    setLoading(true);
    try {
      const res = await api.post<{ accessToken: string; user: any }>("/auth/login", data);
      setAccessToken(res.data.accessToken);
      setUser(res.data.user);
      router.push("/dashboard");
    } finally { setLoading(false); }
  }

  async function logout() {
    try { await api.delete("/auth/logout"); } catch { /* ignore */ }
    clearStore();
    router.push("/auth/login");
  }

  async function fetchMe() {
    const res = await api.get<{ user: any }>("/auth/me");
    if (res.data.user) setUser(res.data.user);
    return res.data.user;
  }

  async function handleOAuthCallback(token: string) {
    setAccessToken(token);
    await fetchMe();
    router.push("/dashboard");
  }

  return { register, login, logout, fetchMe, handleOAuthCallback };
}
