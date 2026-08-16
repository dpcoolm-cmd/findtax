"use client";

import { useEffect } from "react";

export function Toast({
  message,
  tone,
  onDismiss,
}: {
  message: string;
  tone: "success" | "error";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, 4500);
    return () => window.clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      role="status"
      className={`fixed bottom-24 left-1/2 z-[60] max-w-[min(92vw,24rem)] -translate-x-1/2 rounded-xl px-4 py-3 text-center text-sm font-medium shadow-md sm:bottom-8 ${
        tone === "success"
          ? "bg-brand text-ink"
          : "bg-red-600 text-white"
      }`}
    >
      {message}
    </div>
  );
}
