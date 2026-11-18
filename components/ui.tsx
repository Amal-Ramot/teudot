"use client";

import { ButtonHTMLAttributes, ReactNode, forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary:
    "text-white bg-gradient-to-l from-brand-600 to-indigo-500 shadow-lg shadow-brand-600/25 hover:shadow-brand-600/40 hover:brightness-110",
  secondary: "bg-white text-slate-800 ring-1 ring-slate-200 hover:ring-slate-300 hover:bg-slate-50 shadow-sm",
  ghost: "text-slate-600 hover:bg-slate-900/5",
  danger: "text-rose-600 hover:bg-rose-50",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: "sm" | "md" | "lg" }
>(function Button({ variant = "secondary", size = "md", className = "", ...p }, ref) {
  const sz = size === "sm" ? "h-8 px-3 text-sm gap-1.5" : size === "lg" ? "h-12 px-6 text-base gap-2" : "h-10 px-4 text-sm gap-2";
  return (
    <button
      ref={ref}
      {...p}
      className={`inline-flex select-none items-center justify-center rounded-xl font-medium transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${sz} ${variants[variant]} ${className}`}
    />
  );
});

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`glass rounded-3xl ${className}`}>{children}</div>;
}

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <label className={`mb-1.5 block text-xs font-medium text-slate-500 ${className}`}>{children}</label>;
}

export const inputCls =
  "h-10 w-full rounded-xl bg-white px-3 text-sm text-slate-800 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-brand-500";

export function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "green" | "amber" | "brand" }) {
  const t = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    brand: "bg-brand-50 text-brand-700 ring-1 ring-brand-200",
  }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${t}`}>{children}</span>;
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition ${
            value === o.value ? "bg-white font-medium text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
