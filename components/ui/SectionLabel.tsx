import type { ReactNode } from "react";

export function SectionLabel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 text-xs font-bold uppercase text-ink-muted ${className}`}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-brand" />
      {children}
    </div>
  );
}
