"use client";

import { useEffect, useState } from "react";

export function StatusToast({ message, tone = "success" }: { message?: string; tone?: "success" | "danger" }) {
  const [visible, setVisible] = useState(Boolean(message));
  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const timeout = window.setTimeout(() => setVisible(false), 3200);
    return () => window.clearTimeout(timeout);
  }, [message]);
  if (!message || !visible) return null;
  return (
    <div
      className={`fixed bottom-4 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
        tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {message}
    </div>
  );
}
