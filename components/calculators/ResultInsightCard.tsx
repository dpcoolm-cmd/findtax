import type { ResultInsight } from "@/lib/calculator-insights";

/**
 * 계산 결과 아래 "이 구간에서 흔히 놓치는 것" 카드.
 * 숫자(무엇) → 근거(왜)에 이어, 사용자가 다음에 무엇을 확인해야 하는지 1가지를 제시한다.
 */
export function ResultInsightCard({ insight }: { insight: ResultInsight }) {
  return (
    <div className="mt-4 rounded-lg border border-line bg-surface-muted p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-ink">
          {insight.tag}
        </span>
        <span className="text-xs font-semibold text-ink-soft">이 구간에서 흔히 놓치는 것</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink">{insight.body}</p>
    </div>
  );
}
