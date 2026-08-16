"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Circle,
  ExternalLink,
  UserRoundCheck,
} from "lucide-react";
import {
  completionOutcomeLabel,
  TaxCaseCompletionFeedbackForm,
} from "@/components/TaxCaseCompletionFeedbackForm";
import type { VatTaxCaseView } from "@/lib/tax-cases/server";
import { trackGoogleEvent } from "@/lib/site-track";
import {
  HOMETAX_VAT_STEPS,
  type VatFilingMethod,
} from "@/lib/tax-cases/vat-filing-execution";

const HOMETAX_VAT_URL =
  "https://www.hometax.go.kr/ui/pp/vat_index.html?ND2BOX=1&RD3BOX=1&isCdn=Y";

type Props = {
  taxCase: VatTaxCaseView;
  onTaxCaseChange: (taxCase: VatTaxCaseView) => void;
};

export function VatFilingExecutionPanel({
  taxCase,
  onTaxCaseChange,
}: Props) {
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const readyDocuments = taxCase.documents.filter(
    (document) => document.status === "ready",
  ).length;
  const nextDocument = useMemo(
    () =>
      taxCase.documents.find((document) => document.status !== "ready") ?? null,
    [taxCase.documents],
  );
  const allDocumentsReady =
    taxCase.documents.length > 0 &&
    readyDocuments === taxCase.documents.length;

  const request = async (
    path: string,
    init: RequestInit,
    busy: string,
    fallbackMessage: string,
  ) => {
    if (busyKey) return;
    setBusyKey(busy);
    setError(null);
    try {
      const response = await fetch(path, init);
      const body = (await response.json()) as {
        taxCase?: VatTaxCaseView;
      };
      if (!response.ok || !body.taxCase) {
        setError(fallbackMessage);
        return;
      }
      onTaxCaseChange(body.taxCase);
    } catch {
      setError(fallbackMessage);
    } finally {
      setBusyKey(null);
    }
  };

  const selectMethod = (
    filingMethod: Exclude<VatFilingMethod, "undecided">,
  ) =>
    request(
      `/api/tax-cases/${taxCase.token}/filing-method`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filingMethod }),
      },
      `method:${filingMethod}`,
      "신고 방식을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );

  const updateDocument = (documentKey: string, ready: boolean) =>
    request(
      `/api/tax-cases/${taxCase.token}/documents/${documentKey}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ready ? "ready" : "pending" }),
      },
      `document:${documentKey}`,
      "서류 준비 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );

  const recordExternalAction = (
    action: "hometax_open" | "consultation_open",
  ) => {
    trackGoogleEvent(
      action === "hometax_open"
        ? "tax_case_hometax_opened"
        : "tax_case_consultation_opened",
      {
        caseType: "vat",
        filingMethod: taxCase.filingMethod,
        recommendation: taxCase.recommendation,
        complexityBand:
          taxCase.complexityScore >= 62
            ? "high"
            : taxCase.complexityScore >= 34
              ? "mid"
              : "low",
      },
    );
    void fetch(`/api/tax-cases/${taxCase.token}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
      keepalive: true,
    }).catch(() => undefined);
  };

  if (taxCase.status === "completed") {
    return (
      <section className="mt-8 border-y border-[#B8CDBE] bg-[#F3F8F4] px-4 py-7 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#27543B] text-white">
            <Check size={22} />
          </span>
          <div>
            <p className="text-sm font-bold text-[#27543B]">신고 완료</p>
            <h2 className="mt-1 text-2xl font-black text-ink">
              이번 부가세 신고를 완료했어요.
            </h2>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {completionOutcomeLabel(taxCase.completionOutcome)}로 기록했습니다.
              {taxCase.actualTaxAmountWon !== null
                ? ` 실제 금액은 ${taxCase.actualTaxAmountWon.toLocaleString("ko-KR")}원입니다.`
                : ""}{" "}
              접수증과 납부 내역은 홈택스에서 별도로 보관해 주세요.
            </p>
            {taxCase.nextReviewDate ? (
              <p className="mt-2 text-xs font-bold text-[#27543B]">
                다음 점검일 {taxCase.nextReviewDate}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8" aria-labelledby="filing-execution-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-[#6A442D]">실제 신고 진행</p>
          <h2
            id="filing-execution-title"
            className="mt-2 text-2xl font-black text-ink"
          >
            여기서부터 순서대로 진행하세요.
          </h2>
        </div>
        <p className="text-sm font-semibold text-ink-muted">
          자료 {readyDocuments}/{taxCase.documents.length}
        </p>
      </div>

      <div className="mt-5 divide-y divide-line border-y border-line bg-white">
        <div className="px-2 py-6 sm:px-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6A442D] text-sm font-black text-white">
              1
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-ink">신고 방식 선택</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                나중에 바꿀 수 있습니다. 선택에 따라 다음 행동만 달라집니다.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2" role="group">
                <button
                  type="button"
                  disabled={busyKey !== null}
                  aria-pressed={taxCase.filingMethod === "direct"}
                  onClick={() => void selectMethod("direct")}
                  className={`min-h-12 border px-3 py-2 text-sm font-bold transition-colors ${
                    taxCase.filingMethod === "direct"
                      ? "border-[#6A442D] bg-[#F7F1EC] text-[#4B2E1F]"
                      : "border-line bg-white text-ink-muted hover:border-[#A77B60]"
                  }`}
                >
                  직접 신고
                </button>
                <button
                  type="button"
                  disabled={busyKey !== null}
                  aria-pressed={taxCase.filingMethod === "professional"}
                  onClick={() => void selectMethod("professional")}
                  className={`min-h-12 border px-3 py-2 text-sm font-bold transition-colors ${
                    taxCase.filingMethod === "professional"
                      ? "border-[#6A442D] bg-[#F7F1EC] text-[#4B2E1F]"
                      : "border-line bg-white text-ink-muted hover:border-[#A77B60]"
                  }`}
                >
                  전문가와 진행
                </button>
              </div>
              {taxCase.filingMethod === "undecided" ? (
                <p className="mt-3 text-sm font-semibold text-[#8A4F2B]">
                  진단 결과: {taxCase.recommendation === "self"
                    ? "자료가 단순하면 직접 신고를 시도할 수 있어요."
                    : taxCase.recommendation === "review"
                      ? "직접 작성 후 제출 전에 한 번 검토받는 편이 좋아요."
                      : "거래 구조가 복잡해 전문가와 진행하는 편이 안전해요."}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-2 py-6 sm:px-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6A442D] text-sm font-black text-white">
              2
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-ink">내게 필요한 자료</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                처음 답변한 거래 유형을 기준으로 꼭 확인할 자료만 골랐습니다.
              </p>
              <div className="mt-4 divide-y divide-line">
                {taxCase.documents.map((document) => {
                  const checked = document.status === "ready";
                  return (
                    <label
                      key={document.key}
                      className="flex cursor-pointer items-start gap-3 py-4 first:pt-0 last:pb-0"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={busyKey !== null}
                        onChange={(event) =>
                          void updateDocument(
                            document.key,
                            event.target.checked,
                          )
                        }
                        className="sr-only"
                      />
                      <span
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                          checked
                            ? "bg-[#27543B] text-white"
                            : "bg-surface-muted text-ink-soft"
                        }`}
                        aria-hidden="true"
                      >
                        {checked ? (
                          <Check size={15} />
                        ) : (
                          <Circle size={15} />
                        )}
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-sm font-bold ${
                            checked
                              ? "text-ink-soft line-through"
                              : "text-ink"
                          }`}
                        >
                          {document.label}
                        </span>
                        <span className="mt-1 block text-sm leading-6 text-ink-muted">
                          {document.description}
                        </span>
                        {!checked ? (
                          <span className="mt-1 block text-xs leading-5 text-[#78533D]">
                            필요한 이유: {document.reason}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="px-2 py-6 sm:px-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6A442D] text-sm font-black text-white">
              3
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-ink">
                {taxCase.filingMethod === "undecided"
                  ? "선택한 방식으로 진행"
                  : taxCase.filingMethod === "professional"
                  ? "전문가에게 자료 전달"
                  : "홈택스에서 신고"}
              </h3>
              {taxCase.filingMethod === "undecided" ? (
                <p className="mt-1 text-sm leading-6 text-ink-muted">
                  1번에서 신고 방식을 선택하면 필요한 다음 단계만 보여드려요.
                </p>
              ) : taxCase.filingMethod === "professional" ? (
                <>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">
                    준비한 자료와 진단 결과를 바탕으로 상담을 요청하세요.
                    제출 전 최종 판단은 담당 세무사와 확인합니다.
                  </p>
                  <Link
                    href="/consult"
                    onClick={() => recordExternalAction("consultation_open")}
                    className="btn-primary mt-4 text-sm font-bold"
                  >
                    전문가 검토 요청
                    <ArrowRight size={17} />
                  </Link>
                </>
              ) : (
                <>
                  <ol className="mt-4 grid gap-4 sm:grid-cols-2">
                    {HOMETAX_VAT_STEPS.map((step, index) => (
                      <li key={step.title} className="flex gap-3">
                        <span className="text-sm font-black text-[#6A442D]">
                          {index + 1}.
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-ink">
                            {step.title}
                          </span>
                          <span className="mt-1 block text-sm leading-6 text-ink-muted">
                            {step.description}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <a
                    href={HOMETAX_VAT_URL}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => recordExternalAction("hometax_open")}
                    className="btn-primary mt-5 text-sm font-bold"
                  >
                    홈택스 부가세 신고 열기
                    <ExternalLink size={16} />
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="px-2 py-6 sm:px-4">
          <div className="flex items-start gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#6A442D] text-sm font-black text-white">
              4
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-black text-ink">신고 완료 기록</h3>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                홈택스 제출 또는 전문가 접수가 끝난 뒤 완료 처리하세요.
                설정한 마감 알림도 함께 멈춥니다.
              </p>
              {!allDocumentsReady ? (
                <p className="mt-3 text-xs leading-5 text-[#78533D]">
                  아직 체크하지 않은 자료가 있습니다. 실제 제출이 끝났다면
                  결과와 함께 완료할 수 있습니다.
                </p>
              ) : null}
              <div className="mt-4">
                <TaxCaseCompletionFeedbackForm
                  token={taxCase.token}
                  filingMethod={taxCase.filingMethod}
                  onCompleted={(next) =>
                    onTaxCaseChange(next as VatTaxCaseView)
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {nextDocument && taxCase.filingMethod !== "undecided" ? (
        <div className="mt-4 flex items-start gap-3 bg-[#F7F1EC] px-4 py-4 text-sm">
          <UserRoundCheck
            size={19}
            className="mt-0.5 shrink-0 text-[#6A442D]"
          />
          <p className="leading-6 text-ink">
            <strong>지금 할 일:</strong> {nextDocument.label}부터 준비해
            주세요.
          </p>
        </div>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700">{error}</p>
      ) : null}
    </section>
  );
}
