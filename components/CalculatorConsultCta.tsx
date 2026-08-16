"use client";

import { ResultEmailCapture } from "@/components/ResultEmailCapture";
import { TaxRulesBadge } from "@/components/TaxRulesBadge";
import { useLeadExperience } from "@/components/lead-experience-context";
import {
  type CalculatorCtaSlug,
  type ResultBand,
  getCalculatorCtaCopy,
} from "@/lib/calculator-cta-bands";
import { getDynamicCalculatorConsultCopy } from "@/lib/calculator-consult-cta-dynamic";
import { trackCalculatorCtaClick } from "@/lib/calculator-cta-track";

export function CalculatorConsultCta({
  defaultSido = "서울특별시",
  defaultSigungu = "강남구",
  calculatorLabel,
  defaultSituation = "income_tax",
  resultSummary,
  disabled,
  calculatorSlug,
  resultBand = "low",
  estimatedTaxWon,
  titleOverride,
  subtitleOverride,
  buttonLabelOverride,
  emailCapture = true,
}: {
  defaultSido?: string;
  defaultSigungu?: string;
  calculatorLabel: string;
  defaultSituation?: string;
  resultSummary?: string | null;
  disabled?: boolean;
  calculatorSlug?: CalculatorCtaSlug;
  resultBand?: ResultBand;
  estimatedTaxWon?: number | null;
  titleOverride?: string;
  subtitleOverride?: string;
  buttonLabelOverride?: string;
  /** 결과 이메일 보관 박스 표시 여부 — 페이지 내 보조 위젯에서는 끈다(중복 방지). */
  emailCapture?: boolean;
}) {
  const { open } = useLeadExperience();
  const prefill = resultSummary?.trim()
    ? `[${calculatorLabel} 계산기]\n${resultSummary.trim()}\n\n세무사 검토 상담을 요청합니다.`
    : `[${calculatorLabel}] 세무사 검토 상담을 요청합니다.`;

  const band = resultBand ?? "low";
  const bandCopy = getCalculatorCtaCopy(band);
  const dyn =
    calculatorSlug &&
    calculatorSlug !== "vat" &&
    estimatedTaxWon != null &&
    Number.isFinite(estimatedTaxWon)
      ? getDynamicCalculatorConsultCopy(calculatorSlug, estimatedTaxWon)
      : null;

  const title = titleOverride ?? dyn?.title ?? bandCopy.title;
  const subtitle = subtitleOverride ?? dyn?.subtitle;
  const buttonLabel = buttonLabelOverride ?? dyn?.buttonLabel ?? bandCopy.buttonLabel;

  return (
    <div className="rounded-lg border border-line bg-surface-muted px-6 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <TaxRulesBadge />
      </div>
      <p className="mt-3 text-sm font-medium text-neutral-900">{title}</p>
      {subtitle ? <p className="mt-2 text-sm text-neutral-600">{subtitle}</p> : null}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (calculatorSlug) {
            trackCalculatorCtaClick({
              calculatorType: calculatorSlug,
              resultBand: band,
              clickedCtaType: "open_lead_modal",
            });
          }
          open({
            sido: defaultSido,
            sigungu: defaultSigungu,
            defaultSituation,
            defaultMessage: prefill,
          });
        }}
        className="mt-5 w-full rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {buttonLabel}
      </button>
      {!disabled && emailCapture ? (
        <ResultEmailCapture calculatorLabel={calculatorLabel} summary={resultSummary ?? null} />
      ) : null}
    </div>
  );
}
