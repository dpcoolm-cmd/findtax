"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, Check } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createBrowserClient } from "@/lib/supabase";
import { trackSiteEvent } from "@/lib/site-track";
import {
  CURRENT_VAT_FILING_DEADLINE,
  deadlineBadge,
  deadlineDaysRemaining,
  formatKoreanDate,
} from "@/lib/tax-cases/deadlines";
import type { TaxCaseType } from "@/lib/tax-cases/guided-case-definitions";

export function TaxDeadlinePanel({
  token,
  caseType,
  initialPeriodLabel,
  initialDeadline,
  initialReminderEnabled,
}: {
  token: string;
  caseType: TaxCaseType;
  initialPeriodLabel: string | null;
  initialDeadline: string | null;
  initialReminderEnabled: boolean;
}) {
  const supabase = useMemo(() => createBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [owned, setOwned] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [periodLabel, setPeriodLabel] = useState(
    initialPeriodLabel ?? CURRENT_VAT_FILING_DEADLINE.periodLabel,
  );
  const [deadline, setDeadline] = useState(
    initialDeadline ?? CURRENT_VAT_FILING_DEADLINE.deadline,
  );
  const [reminderEnabled, setReminderEnabled] = useState(initialReminderEnabled);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) return;
      const currentUser = data.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { data: cases } = await supabase.rpc("api_list_my_tax_cases_v2");
        if (mounted && Array.isArray(cases)) {
          setOwned(
            cases.some(
              (item) =>
                typeof item === "object" &&
                item !== null &&
                !Array.isArray(item) &&
                item.token === token,
            ),
          );
        }
      }
      if (mounted) setAuthReady(true);
    });

    const handleClaimed = () => setOwned(true);
    window.addEventListener("tax-case-claimed", handleClaimed);
    return () => {
      mounted = false;
      window.removeEventListener("tax-case-claimed", handleClaimed);
    };
  }, [supabase, token]);

  const daysRemaining = deadline ? deadlineDaysRemaining(deadline) : null;
  const isOfficialCurrentDeadline =
    caseType === "vat" &&
    deadline === CURRENT_VAT_FILING_DEADLINE.deadline &&
    periodLabel === CURRENT_VAT_FILING_DEADLINE.periodLabel;
  const isPension = caseType === "pension";

  const useOfficialDeadline = () => {
    setPeriodLabel(CURRENT_VAT_FILING_DEADLINE.periodLabel);
    setDeadline(CURRENT_VAT_FILING_DEADLINE.deadline);
    setState("idle");
  };

  const save = async () => {
    if (!user || !owned || state === "saving") return;
    setState("saving");
    const { data, error } = await supabase.rpc(
      "api_update_tax_case_deadline_v2",
      {
        p_access_token: token,
        p_filing_period_label: periodLabel,
        p_filing_deadline: deadline,
        p_reminder_enabled: reminderEnabled,
        p_reminder_days: [7, 3, 1],
      },
    );
    if (error || !data) {
      setState("error");
      return;
    }
    trackSiteEvent("tax_deadline_saved", {
      caseType,
      reminderEnabled,
      daysRemaining: daysRemaining ?? 0,
    });
    setState("saved");
  };

  return (
    <section className="mt-8 overflow-hidden rounded-lg border border-line bg-white">
      <div className="grid md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
        <div className="bg-[#F5F1EA] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-sm font-bold text-[#6A442D]">
            <CalendarDays size={18} />
            {isPension ? "납입 점검일" : "신고기한"}
          </div>
          <p className="mt-5 text-4xl font-black text-ink">
            {daysRemaining === null ? "날짜 선택" : deadlineBadge(daysRemaining)}
          </p>
          <p className="mt-3 font-bold text-ink">
            {deadline
              ? formatKoreanDate(deadline)
              : isPension
                ? "점검일을 선택하세요"
                : "신고기한을 선택하세요"}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{periodLabel}</p>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#6A442D]">
                {isPension ? "내 납입 일정" : "내 신고 일정"}
              </p>
              <h2 className="mt-2 text-xl font-black text-ink">
                {isPension
                  ? "연말 전에 납입 계획을 점검하세요."
                  : "기한을 확인하고 알림을 선택하세요."}
              </h2>
            </div>
            {caseType === "vat" && !isOfficialCurrentDeadline ? (
              <button
                type="button"
                onClick={useOfficialDeadline}
                className="text-sm font-bold text-[#6A442D] underline underline-offset-4"
              >
                7월 27일 공식 일정 사용
              </button>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                {isPension ? "점검 이름" : "신고 이름"}
              </span>
              <input
                value={periodLabel}
                onChange={(event) => {
                  setPeriodLabel(event.target.value);
                  setState("idle");
                }}
                disabled={!owned}
                maxLength={80}
                className="min-h-12 w-full rounded-lg border border-line px-3 disabled:bg-surface-muted"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-ink">
                {isPension ? "점검일" : "신고기한"}
              </span>
              <input
                type="date"
                value={deadline}
                onChange={(event) => {
                  setDeadline(event.target.value);
                  setState("idle");
                }}
                disabled={!owned}
                className="min-h-12 w-full rounded-lg border border-line px-3 disabled:bg-surface-muted"
              />
            </label>
          </div>

          <label
            className={`mt-5 flex items-start gap-3 rounded-lg border border-line p-4 ${
              owned ? "cursor-pointer" : "opacity-60"
            }`}
          >
            <input
              type="checkbox"
              checked={reminderEnabled}
              disabled={!owned}
              onChange={(event) => {
                setReminderEnabled(event.target.checked);
                setState("idle");
              }}
              className="sr-only"
            />
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${
                reminderEnabled ? "bg-[#6A442D] text-white" : "bg-surface-muted text-ink-soft"
              }`}
              aria-hidden="true"
            >
              {reminderEnabled ? <Check size={16} /> : <Bell size={15} />}
            </span>
            <span>
              <span className="block font-bold text-ink">D-7·D-3·D-1 이메일 알림 받기</span>
              <span className="mt-1 block text-sm leading-6 text-ink-muted">
                알림은 언제든 끌 수 있으며{" "}
                {isPension
                  ? "실제 납입 반영 여부를"
                  : "신고 완료 여부를"}{" "}
                대신 확인하지는 않습니다.
              </span>
            </span>
          </label>

          {!authReady ? (
            <p className="mt-4 text-sm text-ink-muted">계정 상태를 확인하고 있어요.</p>
          ) : !user || !owned ? (
            <p className="mt-4 text-sm leading-6 text-ink-muted">
              위에서 준비상태를 <strong className="text-ink">내 세금에 저장</strong>하면 일정과
              알림을 설정할 수 있습니다.
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void save()}
                disabled={state === "saving" || !deadline || !periodLabel.trim()}
                className="btn-primary disabled:cursor-wait disabled:opacity-60"
              >
                {state === "saving"
                  ? "저장하는 중..."
                  : isPension
                    ? "납입 일정 저장"
                    : "신고 일정 저장"}
              </button>
              {state === "saved" ? (
                <p className="text-sm font-bold text-[#296B2F]">저장됐어요.</p>
              ) : null}
              {state === "error" ? (
                <p className="text-sm text-red-700">저장하지 못했습니다. 다시 시도해 주세요.</p>
              ) : null}
            </div>
          )}

          <p className="mt-5 text-xs leading-5 text-ink-soft">
            {caseType === "vat" ? (
              <>
                2026년 1기 일반 신고기한은{" "}
                <Link
                  href={CURRENT_VAT_FILING_DEADLINE.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-2"
                >
                  국세청 7월 27일 안내
                </Link>
                를 기준으로 합니다. 직권연장·개별연장 대상은 본인 안내문을 우선 확인하세요.
              </>
            ) : isPension ? (
              <>
                12월 20일은 FindTax가 제안하는 사전 점검일이며 법정 신고기한이 아닙니다. 실제 납입 인정 시각은{" "}
                <Link
                  href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7875&mi=6439"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-2"
                >
                  국세청 안내
                </Link>
                와 금융회사 공지를 확인하세요.
              </>
            ) : (
              <>
                표시 날짜는 입력 조건에 따른 기본 일정입니다. 휴일·개별연장·신고유형에 따라 달라질 수 있으므로{" "}
                <Link
                  href="https://www.nts.go.kr"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold underline underline-offset-2"
                >
                  국세청 안내
                </Link>
                와 본인 안내문을 우선 확인하세요.
              </>
            )}
          </p>
        </div>
      </div>
    </section>
  );
}
