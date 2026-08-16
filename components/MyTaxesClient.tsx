"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LogOut,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { MyTaxCaseSummary } from "@/lib/tax-cases/customer";
import { createBrowserClient } from "@/lib/supabase";
import {
  deadlineBadge,
  deadlineDaysRemaining,
  formatKoreanDate,
} from "@/lib/tax-cases/deadlines";

export function MyTaxesClient({
  email,
  taxCases,
}: {
  email: string;
  taxCases: MyTaxCaseSummary[];
}) {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(), []);
  const [loggingOut, setLoggingOut] = useState(false);
  const [view, setView] = useState<"active" | "completed">("active");
  const caseLabel = (caseType: MyTaxCaseSummary["caseType"]) =>
    caseType === "gift"
      ? "증여세"
      : caseType === "solo_business"
        ? "1인사업자"
        : caseType === "pension"
          ? "연금·IRP"
          : caseType === "seller"
            ? "온라인·글로벌 셀러"
            : "부가세";
  const caseHref = (caseType: MyTaxCaseSummary["caseType"]) =>
    caseType === "gift"
      ? "/calculator/증여세"
      : caseType === "solo_business"
        ? "/calculator/1인사업자"
        : caseType === "pension"
          ? "/calculator/연말정산"
          : caseType === "seller"
            ? "/calculator#industry-diagnosis"
            : "/calculator/부가세";
  const activeCases = taxCases.filter((item) => item.status !== "completed");
  const completedCases = taxCases.filter((item) => item.status === "completed");
  const visibleCases = view === "active" ? activeCases : completedCases;
  const nextDeadlineCase = [...activeCases]
    .filter((item) => item.filingDeadline)
    .sort((a, b) =>
      String(a.filingDeadline).localeCompare(String(b.filingDeadline)),
    )[0];
  const averageReadiness = activeCases.length
    ? Math.round(
        activeCases.reduce((sum, item) => sum + item.readinessScore, 0) /
          activeCases.length,
      )
    : 0;

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="app-shell-frame pb-24 pt-10 md:pb-28">
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#6A442D]">내 세금 운영표</p>
          <h1 className="mt-2 text-3xl font-black text-ink sm:text-4xl">
            이번에 할 세금만 한눈에 확인하세요.
          </h1>
          <p className="mt-3 text-sm text-ink-muted">{email}</p>
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={loggingOut}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-bold text-ink disabled:opacity-60"
        >
          <LogOut size={17} />
          {loggingOut ? "로그아웃 중..." : "로그아웃"}
        </button>
      </header>

      <section className="grid gap-px overflow-hidden border-b border-line bg-line sm:grid-cols-3">
        <div className="bg-bg px-4 py-5 sm:px-6">
          <p className="text-xs font-bold text-ink-muted">진행 중</p>
          <p className="mt-2 text-3xl font-black text-ink">{activeCases.length}건</p>
        </div>
        <div className="bg-bg px-4 py-5 sm:px-6">
          <p className="text-xs font-bold text-ink-muted">평균 준비도</p>
          <p className="mt-2 text-3xl font-black text-ink">{averageReadiness}%</p>
        </div>
        <div className="bg-bg px-4 py-5 sm:px-6">
          <p className="text-xs font-bold text-ink-muted">가장 가까운 일정</p>
          <p className="mt-2 text-lg font-black text-ink">
            {nextDeadlineCase?.filingDeadline ?? "저장된 일정 없음"}
          </p>
          {nextDeadlineCase ? (
            <p className="mt-1 text-xs text-ink-muted">
              {caseLabel(nextDeadlineCase.caseType)}
            </p>
          ) : null}
        </div>
      </section>

      {taxCases.length === 0 ? (
        <section className="py-16 text-center">
          <CheckCircle2 className="mx-auto text-[#6A442D]" size={34} />
          <h2 className="mt-5 text-2xl font-black text-ink">저장한 세금이 아직 없어요.</h2>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            계산 후 준비상태를 저장하면 이곳에서 이어볼 수 있습니다.
          </p>
          <Link href="/calculator" className="btn-primary mt-6">
            세금 계산기 보기
          </Link>
        </section>
      ) : (
        <section className="py-8">
          <div className="flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex w-fit rounded-lg border border-line bg-white p-1">
              <button
                type="button"
                onClick={() => setView("active")}
                className={`min-h-9 rounded-md px-4 text-sm font-bold ${
                  view === "active"
                    ? "bg-[#3B2B22] text-white"
                    : "text-ink-muted"
                }`}
              >
                진행 중 {activeCases.length}
              </button>
              <button
                type="button"
                onClick={() => setView("completed")}
                className={`min-h-9 rounded-md px-4 text-sm font-bold ${
                  view === "completed"
                    ? "bg-[#3B2B22] text-white"
                    : "text-ink-muted"
                }`}
              >
                완료 {completedCases.length}
              </button>
            </div>
            <Link href="/calculator" className="btn-secondary text-sm font-bold">
              <Plus size={16} />
              새 세금 진단
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleCases.map((taxCase) => (
              <Link
                key={taxCase.token}
                href={`/case/${taxCase.token}`}
                className="group rounded-lg border border-line bg-white p-5 transition-colors hover:border-[#9A755C]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#6A442D]">
                      {caseLabel(taxCase.caseType)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-ink">{taxCase.title}</p>
                    <p className="mt-2 text-3xl font-black text-ink">{taxCase.readinessScore}%</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    {taxCase.filingDeadline ? (
                      <span className="rounded-full bg-[#F5F1EA] px-3 py-1 text-xs font-black text-[#6A442D]">
                        {deadlineBadge(deadlineDaysRemaining(taxCase.filingDeadline))}
                      </span>
                    ) : null}
                    <ArrowRight className="text-ink-soft transition-transform group-hover:translate-x-1" size={20} />
                  </div>
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${taxCase.readinessScore}%` }}
                  />
                </div>
                <p className="mt-5 text-xs font-bold text-ink-soft">다음 할 일</p>
                <p className="mt-1 font-bold text-ink">
                  {taxCase.status === "completed"
                    ? "다음 점검 때 다시 진단"
                    : taxCase.nextTask?.label ?? "신고 전 최종 확인"}
                </p>
                {taxCase.filingDeadline ? (
                  <p className="mt-3 text-sm text-ink-muted">
                    {formatKoreanDate(taxCase.filingDeadline)}
                    {taxCase.reminderEnabled ? " · 이메일 알림 켜짐" : ""}
                  </p>
                ) : null}
                {taxCase.status === "completed" &&
                taxCase.nextReviewDate ? (
                  <p className="mt-3 flex items-center gap-2 text-sm font-bold text-[#296B2F]">
                    <CalendarDays size={15} />
                    다음 점검 {formatKoreanDate(taxCase.nextReviewDate)}
                  </p>
                ) : null}
                {taxCase.status === "completed" &&
                taxCase.actualTaxAmountWon !== null ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    실제 기록 {taxCase.actualTaxAmountWon.toLocaleString("ko-KR")}원
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-ink-soft">
                  최근 변경{" "}
                  {new Intl.DateTimeFormat("ko-KR", {
                    timeZone: "Asia/Seoul",
                  }).format(new Date(taxCase.updatedAt))}
                </p>
              </Link>
            ))}
          </div>
          {visibleCases.length === 0 ? (
            <div className="py-14 text-center">
              <RotateCcw className="mx-auto text-[#6A442D]" size={28} />
              <p className="mt-4 font-black text-ink">
                {view === "active"
                  ? "진행 중인 세금이 없습니다."
                  : "완료한 세금이 아직 없습니다."}
              </p>
              <Link href="/calculator" className="btn-primary mt-5">
                새 진단 시작
              </Link>
            </div>
          ) : null}
        </section>
      )}

      <section className="border-t border-line py-8">
        <p className="text-sm font-black text-[#6A442D]">다시 점검하기</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(
            [
              ["solo_business", "1인사업자 운영표"],
              ["seller", "셀러 세금 운영표"],
              ["gift", "증여세 준비표"],
              ["pension", "연금·IRP 플랜"],
            ] as const
          ).map(([caseType, label]) => (
            <Link
              key={caseType}
              href={caseHref(caseType)}
              className="flex min-h-12 items-center justify-between border-b border-line px-1 text-sm font-bold text-ink hover:border-ink"
            >
              {label}
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
