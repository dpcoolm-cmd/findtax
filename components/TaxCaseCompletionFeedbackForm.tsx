"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import type {
  TaxCaseCompletionFeedback,
  TaxCaseView,
} from "@/lib/tax-cases/server";
import type { VatFilingMethod } from "@/lib/tax-cases/vat-filing-execution";

const OUTCOMES = [
  ["filed_self", "직접 신고·처리 완료"],
  ["filed_professional", "전문가에게 맡겨 완료"],
  ["prepared_only", "준비만 마치고 다음 단계로 이동"],
  ["not_required", "확인 결과 이번에는 신고 불필요"],
] as const;

const BLOCKERS = [
  ["none", "특별히 막힌 점 없음"],
  ["documents", "필요 서류·증빙"],
  ["hometax", "홈택스 입력·메뉴"],
  ["rules", "세법 기준 판단"],
  ["expert", "전문가 선정·소통"],
] as const;

function parseWon(value: string): number | null {
  const digits = value.replace(/[^0-9]/g, "");
  if (!digits) return null;
  const parsed = Number(digits);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export function completionOutcomeLabel(
  outcome: TaxCaseView["completionOutcome"],
): string {
  return (
    OUTCOMES.find(([value]) => value === outcome)?.[1] ??
    "이번 세금 할 일 완료"
  );
}

export function TaxCaseCompletionFeedbackForm({
  token,
  filingMethod,
  onCompleted,
  compact = false,
}: {
  token: string;
  filingMethod: VatFilingMethod;
  onCompleted: (taxCase: TaxCaseView) => void;
  compact?: boolean;
}) {
  const defaultOutcome =
    filingMethod === "professional" ? "filed_professional" : "filed_self";
  const [open, setOpen] = useState(false);
  const [outcome, setOutcome] =
    useState<TaxCaseCompletionFeedback["outcome"]>(defaultOutcome);
  const [amount, setAmount] = useState("");
  const [blocker, setBlocker] =
    useState<TaxCaseCompletionFeedback["blocker"]>("none");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/tax-cases/${token}/completion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome,
          actualTaxAmountWon: parseWon(amount),
          blocker,
          note: note.trim(),
        }),
      });
      const body = (await response.json()) as { taxCase?: TaxCaseView };
      if (!response.ok || !body.taxCase) {
        setError("완료 결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      onCompleted(body.taxCase);
    } catch {
      setError("완료 결과를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={filingMethod === "undecided"}
        className="btn-secondary text-sm font-bold disabled:cursor-not-allowed disabled:opacity-45"
      >
        <CheckCircle2 size={17} />
        {compact ? "완료 결과 남기기" : "완료하고 실제 결과 남기기"}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-[#CDB7A7] bg-[#F8F3EF] p-4">
      <p className="font-black text-ink">실제 결과를 짧게 남겨주세요.</p>
      <p className="mt-1 text-xs leading-5 text-ink-muted">
        다음 신고 때 예상값과 실제값을 비교하고 더 정확한 안내를 만드는 데 사용합니다.
      </p>

      <fieldset className="mt-4">
        <legend className="text-xs font-bold text-ink-muted">어떻게 마쳤나요?</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {OUTCOMES.map(([value, label]) => (
            <label
              key={value}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm font-bold ${
                outcome === value ? "border-[#6A442D]" : "border-line"
              }`}
            >
              <input
                type="radio"
                name={`completion-outcome-${token}`}
                checked={outcome === value}
                onChange={() => setOutcome(value)}
                className="accent-[#6A442D]"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-ink-muted">
          실제 납부·환급액 (선택)
          <div className="mt-1 flex overflow-hidden rounded-lg border border-line bg-white">
            <input
              inputMode="numeric"
              value={amount}
              onChange={(event) =>
                setAmount(
                  event.target.value
                    .replace(/[^0-9]/g, "")
                    .slice(0, 16)
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ","),
                )
              }
              className="min-w-0 flex-1 px-3 py-2 text-sm outline-none"
              placeholder="모르면 비워두세요"
            />
            <span className="flex items-center border-l border-line px-3 text-sm">
              원
            </span>
          </div>
        </label>
        <label className="text-xs font-bold text-ink-muted">
          가장 막힌 부분
          <select
            value={blocker}
            onChange={(event) =>
              setBlocker(
                event.target.value as TaxCaseCompletionFeedback["blocker"],
              )
            }
            className="mt-1 min-h-10 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink"
          >
            {BLOCKERS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-3 block text-xs font-bold text-ink-muted">
        다음에 기억할 메모 (선택)
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value.slice(0, 300))}
          rows={2}
          className="mt-1 w-full resize-y rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink"
          placeholder="예: 해외 배송증빙을 늦게 찾아서 시간이 걸렸음"
        />
      </label>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void submit()}
          disabled={busy}
          className="btn-primary text-sm font-bold disabled:opacity-60"
        >
          {busy ? "저장 중..." : "완료 결과 저장"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="btn-secondary text-sm font-bold"
        >
          취소
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
