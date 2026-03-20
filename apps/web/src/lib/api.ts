import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  withCredentials: true,
  timeout: 10_000,
});

// Attach access token from store
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("nihongo-auth");
    const token  = stored ? JSON.parse(stored)?.state?.accessToken : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let refreshing = false;
let queue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (err: AxiosError) => {
    const orig = err.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (err.response?.status !== 401 || orig._retry) return Promise.reject(err);

    if (refreshing) return new Promise((res) => { queue.push((t) => { orig.headers.Authorization = `Bearer ${t}`; res(api(orig)); }); });

    orig._retry = true;
    refreshing  = true;

    try {
      const res = await axios.post<{ accessToken: string }>(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, { withCredentials: true });
      const token = res.data.accessToken;
      // update store
      const stored = sessionStorage.getItem("nihongo-auth");
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.state.accessToken = token;
        sessionStorage.setItem("nihongo-auth", JSON.stringify(parsed));
      }
      queue.forEach((cb) => cb(token));
      queue = [];
      orig.headers.Authorization = `Bearer ${token}`;
      return api(orig);
    } catch {
      sessionStorage.removeItem("nihongo-auth");
      window.location.href = "/auth/login";
      return Promise.reject(err);
    } finally {
      refreshing = false;
    }
  }
);
