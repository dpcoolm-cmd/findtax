"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, ShieldCheck } from "lucide-react";
import type { GiftRecipientRelation } from "@/lib/calculators/gift-tax";
import {
  assessGiftCase,
  type GiftAssetType,
  type GiftCaseInput,
} from "@/lib/tax-cases/gift-case";

function won(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function today(): string {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-line bg-white px-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#6A442D]"
      />
      <span className="text-sm font-bold text-ink">{label}</span>
    </label>
  );
}

export function GiftTaxCaseStart({
  giftValueWon,
  relation,
  isGenerationSkipping,
  isResident,
}: {
  giftValueWon: number;
  relation: GiftRecipientRelation;
  isGenerationSkipping: boolean;
  isResident: boolean;
}) {
  const router = useRouter();
  const [priorTenYearGiftsManwon, setPriorTenYearGiftsManwon] = useState("0");
  const [giftDate, setGiftDate] = useState(today);
  const [assetType, setAssetType] = useState<GiftAssetType>("cash");
  const [recipientIsMinor, setRecipientIsMinor] = useState(false);
  const [knowsPriorGifts, setKnowsPriorGifts] = useState(true);
  const [hasTransferEvidence, setHasTransferEvidence] = useState(false);
  const [hasRelationshipDocument, setHasRelationshipDocument] = useState(false);
  const [hasValuationEvidence, setHasValuationEvidence] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  const input = useMemo<GiftCaseInput>(
    () => ({
      giftValueWon,
      priorTenYearGiftsWon:
        Math.max(0, Number(priorTenYearGiftsManwon.replace(/,/g, "")) || 0) *
        10_000,
      relation,
      recipientIsMinor,
      giftDate,
      assetType,
      isGenerationSkipping,
      isResident,
      knowsPriorGifts,
      hasTransferEvidence,
      hasRelationshipDocument,
      hasValuationEvidence,
    }),
    [
      assetType,
      giftDate,
      giftValueWon,
      hasRelationshipDocument,
      hasTransferEvidence,
      hasValuationEvidence,
      isGenerationSkipping,
      isResident,
      knowsPriorGifts,
      priorTenYearGiftsManwon,
      recipientIsMinor,
      relation,
    ],
  );
  const assessment = useMemo(() => assessGiftCase(input), [input]);

  const createCase = async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      const response = await fetch("/api/tax-cases/gift", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDedupeKey: crypto.randomUUID(),
          sourcePath: window.location.pathname,
          input,
        }),
      });
      const body = (await response.json()) as { token?: string };
      if (!response.ok || !body.token) {
        setState("error");
        return;
      }
      router.push(`/case/${body.token}`);
    } catch {
      setState("error");
    }
  };

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-line bg-white">
      <div className="border-b border-line bg-[#F5F1EA] p-5 sm:p-6">
        <p className="text-sm font-bold text-[#6A442D]">10년 증여 한도 트래커</p>
        <h2 className="mt-2 text-2xl font-black text-ink">
          계산 결과를 실제 증여 준비표로 바꾸세요.
        </h2>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          과거 10년 증여를 합산하고, 신고기한과 필요한 서류를 한 화면에서 관리합니다.
        </p>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-ink">
              같은 증여자의 과거 10년 증여액
              <div className="mt-2 flex min-h-12 items-center rounded-lg border border-line px-3">
                <input
                  inputMode="numeric"
                  value={priorTenYearGiftsManwon}
                  onChange={(event) =>
                    setPriorTenYearGiftsManwon(
                      event.target.value.replace(/[^\d,]/g, ""),
                    )
                  }
                  className="min-w-0 flex-1 outline-none"
                />
                <span className="text-sm text-ink-muted">만원</span>
              </div>
            </label>
            <label className="text-sm font-bold text-ink">
              증여일
              <input
                type="date"
                value={giftDate}
                onChange={(event) => setGiftDate(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-lg border border-line px-3"
              />
            </label>
            <label className="text-sm font-bold text-ink">
              증여재산
              <select
                value={assetType}
                onChange={(event) =>
                  setAssetType(event.target.value as GiftAssetType)
                }
                className="mt-2 min-h-12 w-full rounded-lg border border-line px-3"
              >
                <option value="cash">현금</option>
                <option value="securities">주식·금융자산</option>
                <option value="real_estate">부동산</option>
                <option value="business_interest">사업체·비상장 지분</option>
                <option value="other">기타 재산</option>
              </select>
            </label>
            {relation === "lineal_descendant" ? (
              <Check
                checked={recipientIsMinor}
                onChange={setRecipientIsMinor}
                label="수증자가 미성년자예요"
              />
            ) : (
              <div />
            )}
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <Check
              checked={knowsPriorGifts}
              onChange={setKnowsPriorGifts}
              label="과거 10년 증여 내역을 확인했어요"
            />
            <Check
              checked={hasTransferEvidence}
              onChange={setHasTransferEvidence}
              label="이체·증여 증빙이 있어요"
            />
            <Check
              checked={hasRelationshipDocument}
              onChange={setHasRelationshipDocument}
              label="가족관계 서류가 있어요"
            />
            {assetType !== "cash" ? (
              <Check
                checked={hasValuationEvidence}
                onChange={setHasValuationEvidence}
                label="재산 평가 근거가 있어요"
              />
            ) : null}
          </div>
        </div>

        <aside className="rounded-lg bg-primary p-5 text-white">
          <p className="text-sm font-bold text-white/65">현재 증여 후 남는 공제 한도</p>
          <p className="mt-2 text-3xl font-black">
            {won(assessment.remainingAfterGiftWon)}
          </p>
          <div className="mt-5 space-y-3 border-t border-white/15 pt-4 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-white/60">관계별 10년 한도</span>
              <strong>{won(assessment.deductionLimitWon)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">한도 초과 가능액</span>
              <strong>{won(assessment.amountOverRemainingLimitWon)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-white/60">신고 복잡도</span>
              <strong>{assessment.complexityScore}/100</strong>
            </div>
          </div>
          <div className="mt-5 flex items-start gap-2 rounded-lg bg-white/10 p-3 text-xs leading-5 text-white/75">
            <CalendarDays className="mt-0.5 shrink-0" size={16} />
            기본 신고기한 {assessment.filingDeadline || "증여일 확인 필요"}
          </div>
        </aside>
      </div>

      <div className="flex flex-col gap-4 border-t border-line p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-2 text-xs leading-5 text-ink-muted">
          <ShieldCheck className="mt-0.5 shrink-0" size={16} />
          실제 공제·합산 범위와 재산 평가는 증여자, 수증자, 재산 유형에 따라 달라질 수 있습니다.
        </div>
        <button
          type="button"
          onClick={() => void createCase()}
          disabled={state === "busy" || !giftDate}
          className="btn-primary shrink-0 disabled:opacity-60"
        >
          {state === "busy" ? "준비표 만드는 중..." : "내 증여 준비표 만들기"}
          <ArrowRight size={17} />
        </button>
      </div>
      {state === "error" ? (
        <p className="border-t border-line px-5 py-3 text-sm text-red-700">
          준비표를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.
        </p>
      ) : null}
    </section>
  );
}

