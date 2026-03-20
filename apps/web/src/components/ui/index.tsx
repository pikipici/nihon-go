"use client";
import { forwardRef, type InputHTMLAttributes, type ButtonHTMLAttributes } from "react";

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, id, className, ...props }, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-medium text-gray-700">{label}</label>}
      <input ref={ref} id={inputId}
        className={cn("w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400",
          error ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100", className)}
        {...props} />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});
Input.displayName = "Input";

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  "primary" | "secondary" | "ghost";
  loading?:  boolean;
  fullWidth?: boolean;
}
export function Button({ variant = "primary", loading, fullWidth, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button disabled={disabled || loading}
      className={cn("inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]",
        fullWidth && "w-full",
        variant === "primary"   && "bg-purple-600 text-white hover:bg-purple-700",
        variant === "secondary" && "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
        variant === "ghost"     && "text-purple-600 hover:bg-purple-50",
        className)}
      {...props}>
      {loading && <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>}
      {children}
    </button>
  );
}

// ── Alert ─────────────────────────────────────────────────────────────────────
export function Alert({ message, type = "error", className }: { message: string; type?: "error" | "success"; className?: string }) {
  return (
    <div className={cn("rounded-xl px-4 py-3 text-sm",
      type === "error"   && "border border-red-200 bg-red-50 text-red-700",
      type === "success" && "border border-green-200 bg-green-50 text-green-700",
      className)}>
      {message}
    </div>
  );
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Divider({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-px flex-1 bg-gray-200" />
      {label && <span className="text-xs text-gray-400">{label}</span>}
      <div className="h-px flex-1 bg-gray-200" />
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return (
    <svg className={cn("animate-spin text-purple-600", className ?? "h-6 w-6")} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
    </svg>
  );
}
