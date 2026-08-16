import type { ReactNode } from "react";

export function Badge({
  children,
  className = "",
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: "default" | "accent";
}) {
  const toneClass =
    tone === "accent"
      ? "border-transparent bg-brand-accent text-brand-dark"
      : "border-line bg-surface text-ink-muted";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
