"use client";

import { useLeadExperience } from "@/components/lead-experience-context";

export function StickyPageLeadSection({
  defaultSido,
  defaultSigungu,
  defaultTargetAccountantId,
  defaultSituation,
  defaultMessage,
}: {
  defaultSido?: string;
  defaultSigungu?: string;
  defaultTargetAccountantId?: string | null;
  defaultSituation?: string;
  defaultMessage?: string;
}) {
  const { open } = useLeadExperience();
  const bookkeepingCta = defaultSituation === "bookkeeping";

  return (
    <section
      id="consult-section"
      className="sticky bottom-0 z-30 mt-16 rounded-[2rem] border border-line bg-surface px-5 py-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-ink">비교 후에도 복잡하다면, 마지막 판단만 한 번 더 확인해 보세요.</h2>
          <p className="text-sm text-ink-muted">
            조건을 비교한 뒤에도 애매한 부분은 세무사와 최종 판단을 맞춰보세요.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            open({
              sido: defaultSido,
              sigungu: defaultSigungu,
              targetAccountantId: defaultTargetAccountantId,
              defaultSituation,
              defaultMessage,
            })
          }
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-sm font-semibold text-ink hover:bg-brand-light"
        >
          {bookkeepingCta ? "기장 상담 연결하기" : "세무사에게 한 번 더 확인하기"}
        </button>
      </div>
    </section>
  );
}
