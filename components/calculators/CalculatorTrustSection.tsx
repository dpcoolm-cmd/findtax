"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";

export const CALCULATOR_REFERENCE_DISCLAIMER =
  "이 계산 결과는 참고용이며 실제 세액과 공제는 개인 상황에 따라 달라질 수 있습니다.";

type CalculatorTrustSectionProps = {
  show: boolean;
  headlineLabel: string;
  amountWon: number;
  basisLines: string[];
  formulaModalTitle?: string;
  formulaModalBody: ReactNode;
  extraDisclaimer?: string;
};

export function CalculatorTrustSection({
  show,
  headlineLabel,
  amountWon,
  basisLines,
  formulaModalTitle = "계산 근거",
  formulaModalBody,
  extraDisclaimer,
}: CalculatorTrustSectionProps) {
  const [open, setOpen] = useState(false);

  const onKey = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onKey]);

  if (!show) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#D5D9D2] bg-white p-8">
        <p className="text-sm font-medium text-neutral-600">산출 결과</p>
        <p className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-baseline">
          <span className="text-sm font-medium text-neutral-800">{headlineLabel}</span>
          <span className="text-5xl font-bold tracking-tight text-neutral-900">
            {amountWon.toLocaleString("ko-KR")}원
          </span>
        </p>
        {basisLines.length > 0 ? (
          <ul className="mt-4 space-y-2 text-sm text-neutral-600">
            {basisLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-xl border border-[#D5D9D2] bg-[#F8FAFC] px-5 py-5">
        <p className="text-sm font-medium text-neutral-900">계산 결과는 참고용으로 확인해 주세요</p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          공제, 감면, 신고 방식에 따라 결과는 달라질 수 있어요. 정확한 세액이 필요하면 한 번 더 확인해 보세요.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          className="text-left text-sm font-medium text-neutral-600 underline underline-offset-2"
          onClick={() => setOpen(true)}
        >
          계산 근거 보기
        </button>
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl border border-[#D5D9D2] bg-white p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="calc-formula-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 id="calc-formula-title" className="text-lg font-semibold text-neutral-900">
                {formulaModalTitle}
              </h3>
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-sm text-neutral-500 hover:bg-[#F8FAFC]"
                onClick={() => setOpen(false)}
              >
                닫기
              </button>
            </div>
            <div className="mt-4 text-sm leading-relaxed text-neutral-700">{formulaModalBody}</div>
          </div>
        </div>
      ) : null}

      <p className="text-sm leading-relaxed text-neutral-600">{CALCULATOR_REFERENCE_DISCLAIMER}</p>
      {extraDisclaimer ? <p className="text-sm leading-relaxed text-neutral-600">{extraDisclaimer}</p> : null}
    </div>
  );
}
