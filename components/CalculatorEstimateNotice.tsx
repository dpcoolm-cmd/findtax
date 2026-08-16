"use client";

import { CALCULATOR_ESTIMATE_DEFAULT_BADGE_LABEL } from "@/config/calculator-policy";

export function CalculatorEstimateNotice({
  badge = CALCULATOR_ESTIMATE_DEFAULT_BADGE_LABEL,
  children,
}: {
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-muted px-5 py-4 text-sm leading-relaxed text-ink-muted">
      <span className="inline-flex items-center rounded-full bg-warning px-2.5 py-1 text-[11px] font-semibold text-warning-content">
        {badge}
      </span>
      <div className="mt-3 space-y-1">{children}</div>
    </div>
  );
}
