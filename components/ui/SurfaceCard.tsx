import type { ReactNode } from "react";

export function SurfaceCard({
  children,
  className = "",
  muted = false,
}: {
  children: ReactNode;
  className?: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border ${
        muted
          ? "border-line bg-surface-muted"
          : "border-line bg-surface"
      } ${className}`}
    >
      {children}
    </div>
  );
}
