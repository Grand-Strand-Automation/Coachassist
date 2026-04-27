import Link from "next/link";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
export function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F2A341] px-4 py-2.5 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-[#E89A30] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
export function LinkButton({ children, href, className }: { children: ReactNode; href: Route; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-xl bg-[#F2A341] px-4 py-2.5 text-base font-semibold text-slate-900 shadow-sm transition hover:bg-[#E89A30]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm md:p-6", className)}>{children}</div>;
}
export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  required,
  multiline,
  helpText,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  helpText?: string;
}) {
  const base = "mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base outline-none ring-[#0C2D5A]/20 focus:ring-4";
  return (
    <label className="block text-sm font-semibold text-slate-700">
      <span>{label}</span>
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue || ""} placeholder={placeholder} required={required} className={cn(base, "min-h-24")} />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue || ""} placeholder={placeholder} required={required} className={base} />
      )}
      {helpText ? <span className="mt-1 block text-xs font-normal text-slate-500">{helpText}</span> : null}
    </label>
  );
}
export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-7 text-center"><h3 className="text-lg font-bold text-slate-900">{title}</h3><p className="mt-2 text-base text-slate-600">{body}</p>{action ? <div className="mt-4">{action}</div> : null}</div>;
}
export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "green" | "amber" | "slate" }) { const tones = { blue:"bg-blue-50 text-blue-700", green:"bg-emerald-50 text-emerald-700", amber:"bg-amber-50 text-amber-700", slate:"bg-slate-100 text-slate-700" }; return <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", tones[tone])}>{children}</span>; }
