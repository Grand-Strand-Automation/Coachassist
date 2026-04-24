import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function appUrl(path = "") { const base = process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"); return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`; }
export function compactText(parts: Array<string | null | undefined>) { return parts.filter(Boolean).join("\n"); }
