"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLeadExperience } from "@/components/lead-experience-context";
import { trackSiteEvent } from "@/lib/site-track";

export function SituationLandingActions({
  situationId,
  label,
  calculatorHref,
  calculatorLabel,
  regionHref,
  regionLabel,
  expertLeadMessage,
  defaultSido,
  defaultSigungu,
}: {
  situationId: string;
  label: string;
  calculatorHref: string;
  calculatorLabel: string;
  regionHref: string;
  regionLabel: string;
  expertLeadMessage: string;
  defaultSido?: string;
  defaultSigungu?: string;
}) {
  const { open } = useLeadExperience();

  useEffect(() => {
    trackSiteEvent("situation_page_view", {
      situationId,
      label,
    });
  }, [label, situationId]);

  const handleCtaClick = (target: "calculator" | "expert_check" | "region") => {
    trackSiteEvent("situation_cta_click", {
      situationId,
      label,
      target,
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Link
          href={calculatorHref}
          onClick={() => handleCtaClick("calculator")}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {calculatorLabel}
        </Link>
        <button
          type="button"
          onClick={() => {
            handleCtaClick("expert_check");
            open({
              defaultSituation: situationId,
              defaultMessage: expertLeadMessage,
              sido: defaultSido,
              sigungu: defaultSigungu,
            });
          }}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-surface px-6 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          전문가와 판단 함께 보기
        </button>
      </div>

      <Link
        href={regionHref}
        onClick={() => handleCtaClick("region")}
        className="inline-flex min-h-12 items-center justify-center rounded-lg border border-line bg-surface px-6 text-sm font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
      >
        {regionLabel}
      </Link>
    </>
  );
}
