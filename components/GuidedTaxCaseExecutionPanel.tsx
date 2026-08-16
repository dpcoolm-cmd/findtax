"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  UserRoundCheck,
} from "lucide-react";
import type { TaxCaseView } from "@/lib/tax-cases/server";
import type { VatFilingMethod } from "@/lib/tax-cases/vat-filing-execution";
import { trackGoogleEvent } from "@/lib/site-track";
import {
  completionOutcomeLabel,
  TaxCaseCompletionFeedbackForm,
} from "@/components/TaxCaseCompletionFeedbackForm";

const COPY = {
  gift: {
    eyebrow: "증여세 신고 실행",
    title: "준비가 끝나면 신고까지 이어가세요.",
    direct: "직접 신고",
    professional: "전문가와 신고",
    hometax: "홈택스 증여세 신고로 이동",
    complete: "증여세 신고 완료",
    completed: "이번 증여세 신고를 완료했어요.",
    description:
      "10년 합산과 재산 평가가 단순하면 직접 진행하고, 평가·세대생략·해외 조건이 있으면 전문가 검토를 권합니다.",
  },
  solo_business: {
    eyebrow: "1인사업자 실행",
    title: "매달 반복할 세무 루틴을 정하세요.",
    direct: "직접 관리",
    professional: "기장·세무대리",
    hometax: "홈택스 사업자 업무로 이동",
    complete: "현재 세무 세팅 완료",
    completed: "1인사업자 세무 운영표를 완성했어요.",
    description:
      "증빙과 일정이 단순하면 직접 관리하고, 인건비·해외거래·다채널 매출이 있으면 초기 세팅이나 기장을 검토하세요.",
  },
  pension: {
    eyebrow: "연금 절세 실행",
    title: "올해 납입 계획을 확정하세요.",
    direct: "직접 납입 관리",
    professional: "전문가와 검토",
    hometax: "홈택스 연말정산 자료 확인",
    complete: "올해 연금 플랜 완료",
    completed: "올해 연금 납입 점검을 완료했어요.",
    description:
      "비상자금을 먼저 확보하고, 소득자료와 납입확인서가 단순하면 직접 관리하세요. 혼합소득이나 ISA 전환이 있으면 최종 검토를 권합니다.",
  },
  seller: {
    eyebrow: "셀러 세금 실행",
    title: "월 정산부터 신고 준비까지 연결하세요.",
    direct: "직접 관리",
    professional: "전문가와 검토",
    hometax: "홈택스 사업자 신고로 이동",
    complete: "셀러 세금 정리 완료",
    completed: "이번 셀러 세금 점검을 완료했어요.",
    description:
      "플랫폼별 총매출과 정산금, 반품·수수료·해외증빙을 먼저 맞추고 애매한 거래 구조만 검토받으세요.",
  },
} as const;

export function GuidedTaxCaseExecutionPanel({
  taxCase,
  onTaxCaseChange,
}: {
  taxCase: TaxCaseView & {
    caseType: "gift" | "solo_business" | "pension" | "seller";
  };
  onTaxCaseChange: (taxCase: TaxCaseView) => void;
}) {
  const copy = COPY[taxCase.caseType];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const request = async (
    key: string,
    url: string,
    options: RequestInit,
  ) => {
    if (busy) return;
    setBusy(key);
    setError(null);
    try {
      const response = await fetch(url, options);
      const body = (await response.json()) as { taxCase?: TaxCaseView };
      if (!response.ok || !body.taxCase) {
        setError("변경 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      onTaxCaseChange(body.taxCase);
    } catch {
      setError("변경 내용을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(null);
    }
  };

  const selectMethod = (filingMethod: Exclude<VatFilingMethod, "undecided">) => {
    trackGoogleEvent("tax_case_filing_method_selected", {
      caseType: taxCase.caseType,
      filingMethod,
      recommendation: taxCase.recommendation,
    });
    void request("method", `/api/tax-cases/${taxCase.token}/filing-method`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filingMethod }),
    });
  };

  const updateDocument = (key: string, ready: boolean) => {
    void request(
      `document:${key}`,
      `/api/tax-cases/${taxCase.token}/documents/${key}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: ready ? "ready" : "pending" }),
      },
    );
  };

  const recordHomeTax = () => {
    trackGoogleEvent("tax_case_hometax_opened", {
      caseType: taxCase.caseType,
      filingMethod: taxCase.filingMethod,
    });
    void fetch(`/api/tax-cases/${taxCase.token}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "hometax_open" }),
      keepalive: true,
    }).catch(() => undefined);
  };

  if (taxCase.status === "completed") {
    return (
      <section className="mt-8 rounded-lg border border-[#B8D9A5] bg-[#F3FAEE] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 shrink-0 text-[#296B2F]" size={24} />
          <div>
            <p className="text-lg font-black text-ink">{copy.completed}</p>
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {completionOutcomeLabel(taxCase.completionOutcome)}로 기록했습니다.
              {taxCase.actualTaxAmountWon !== null
                ? ` 실제 금액은 ${taxCase.actualTaxAmountWon.toLocaleString("ko-KR")}원입니다.`
                : ""}{" "}
              최종 확인자료는 별도로 보관하세요.
            </p>
            {taxCase.nextReviewDate ? (
              <p className="mt-2 text-xs font-bold text-[#296B2F]">
                다음 점검일 {taxCase.nextReviewDate}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-line bg-white">
      <div className="border-b border-line p-5 sm:p-6">
        <p className="text-sm font-bold text-[#6A442D]">{copy.eyebrow}</p>
        <h2 className="mt-2 text-2xl font-black text-ink">{copy.title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
          {copy.description}
        </p>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        {(
          [
            ["direct", copy.direct, FileCheck2],
            ["professional", copy.professional, UserRoundCheck],
          ] as const
        ).map(([method, label, Icon]) => {
          const selected = taxCase.filingMethod === method;
          return (
            <button
              key={method}
              type="button"
              onClick={() => selectMethod(method)}
              disabled={busy !== null}
              className={`flex min-h-20 items-center gap-3 rounded-lg border p-4 text-left ${
                selected
                  ? "border-[#6A442D] bg-[#F5F1EA]"
                  : "border-line bg-white hover:border-line-strong"
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  selected ? "bg-[#6A442D] text-white" : "bg-surface-muted text-ink"
                }`}
              >
                {selected ? <Check size={18} /> : <Icon size={18} />}
              </span>
              <span>
                <strong className="block text-ink">{label}</strong>
                <span className="mt-1 block text-xs text-ink-muted">
                  {method === "direct"
                    ? "준비자료를 보며 직접 진행"
                    : "자료와 진단 결과를 전문가에게 전달"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {taxCase.filingMethod !== "undecided" ? (
        <div className="border-t border-line p-5 sm:p-6">
          <p className="font-black text-ink">필요 자료</p>
          <div className="mt-3 divide-y divide-line border-y border-line">
            {taxCase.documents.map((document) => (
              <label
                key={document.key}
                className="flex cursor-pointer items-start gap-3 py-4"
              >
                <input
                  type="checkbox"
                  checked={document.status === "ready"}
                  disabled={busy !== null}
                  onChange={(event) =>
                    updateDocument(document.key, event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-[#6A442D]"
                />
                <span>
                  <strong className="text-sm text-ink">{document.label}</strong>
                  <span className="mt-1 block text-xs leading-5 text-ink-muted">
                    {document.description}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            {taxCase.filingMethod === "direct" ? (
              <a
                href="https://hometax.go.kr"
                target="_blank"
                rel="noreferrer"
                onClick={recordHomeTax}
                className="btn-primary"
              >
                {copy.hometax}
                <ExternalLink size={16} />
              </a>
            ) : (
              <Link href="/consult" className="btn-primary">
                전문가 검토 요청
                <ArrowRight size={17} />
              </Link>
            )}
            <TaxCaseCompletionFeedbackForm
              token={taxCase.token}
              filingMethod={taxCase.filingMethod}
              onCompleted={onTaxCaseChange}
              compact
            />
          </div>
        </div>
      ) : (
        <p className="border-t border-line px-5 py-4 text-sm text-ink-muted sm:px-6">
          진행 방식을 선택하면 필요한 자료와 다음 행동만 보여드려요.
        </p>
      )}

      {error ? (
        <p className="border-t border-line px-5 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  );
}
