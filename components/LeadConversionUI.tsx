"use client";

import { useEffect } from "react";
import { LeadForm } from "@/components/LeadForm";
import { Toast } from "@/components/Toast";
import { useLeadExperience } from "@/components/lead-experience-context";

export function LeadConversionUI() {
  const { isOpen, close, defaults, toast, clearToast } = useLeadExperience();
  const bookkeepingModal = defaults.defaultSituation === "bookkeeping";
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  return (
    <>
      {toast ? (
        <Toast
          message={toast.message}
          tone={toast.tone}
          onDismiss={clearToast}
        />
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="배경 닫기"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
            className="relative z-10 flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 sm:px-6">
              <h2
                id="lead-modal-title"
                className="text-lg font-bold text-brand sm:text-xl"
              >
                {bookkeepingModal ? "세무 기장 · 법인 기장" : "세무사 매칭 신청"}
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="닫기"
                className="rounded-md px-2 py-1 text-xl leading-none text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto px-4 pb-4 pt-3 sm:px-6 sm:pb-6">
              <p className="text-sm text-neutral-600">
                지역과 상황을 남기면 담당자가 확인 후 연락드립니다.
              </p>
              <p className="mt-1 text-sm font-semibold text-brand-dark">
                계산 결과를 바탕으로 필요한 부분만 전문가와 맞춰보세요.
              </p>
              <button
                type="button"
                onClick={() => {
                  const firstInput = document.querySelector<HTMLInputElement>(
                    "form input, form textarea, form select",
                  );
                  firstInput?.focus();
                }}
                className="mt-3 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-ink shadow-md hover:bg-brand-light"
              >
                무료 매칭 신청서 작성
              </button>
              <div className="mt-4">
                <LeadForm
                  defaultTargetAccountantId={defaults.targetAccountantId}
                  defaultSido={defaults.sido ?? "서울특별시"}
                  defaultSigungu={defaults.sigungu ?? "강남구"}
                  defaultSituation={defaults.defaultSituation}
                  prefillMessage={defaults.defaultMessage}
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </>
  );
}
