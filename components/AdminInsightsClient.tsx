"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

type Totals = {
  totalPageViews: number;
  totalVisitors: number;
  totalSessions: number;
  totalPhoneClicks: number;
  totalResultViews: number;
  totalSummaryCopies: number;
  totalLinkCopies: number;
  totalCtaClicks: number;
  totalLeadSubmits: number;
  totalSituationViews: number;
};

type TrendItem = {
  day: string;
  pageViews: number;
  visitors: number;
  sessions: number;
  leads: number;
  phoneClicks: number;
};

type TopPage = { path: string; pageViews: number };
type SourceRow = { source: string; pageViews: number };
type DeviceRow = { device: string; pageViews: number };
type PhoneRegionRow = { region: string; phoneClicks: number };

type CalculatorInsight = {
  calculatorType: string;
  resultViews: number;
  summaryCopies: number;
  linkCopies: number;
  ctaClicks: number;
  leadSubmits: number;
};

type SituationInsight = {
  situationId: string;
  pageViews: number;
  calculatorClicks: number;
  expertCheckClicks: number;
  regionClicks: number;
  leadSubmits: number;
};

type BlogInsight = {
  blogSlug: string;
  calculatorClicks: number;
  consultClicks: number;
  totalClicks: number;
  topCalculatorType: string | null;
};

type IndustryInsight = {
  profile: string;
  resultViews: number;
  ctaClicks: number;
  highCount: number;
  midCount: number;
  lowCount: number;
  avgScore: number;
};

type TaxCaseFunnel = {
  cohort: number;
  claimed: number;
  methodSelected: number;
  documentsStarted: number;
  documentsReady: number;
  completed: number;
  direct: {
    selected: number;
    hometaxOpened: number;
    completed: number;
  };
  professional: {
    selected: number;
    consultationOpened: number;
    completed: number;
  };
  byRecommendation: Array<{
    recommendation: "self" | "review" | "tax_accountant";
    cases: number;
    methodSelected: number;
    professionalSelected: number;
    completed: number;
  }>;
  byComplexity: Array<{
    band: "low" | "mid" | "high";
    cases: number;
    completed: number;
  }>;
  byCaseType: Array<{
    caseType: "vat" | "gift" | "solo_business" | "pension" | "seller";
    cases: number;
    claimed: number;
    methodSelected: number;
    completed: number;
  }>;
  feedback: {
    submitted: number;
    actualAmountProvided: number;
    byOutcome: Array<{
      outcome:
        | "filed_self"
        | "filed_professional"
        | "prepared_only"
        | "not_required";
      count: number;
    }>;
    byBlocker: Array<{
      blocker: "none" | "documents" | "hometax" | "rules" | "expert";
      count: number;
    }>;
  };
  trend: Array<{
    day: string;
    created: number;
    hometaxOpened: number;
    consultationOpened: number;
    completed: number;
  }>;
  excludedTestTraffic: number;
};

type InsightsResponse = {
  period?: { days: number; timezone: string };
  totals?: Totals;
  trend?: TrendItem[];
  topPages?: TopPage[];
  sources?: SourceRow[];
  devices?: DeviceRow[];
  phoneRegions?: PhoneRegionRow[];
  calculators?: CalculatorInsight[];
  situations?: SituationInsight[];
  blogs?: BlogInsight[];
  industries?: IndustryInsight[];
  leadOperations?: { submitted: number; assigned: number; contacted: number; completed: number; overdue: number };
  taxCaseFunnel?: TaxCaseFunnel;
};

function labelCalculator(type: string) {
  switch (type) {
    case "transfer_tax":
    case "양도세":
      return "양도세";
    case "inheritance_gift_strategy":
    case "상속증여":
      return "상속·증여";
    case "year_end_tax_optimization":
    case "연말정산":
      return "연금·IRP 절세";
    case "gift_tax":
    case "증여세":
      return "증여세";
    case "comprehensive_income_tax":
    case "comprehensive_income":
    case "income_decision":
    case "종합소득세":
      return "종합소득세";
    case "bookkeeping_fee":
    case "bookkeeping_decision":
      return "기장료";
    case "vat":
    case "vat_decision":
      return "부가세";
    case "side_hustle":
      return "부업";
    default:
      return type;
  }
}

function labelBlogSlug(slug: string) {
  return decodeURIComponent(slug).replace(/-/g, " ");
}

function labelIndustry(profile: string) {
  switch (profile) {
    case "smartstore":
      return "스마트스토어";
    case "purchase_agency":
      return "구매대행";
    case "reverse_export":
      return "역직구";
    case "freelance":
      return "프리랜서";
    case "creator_ads":
      return "애드센스·콘텐츠";
    case "restaurant":
      return "음식점·배달";
    case "rental":
      return "임대사업";
    default:
      return profile;
  }
}

function labelSituation(id: string) {
  switch (id) {
    case "income_tax":
      return "종합소득세·연금";
    case "inheritance":
      return "상속·증여";
    case "bookkeeping":
      return "기장";
    case "corporate_tax":
      return "법인세";
    case "payroll":
      return "급여·원천징수";
    default:
      return id;
  }
}

function labelSource(source: string) {
  switch (source) {
    case "direct":
      return "직접/알 수 없음";
    case "google":
      return "Google";
    case "naver":
      return "Naver";
    case "social":
      return "소셜";
    case "referral":
      return "외부 추천";
    default:
      return source;
  }
}

function labelDevice(device: string) {
  switch (device) {
    case "mobile":
      return "모바일";
    case "desktop":
      return "데스크톱";
    case "tablet":
      return "태블릿";
    default:
      return device;
  }
}

function labelRecommendation(
  recommendation: "self" | "review" | "tax_accountant",
) {
  if (recommendation === "self") return "직접 신고 가능";
  if (recommendation === "review") return "제출 전 검토";
  return "전문가 권장";
}

function labelCompletionOutcome(outcome: string) {
  if (outcome === "filed_self") return "직접 신고";
  if (outcome === "filed_professional") return "전문가 신고";
  if (outcome === "prepared_only") return "준비까지만";
  return "신고 불필요";
}

function labelCompletionBlocker(blocker: string) {
  if (blocker === "documents") return "자료 준비";
  if (blocker === "hometax") return "홈택스";
  if (blocker === "rules") return "세법 판단";
  if (blocker === "expert") return "전문가 연결";
  return "막힘 없음";
}

function ratio(numerator: number, denominator: number) {
  if (!denominator) return "-";
  return `${Math.round((numerator / denominator) * 1000) / 10}%`;
}

function format(n: number | undefined) {
  return (n ?? 0).toLocaleString("ko-KR");
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-950">
        {typeof value === "number" ? format(value) : value}
      </p>
      {hint ? <p className="mt-2 text-xs text-neutral-500">{hint}</p> : null}
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}

function BarList({
  rows,
  getLabel,
  getValue,
}: {
  rows: unknown[];
  getLabel: (row: any) => string;
  getValue: (row: any) => number;
}) {
  const max = Math.max(1, ...rows.map((row) => getValue(row)));
  if (rows.length === 0) return <EmptyState>아직 집계된 데이터가 없습니다.</EmptyState>;

  return (
    <div className="space-y-3">
      {rows.map((row, index) => {
        const value = getValue(row);
        return (
          <div key={`${getLabel(row)}-${index}`} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate font-medium text-neutral-800">{getLabel(row)}</span>
              <span className="shrink-0 text-neutral-500">{format(value)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.max(4, (value / max) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function AdminInsightsClient() {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createBrowserClient();
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) {
      setError("관리자 로그인이 필요합니다.");
      setData(null);
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/insights", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      setError("관리자 권한이 없거나 세션이 만료되었습니다.");
      setData(null);
      setLoading(false);
      return;
    }

    setData((await res.json()) as InsightsResponse);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = data?.totals;
  const trend = useMemo(() => data?.trend ?? [], [data?.trend]);
  const maxDailyPageViews = useMemo(
    () => Math.max(1, ...trend.map((item) => item.pageViews)),
    [trend],
  );
  const latestActiveDays = trend.filter((item) => item.pageViews > 0).slice(-7);
  const taxCaseFunnel = data?.taxCaseFunnel;
  const latestTaxCaseDays = useMemo(
    () =>
      (taxCaseFunnel?.trend ?? [])
        .filter(
          (item) =>
            item.created +
              item.hometaxOpened +
              item.consultationOpened +
              item.completed >
            0,
        )
        .slice(-7),
    [taxCaseFunnel?.trend],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-900">최근 30일 기준</p>
          <p className="mt-1 text-sm text-neutral-600">
            방문, 유입, 페이지, 전화 클릭, 상담 전환을 같은 기준으로 봅니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          새로고침
        </button>
      </div>

      {error ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-900">
          {error}
        </div>
      ) : null}

      {loading ? (
        <EmptyState>인사이트를 불러오는 중입니다.</EmptyState>
      ) : null}

      {totals ? (
        <>
          {taxCaseFunnel ? (
            <section className="border-y border-line py-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-[#6A442D]">
                    최근 30일 생성 케이스
                  </p>
                  <h2 className="mt-1 text-xl font-black text-ink">
                    세금 케이스 행동 도달률
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    반복 클릭이 아닌 고유 케이스의 현재 상태를 집계합니다.
                  </p>
                </div>
                <p className="text-xs text-ink-soft">
                  테스트 제외 {format(taxCaseFunnel.excludedTestTraffic)}건
                </p>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px bg-line sm:grid-cols-3 xl:grid-cols-6">
                {[
                  ["케이스 생성", taxCaseFunnel.cohort, "분모"],
                  [
                    "계정 저장",
                    taxCaseFunnel.claimed,
                    ratio(taxCaseFunnel.claimed, taxCaseFunnel.cohort),
                  ],
                  [
                    "방식 선택",
                    taxCaseFunnel.methodSelected,
                    ratio(
                      taxCaseFunnel.methodSelected,
                      taxCaseFunnel.cohort,
                    ),
                  ],
                  [
                    "자료 시작",
                    taxCaseFunnel.documentsStarted,
                    ratio(
                      taxCaseFunnel.documentsStarted,
                      taxCaseFunnel.cohort,
                    ),
                  ],
                  [
                    "자료 준비",
                    taxCaseFunnel.documentsReady,
                    ratio(
                      taxCaseFunnel.documentsReady,
                      taxCaseFunnel.cohort,
                    ),
                  ],
                  [
                    "신고 완료",
                    taxCaseFunnel.completed,
                    ratio(taxCaseFunnel.completed, taxCaseFunnel.cohort),
                  ],
                ].map(([label, value, hint]) => (
                  <div key={label} className="bg-bg px-4 py-4">
                    <p className="text-xs font-semibold text-ink-muted">
                      {label}
                    </p>
                    <p className="mt-1 text-2xl font-black text-ink">
                      {format(value as number)}
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">{hint}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {taxCaseFunnel.byCaseType.map((item) => (
                  <div key={item.caseType} className="border-t border-line pt-3">
                    <p className="text-sm font-black text-ink">
                      {item.caseType === "gift"
                        ? "증여세"
                        : item.caseType === "solo_business"
                          ? "1인사업자"
                          : item.caseType === "pension"
                            ? "연금·IRP"
                            : item.caseType === "seller"
                              ? "온라인·글로벌 셀러"
                              : "부가세"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-ink-muted">
                      생성 {format(item.cases)} · 저장 {format(item.claimed)} ·
                      방식 선택 {format(item.methodSelected)} · 완료{" "}
                      {format(item.completed)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-line pt-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h3 className="font-black text-ink">완료 피드백</h3>
                    <p className="mt-1 text-xs text-ink-muted">
                      실제 신고 결과와 사용자가 막힌 지점을 집계합니다.
                    </p>
                  </div>
                  <p className="text-xs text-ink-soft">
                    제출 {format(taxCaseFunnel.feedback.submitted)}건 · 실제 세액 입력{" "}
                    {format(taxCaseFunnel.feedback.actualAmountProvided)}건
                  </p>
                </div>
                <div className="mt-3 grid gap-px bg-line sm:grid-cols-4">
                  {taxCaseFunnel.feedback.byOutcome.map((item) => (
                    <div key={item.outcome} className="bg-white px-3 py-3">
                      <p className="text-xs text-ink-muted">
                        {labelCompletionOutcome(item.outcome)}
                      </p>
                      <p className="mt-1 text-lg font-black text-ink">
                        {format(item.count)}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted">
                  {taxCaseFunnel.feedback.byBlocker.map((item) => (
                    <span key={item.blocker}>
                      {labelCompletionBlocker(item.blocker)}{" "}
                      <strong className="text-ink">{format(item.count)}</strong>
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="border-t-4 border-[#6A442D] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-ink">직접 신고 경로</h3>
                    <span className="text-sm text-ink-muted">
                      선택 {format(taxCaseFunnel.direct.selected)}건
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-px bg-line">
                    {[
                      ["선택", taxCaseFunnel.direct.selected],
                      ["홈택스 이동", taxCaseFunnel.direct.hometaxOpened],
                      ["완료", taxCaseFunnel.direct.completed],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white px-3 py-3">
                        <p className="text-xs text-ink-muted">{label}</p>
                        <p className="mt-1 text-xl font-bold text-ink">
                          {format(value as number)}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {ratio(
                            value as number,
                            taxCaseFunnel.direct.selected,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t-4 border-[#27543B] pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-ink">전문가 진행 경로</h3>
                    <span className="text-sm text-ink-muted">
                      선택 {format(taxCaseFunnel.professional.selected)}건
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-px bg-line">
                    {[
                      ["선택", taxCaseFunnel.professional.selected],
                      [
                        "상담 이동",
                        taxCaseFunnel.professional.consultationOpened,
                      ],
                      ["완료", taxCaseFunnel.professional.completed],
                    ].map(([label, value]) => (
                      <div key={label} className="bg-white px-3 py-3">
                        <p className="text-xs text-ink-muted">{label}</p>
                        <p className="mt-1 text-xl font-bold text-ink">
                          {format(value as number)}
                        </p>
                        <p className="mt-1 text-xs text-ink-soft">
                          {ratio(
                            value as number,
                            taxCaseFunnel.professional.selected,
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-ink-muted">
                    <tr className="border-b border-line">
                      <th className="px-2 py-3 font-semibold">진단 결과</th>
                      <th className="px-2 py-3 font-semibold">케이스</th>
                      <th className="px-2 py-3 font-semibold">방식 선택</th>
                      <th className="px-2 py-3 font-semibold">전문가 선택</th>
                      <th className="px-2 py-3 font-semibold">완료</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxCaseFunnel.byRecommendation.map((item) => (
                      <tr
                        key={item.recommendation}
                        className="border-b border-line/70"
                      >
                        <td className="px-2 py-3 font-bold text-ink">
                          {labelRecommendation(item.recommendation)}
                        </td>
                        <td className="px-2 py-3 text-ink-muted">
                          {format(item.cases)}
                        </td>
                        <td className="px-2 py-3 text-ink-muted">
                          {format(item.methodSelected)}{" "}
                          <span className="text-xs text-ink-soft">
                            {ratio(item.methodSelected, item.cases)}
                          </span>
                        </td>
                        <td className="px-2 py-3 text-ink-muted">
                          {format(item.professionalSelected)}
                        </td>
                        <td className="px-2 py-3 text-ink-muted">
                          {format(item.completed)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-px bg-line">
                {taxCaseFunnel.byComplexity.map((item) => (
                  <div key={item.band} className="bg-bg px-3 py-3">
                    <p className="text-xs font-semibold text-ink-muted">
                      {item.band === "low"
                        ? "낮은 복잡도"
                        : item.band === "mid"
                          ? "중간 복잡도"
                          : "높은 복잡도"}
                    </p>
                    <p className="mt-1 text-lg font-black text-ink">
                      {format(item.cases)}건
                    </p>
                    <p className="mt-1 text-xs text-ink-soft">
                      완료 {format(item.completed)} ·{" "}
                      {ratio(item.completed, item.cases)}
                    </p>
                  </div>
                ))}
              </div>

              {latestTaxCaseDays.length > 0 ? (
                <div className="mt-6">
                  <h3 className="text-sm font-black text-ink">
                    최근 활동 7일
                  </h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="text-left text-ink-muted">
                        <tr className="border-b border-line">
                          <th className="px-2 py-2 font-semibold">일자</th>
                          <th className="px-2 py-2 font-semibold">생성</th>
                          <th className="px-2 py-2 font-semibold">홈택스</th>
                          <th className="px-2 py-2 font-semibold">상담</th>
                          <th className="px-2 py-2 font-semibold">완료</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestTaxCaseDays.map((item) => (
                          <tr key={item.day} className="border-b border-line/70">
                            <td className="px-2 py-2 font-semibold text-ink">
                              {item.day}
                            </td>
                            <td className="px-2 py-2 text-ink-muted">
                              {format(item.created)}
                            </td>
                            <td className="px-2 py-2 text-ink-muted">
                              {format(item.hometaxOpened)}
                            </td>
                            <td className="px-2 py-2 text-ink-muted">
                              {format(item.consultationOpened)}
                            </td>
                            <td className="px-2 py-2 text-ink-muted">
                              {format(item.completed)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {data?.leadOperations ? (
            <section className="border-y border-line py-5">
              <div className="flex items-end justify-between gap-3">
                <div><h2 className="text-lg font-semibold text-ink">실제 상담 처리 퍼널</h2><p className="mt-1 text-sm text-ink-muted">최근 30일 DB 상태 기준</p></div>
                <p className={`text-sm font-bold ${data.leadOperations.overdue ? "text-red-700" : "text-positive-deep"}`}>지연 {format(data.leadOperations.overdue)}건</p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-px bg-line sm:grid-cols-4">
                {[["접수", data.leadOperations.submitted], ["배정", data.leadOperations.assigned], ["연락", data.leadOperations.contacted], ["완료", data.leadOperations.completed]].map(([label, value], index) => (
                  <div key={label} className="bg-bg px-4 py-4"><p className="text-xs font-semibold text-ink-muted">{index + 1}. {label}</p><p className="mt-1 text-2xl font-bold text-ink">{format(value as number)}</p>{index > 0 ? <p className="mt-1 text-xs text-ink-muted">접수 대비 {ratio(value as number, data.leadOperations!.submitted)}</p> : null}</div>
                ))}
              </div>
            </section>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="페이지뷰" value={totals.totalPageViews} hint="관리자 페이지 제외" />
            <StatCard label="방문자" value={totals.totalVisitors} hint="브라우저 기준 추정" />
            <StatCard label="세션" value={totals.totalSessions} hint="탭 세션 기준 추정" />
            <StatCard
              label="상담 전환율"
              value={ratio(totals.totalLeadSubmits, totals.totalPageViews)}
              hint={`${format(totals.totalLeadSubmits)}건 제출`}
            />
            <StatCard label="전화 클릭" value={totals.totalPhoneClicks} />
            <StatCard label="계산 결과 조회" value={totals.totalResultViews} />
            <StatCard label="계산기 CTA 클릭" value={totals.totalCtaClicks} />
            <StatCard label="상황 페이지 조회" value={totals.totalSituationViews} />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-950">방문자수 트렌드</h2>
                <p className="text-sm text-neutral-600">일별 페이지뷰와 행동 이벤트를 함께 봅니다.</p>
              </div>
              <p className="text-xs text-neutral-500">KST 기준</p>
            </div>

            {trend.some((item) => item.pageViews > 0) ? (
              <div className="mt-5 grid h-44 grid-cols-[repeat(30,minmax(0,1fr))] items-end gap-1">
                {trend.map((item) => (
                  <div key={item.day} className="flex h-full flex-col justify-end gap-1">
                    <div
                      title={`${item.day}: ${format(item.pageViews)} PV`}
                      className="min-h-1 rounded-t bg-brand"
                      style={{ height: `${Math.max(3, (item.pageViews / maxDailyPageViews) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5">
                <EmptyState>오늘 이후부터 자체 페이지뷰가 쌓이기 시작합니다.</EmptyState>
              </div>
            )}

            {latestActiveDays.length > 0 ? (
              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-neutral-500">
                    <tr className="border-b border-neutral-200">
                      <th className="px-2 py-3 font-medium">일자</th>
                      <th className="px-2 py-3 font-medium">PV</th>
                      <th className="px-2 py-3 font-medium">방문자</th>
                      <th className="px-2 py-3 font-medium">전화</th>
                      <th className="px-2 py-3 font-medium">상담</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestActiveDays.map((item) => (
                      <tr key={item.day} className="border-b border-neutral-100">
                        <td className="px-2 py-3 font-medium text-neutral-900">{item.day}</td>
                        <td className="px-2 py-3 text-neutral-700">{format(item.pageViews)}</td>
                        <td className="px-2 py-3 text-neutral-700">{format(item.visitors)}</td>
                        <td className="px-2 py-3 text-neutral-700">{format(item.phoneClicks)}</td>
                        <td className="px-2 py-3 text-neutral-700">{format(item.leads)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">상위 사용 페이지</h2>
              <div className="mt-4">
                <BarList
                  rows={data?.topPages ?? []}
                  getLabel={(row: TopPage) => row.path}
                  getValue={(row: TopPage) => row.pageViews}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">유입원</h2>
              <div className="mt-4">
                <BarList
                  rows={data?.sources ?? []}
                  getLabel={(row: SourceRow) => labelSource(row.source)}
                  getValue={(row: SourceRow) => row.pageViews}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">방문 기기</h2>
              <div className="mt-4">
                <BarList
                  rows={data?.devices ?? []}
                  getLabel={(row: DeviceRow) => labelDevice(row.device)}
                  getValue={(row: DeviceRow) => row.pageViews}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">전화 클릭 지역</h2>
              <div className="mt-4">
                <BarList
                  rows={data?.phoneRegions ?? []}
                  getLabel={(row: PhoneRegionRow) => row.region}
                  getValue={(row: PhoneRegionRow) => row.phoneClicks}
                />
              </div>
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">업종별 세금 진단</h2>
              <p className="mt-1 text-sm text-neutral-600">
                업종 진단 결과 조회와 다음 계산기 이동을 봅니다.
              </p>
              <div className="mt-4 overflow-x-auto">
                {(data?.industries ?? []).length === 0 ? (
                  <EmptyState>업종별 진단 이벤트가 아직 없습니다.</EmptyState>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-neutral-500">
                      <tr className="border-b border-neutral-200">
                        <th className="px-2 py-3 font-medium">업종</th>
                        <th className="px-2 py-3 font-medium">결과</th>
                        <th className="px-2 py-3 font-medium">계산기 이동</th>
                        <th className="px-2 py-3 font-medium">이동률</th>
                        <th className="px-2 py-3 font-medium">평균점수</th>
                        <th className="px-2 py-3 font-medium">고위험</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.industries ?? []).map((item) => (
                        <tr key={item.profile} className="border-b border-neutral-100">
                          <td className="px-2 py-3 font-medium text-neutral-900">
                            {labelIndustry(item.profile)}
                          </td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.resultViews)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.ctaClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{ratio(item.ctaClicks, item.resultViews)}</td>
                          <td className="px-2 py-3 text-neutral-700">{item.avgScore.toFixed(1)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.highCount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">계산기별 전환 흐름</h2>
              <div className="mt-4 overflow-x-auto">
                {(data?.calculators ?? []).length === 0 ? (
                  <EmptyState>계산기 이벤트가 아직 없습니다.</EmptyState>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-neutral-500">
                      <tr className="border-b border-neutral-200">
                        <th className="px-2 py-3 font-medium">계산기</th>
                        <th className="px-2 py-3 font-medium">결과</th>
                        <th className="px-2 py-3 font-medium">복사</th>
                        <th className="px-2 py-3 font-medium">CTA</th>
                        <th className="px-2 py-3 font-medium">상담</th>
                        <th className="px-2 py-3 font-medium">CTA율</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.calculators ?? []).map((item) => (
                        <tr key={item.calculatorType} className="border-b border-neutral-100">
                          <td className="px-2 py-3 font-medium text-neutral-900">
                            {labelCalculator(item.calculatorType)}
                          </td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.resultViews)}</td>
                          <td className="px-2 py-3 text-neutral-700">
                            {format(item.summaryCopies + item.linkCopies)}
                          </td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.ctaClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.leadSubmits)}</td>
                          <td className="px-2 py-3 text-neutral-700">
                            {ratio(item.ctaClicks, item.resultViews)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">블로그 CTA 전환</h2>
              <p className="mt-1 text-sm text-neutral-600">
                글에서 계산기·상담으로 넘어간 클릭을 봅니다.
              </p>
              <div className="mt-4 overflow-x-auto">
                {(data?.blogs ?? []).length === 0 ? (
                  <EmptyState>블로그 CTA 이벤트가 아직 없습니다.</EmptyState>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-neutral-500">
                      <tr className="border-b border-neutral-200">
                        <th className="px-2 py-3 font-medium">블로그 글</th>
                        <th className="px-2 py-3 font-medium">연결 계산기</th>
                        <th className="px-2 py-3 font-medium">계산기</th>
                        <th className="px-2 py-3 font-medium">상담</th>
                        <th className="px-2 py-3 font-medium">합계</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.blogs ?? []).map((item) => (
                        <tr key={item.blogSlug} className="border-b border-neutral-100">
                          <td className="max-w-[260px] px-2 py-3 font-medium text-neutral-900">
                            <span className="line-clamp-2">{labelBlogSlug(item.blogSlug)}</span>
                          </td>
                          <td className="px-2 py-3 text-neutral-700">
                            {item.topCalculatorType ? labelCalculator(item.topCalculatorType) : "-"}
                          </td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.calculatorClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.consultClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.totalClicks)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-950">상황 페이지 행동</h2>
              <div className="mt-4 overflow-x-auto">
                {(data?.situations ?? []).length === 0 ? (
                  <EmptyState>상황 페이지 이벤트가 아직 없습니다.</EmptyState>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-neutral-500">
                      <tr className="border-b border-neutral-200">
                        <th className="px-2 py-3 font-medium">상황</th>
                        <th className="px-2 py-3 font-medium">조회</th>
                        <th className="px-2 py-3 font-medium">계산기</th>
                        <th className="px-2 py-3 font-medium">전문가</th>
                        <th className="px-2 py-3 font-medium">지역</th>
                        <th className="px-2 py-3 font-medium">상담</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.situations ?? []).map((item) => (
                        <tr key={item.situationId} className="border-b border-neutral-100">
                          <td className="px-2 py-3 font-medium text-neutral-900">
                            {labelSituation(item.situationId)}
                          </td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.pageViews)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.calculatorClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.expertCheckClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.regionClicks)}</td>
                          <td className="px-2 py-3 text-neutral-700">{format(item.leadSubmits)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          </div>
        </>
      ) : null}
    </div>
  );
}
