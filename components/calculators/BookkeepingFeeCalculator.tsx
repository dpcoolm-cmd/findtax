"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalculatorConsultCta } from "@/components/CalculatorConsultCta";
import { CalculatorEstimateNotice } from "@/components/CalculatorEstimateNotice";
import { trackSiteEvent } from "@/lib/site-track";

type BizType = "individual" | "corporate";
type VatType = "general" | "simplified" | "exempt";
type EmployeeCount = "0" | "1-3" | "4-9" | "10+";
type BookkeepingDecision = "self" | "compare" | "outsource";

function calcFee(
  revenueMaw: number,
  bizType: BizType,
  vatType: VatType,
  employees: EmployeeCount,
): { monthlyMin: number; monthlyMax: number; annualMin: number; annualMax: number } {
  let min: number, max: number;

  if (revenueMaw < 5000) { min = 10; max = 15; }
  else if (revenueMaw < 10000) { min = 15; max = 25; }
  else if (revenueMaw < 30000) { min = 25; max = 40; }
  else if (revenueMaw < 50000) { min = 40; max = 60; }
  else { min = 60; max = 100; }

  if (bizType === "corporate") { min = Math.round(min * 1.2); max = Math.round(max * 1.2); }
  if (employees === "4-9")    { min = Math.round(min * 1.1); max = Math.round(max * 1.1); }
  if (employees === "10+")    { min = Math.round(min * 1.2); max = Math.round(max * 1.2); }
  if (vatType === "simplified") { min = Math.round(min * 0.9); max = Math.round(max * 0.9); }

  return { monthlyMin: min, monthlyMax: max, annualMin: min * 12, annualMax: max * 12 };
}

const INDUSTRY_OPTIONS = [
  "제조업", "도소매", "서비스", "음식", "부동산임대", "프리랜서", "기타",
] as const;

const FIELD_BASE = "mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-800 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

function manwonLabel(n: number) {
  return `${n.toLocaleString("ko-KR")}만원`;
}

function getBookkeepingDecision(input: {
  revenueMaw: number;
  monthlyDocs: number;
  currentMonthlyFee: number;
  bizType: BizType;
  vatType: VatType;
  employees: EmployeeCount;
  monthlyMin: number;
  monthlyMax: number;
}) {
  let score = 0;
  const reasons: string[] = [];
  const nextActions: string[] = [];
  const documents = [
    "최근 6~12개월 매출 자료",
    "카드·현금영수증·세금계산서 매입 자료",
    "부가세 신고서 또는 신고 안내문",
    "기존 세무사 계약서·월 기장료 내역",
  ];

  if (input.revenueMaw >= 30000) {
    score += 26;
    reasons.push("연 매출 3억원 이상이면 장부·부가세·종소세가 연결되어 관리 난도가 높습니다.");
  } else if (input.revenueMaw >= 10000) {
    score += 18;
    reasons.push("연 매출 1억원 이상이면 직접 관리보다 월별 장부 체계가 유리할 수 있습니다.");
  } else if (input.revenueMaw < 5000) {
    score -= 10;
    reasons.push("연 매출이 낮고 거래가 단순하면 직접 관리 또는 단건 신고도 검토할 수 있습니다.");
  }

  if (input.bizType === "corporate") {
    score += 26;
    reasons.push("법인은 개인사업자보다 장부·결산·신고 관리가 복잡해 기장 의뢰 필요성이 큽니다.");
    documents.push("법인 통장, 법인카드, 주주·임원 관련 자료");
  }

  if (input.vatType === "general") {
    score += 10;
    reasons.push("일반과세자는 매출·매입세액 공제 자료를 월별로 맞춰야 합니다.");
  } else if (input.vatType === "simplified") {
    score -= 4;
  }

  if (input.employees === "10+") {
    score += 28;
    reasons.push("직원이 10명 이상이면 원천세·4대보험·급여대장 관리가 기장 범위에 들어갑니다.");
    documents.push("급여대장, 원천세 신고내역, 4대보험 자료");
  } else if (input.employees === "4-9") {
    score += 20;
    reasons.push("직원이 4명 이상이면 인건비와 원천세 관리 리스크가 커집니다.");
    documents.push("급여대장, 원천세 신고내역");
  } else if (input.employees === "1-3") {
    score += 12;
    reasons.push("직원이 있으면 급여·원천세 자료를 정기적으로 맞춰야 합니다.");
    documents.push("급여대장 또는 인건비 지급내역");
  }

  if (input.monthlyDocs >= 80) {
    score += 28;
    reasons.push("월 거래 자료가 80건 이상이면 직접 정리 시간과 누락 위험이 커집니다.");
  } else if (input.monthlyDocs >= 30) {
    score += 18;
    reasons.push("월 거래 자료가 30건 이상이면 월별 기장으로 누락을 줄이는 편이 좋습니다.");
  } else if (input.monthlyDocs <= 10) {
    score -= 8;
  }

  const fairMid = (input.monthlyMin + input.monthlyMax) / 2;
  if (input.currentMonthlyFee > 0) {
    if (input.currentMonthlyFee > input.monthlyMax * 1.25) {
      score += 8;
      reasons.push("현재 기장료가 예상 상단보다 높아 비교견적을 받아볼 만합니다.");
      nextActions.push("현재 기장료에 포함된 업무 범위와 별도 청구 항목을 먼저 확인하세요.");
    } else if (input.currentMonthlyFee < Math.max(5, input.monthlyMin * 0.65)) {
      score += 8;
      reasons.push("현재 기장료가 너무 낮다면 신고 범위나 자료 검토 품질을 확인할 필요가 있습니다.");
    } else if (Math.abs(input.currentMonthlyFee - fairMid) <= fairMid * 0.25) {
      reasons.push("현재 기장료는 예상 범위와 크게 벗어나지 않습니다.");
    }
  }

  const normalizedScore = Math.max(0, Math.min(100, score));
  const decision: BookkeepingDecision =
    normalizedScore >= 62 ? "outsource" : normalizedScore >= 34 ? "compare" : "self";

  if (decision === "outsource") {
    nextActions.push("월 기장 의뢰를 기준으로 상담하고, 부가세·종소세·원천세 포함 범위를 확인하세요.");
    nextActions.push("매월 자료 제출 방식과 누락 자료 확인 프로세스를 정해두세요.");
    return {
      decision,
      score: normalizedScore,
      title: "기장 의뢰가 유리한 구조입니다",
      summary: "거래량, 직원, 사업자 유형을 보면 직접 관리보다 월별 장부 관리의 가치가 큽니다.",
      reasons,
      nextActions,
      documents,
    };
  }

  if (decision === "compare") {
    nextActions.push("현재 세무사 비용과 포함 업무 범위를 비교견적으로 확인하세요.");
    nextActions.push("부가세 신고, 원천세, 종소세 조정료가 별도인지 반드시 물어보세요.");
    return {
      decision,
      score: normalizedScore,
      title: "비교견적과 1회 점검을 권장합니다",
      summary: "직접 관리와 월 기장 사이의 경계 구간입니다. 비용보다 업무 범위 비교가 중요합니다.",
      reasons,
      nextActions,
      documents,
    };
  }

  nextActions.push("월별 매출·매입 자료를 직접 정리하되, 신고 전 단건 검토를 고려하세요.");
  nextActions.push("매출이나 직원, 거래 건수가 늘면 기장 전환 시점을 다시 계산하세요.");
  return {
    decision,
    score: normalizedScore,
    title: "직접 관리 또는 단건 신고도 가능해 보입니다",
    summary: "거래량과 사업 구조가 아직 단순하다면 매월 기장보다 신고 시점 검토가 효율적일 수 있습니다.",
    reasons,
    nextActions,
    documents,
  };
}

export function BookkeepingFeeCalculator() {
  const trackedResultRef = useRef<string | null>(null);
  const [industry, setIndustry] = useState<string>("서비스");
  const [revenueRaw, setRevenueRaw] = useState("");
  const [bizType, setBizType] = useState<BizType>("individual");
  const [vatType, setVatType] = useState<VatType>("general");
  const [employees, setEmployees] = useState<EmployeeCount>("0");
  const [monthlyDocsRaw, setMonthlyDocsRaw] = useState("20");
  const [currentFeeRaw, setCurrentFeeRaw] = useState("");

  const result = useMemo(() => {
    const rev = Number(revenueRaw.replace(/[^0-9]/g, ""));
    if (!rev || rev <= 0) return null;
    return calcFee(rev, bizType, vatType, employees);
  }, [revenueRaw, bizType, vatType, employees]);

  const decision = useMemo(() => {
    const revenueMaw = Number(revenueRaw.replace(/[^0-9]/g, ""));
    if (!result || !revenueMaw) return null;
    return getBookkeepingDecision({
      revenueMaw,
      monthlyDocs: Number(monthlyDocsRaw.replace(/[^0-9]/g, "")) || 0,
      currentMonthlyFee: Number(currentFeeRaw.replace(/[^0-9]/g, "")) || 0,
      bizType,
      vatType,
      employees,
      monthlyMin: result.monthlyMin,
      monthlyMax: result.monthlyMax,
    });
  }, [revenueRaw, result, monthlyDocsRaw, currentFeeRaw, bizType, vatType, employees]);

  const decisionTone =
    decision?.decision === "outsource"
      ? { badge: "기장 의뢰 권장", bg: "bg-[#FFF1F0] border-[#F3C4BE]", text: "text-[#8A241C]", band: "high" as const }
      : decision?.decision === "compare"
        ? { badge: "비교견적 권장", bg: "bg-[#FFF7E8] border-[#F4D7A3]", text: "text-[#7A4A00]", band: "mid" as const }
        : { badge: "직접 관리 가능", bg: "bg-[#EEF7F0] border-[#CFE8D6]", text: "text-[#174F2A]", band: "low" as const };

  const resultSummary =
    result && decision
      ? `기장료 판단: ${decision.title}. 예상 기장료 월 ${manwonLabel(result.monthlyMin)}~${manwonLabel(result.monthlyMax)}, 난이도 점수 ${decision.score}/100. 주요 사유: ${decision.reasons.join(" / ")}`
      : null;

  useEffect(() => {
    if (!result || !decision) return;
    const trackingKey = `${decision.decision}:${decision.score}:${revenueRaw}:${monthlyDocsRaw}:${currentFeeRaw}:${bizType}:${vatType}:${employees}`;
    if (trackedResultRef.current === trackingKey) return;
    trackedResultRef.current = trackingKey;

    trackSiteEvent("calculator_result_view", {
      calculatorType: "bookkeeping_decision",
      resultBand: decisionTone.band,
      decision: decision.decision,
      score: decision.score,
      monthlyMin: result.monthlyMin,
      monthlyMax: result.monthlyMax,
      revenueManwon: revenueRaw,
      monthlyDocs: monthlyDocsRaw,
    });
  }, [
    bizType,
    currentFeeRaw,
    decision,
    decisionTone.band,
    employees,
    monthlyDocsRaw,
    result,
    revenueRaw,
    vatType,
  ]);

  return (
    <div className="rounded-xl bg-white p-4 shadow-md sm:p-6">
      {/* Inputs */}
      <div className="space-y-4">
        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-neutral-800">업종 선택</label>
          <select className={FIELD_BASE} value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRY_OPTIONS.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* Revenue */}
        <div>
          <label className="block text-sm font-medium text-neutral-800">
            연 매출액 <span className="text-neutral-400">(만원)</span>
          </label>
          <input
            inputMode="numeric"
            className={FIELD_BASE}
            value={revenueRaw}
            onChange={(e) => setRevenueRaw(e.target.value)}
            placeholder="예: 8000 (8천만원)"
          />
        </div>

        {/* Biz type */}
        <div>
          <span className="block text-sm font-medium text-neutral-800">사업자 유형</span>
          <div className="mt-1.5 flex gap-2">
            {(
              [["individual", "개인사업자"], ["corporate", "법인사업자"]] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setBizType(v)}
                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition ${
                  bizType === v
                    ? "border-brand bg-brand text-ink"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand/40"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* VAT type */}
        <div>
          <label className="block text-sm font-medium text-neutral-800">부가세 신고 유형</label>
          <select className={FIELD_BASE} value={vatType} onChange={(e) => setVatType(e.target.value as VatType)}>
            <option value="general">일반과세자</option>
            <option value="simplified">간이과세자</option>
            <option value="exempt">면세사업자</option>
          </select>
        </div>

        {/* Employees */}
        <div>
          <span className="block text-sm font-medium text-neutral-800">직원 수</span>
          <div className="mt-1.5 grid grid-cols-4 gap-2">
            {(
              [["0", "0명"], ["1-3", "1~3명"], ["4-9", "4~9명"], ["10+", "10명 이상"]] as const
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setEmployees(v)}
                className={`rounded-xl border py-2.5 text-sm font-medium transition ${
                  employees === v
                    ? "border-brand bg-brand text-ink"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-brand/40"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              월 거래자료 수 <span className="text-neutral-400">(건)</span>
            </label>
            <input
              inputMode="numeric"
              className={FIELD_BASE}
              value={monthlyDocsRaw}
              onChange={(e) => setMonthlyDocsRaw(e.target.value)}
              placeholder="예: 30"
            />
            <p className="mt-1 text-xs text-neutral-500">세금계산서, 카드, 현금영수증, 플랫폼 정산 건수를 합산</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-800">
              현재 월 기장료 <span className="text-neutral-400">(만원, 선택)</span>
            </label>
            <input
              inputMode="numeric"
              className={FIELD_BASE}
              value={currentFeeRaw}
              onChange={(e) => setCurrentFeeRaw(e.target.value)}
              placeholder="예: 20"
            />
            <p className="mt-1 text-xs text-neutral-500">이미 세무사를 쓰고 있다면 비교 판단에 반영</p>
          </div>
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="mt-6 space-y-4">
          {/* Main result */}
          <div className="rounded-xl border border-brand/20 bg-brand/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand/70">예상 기장료 범위</p>
            <p className="mt-2 text-3xl font-bold text-brand">
              월 {result.monthlyMin}~{result.monthlyMax}만원
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              연간 총액 약{" "}
              <span className="font-semibold text-neutral-800">
                {result.annualMin}~{result.annualMax}만원
              </span>
            </p>
          </div>

          {decision ? (
            <div className={`rounded-xl border p-5 ${decisionTone.bg}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold ${decisionTone.text}`}>
                    {decisionTone.badge}
                  </p>
                  <h3 className="mt-4 text-xl font-bold text-neutral-950">{decision.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-700">{decision.summary}</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3 text-right">
                  <p className="text-xs font-bold text-neutral-500">관리 난이도</p>
                  <p className="mt-1 text-2xl font-black text-neutral-950">{decision.score}/100</p>
                </div>
              </div>
              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <p className="text-sm font-bold text-neutral-950">판단 사유</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-neutral-700">
                    {decision.reasons.slice(0, 4).map((reason) => (
                      <li key={reason}>- {reason}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-950">다음 행동</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6 text-neutral-700">
                    {decision.nextActions.map((action) => (
                      <li key={action}>- {action}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-5 rounded-xl border border-white/80 bg-white/70 p-4">
                <p className="text-sm font-bold text-neutral-950">견적 비교 전 준비자료</p>
                <div className="mt-3 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
                  {decision.documents.map((document) => (
                    <p key={document}>- {document}</p>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {/* Detail breakdown */}
          <dl className="space-y-2 rounded-xl bg-neutral-50 p-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-neutral-500">업종</dt>
              <dd className="font-medium text-neutral-800">{industry}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">사업자 유형</dt>
              <dd className="font-medium text-neutral-800">
                {bizType === "corporate" ? "법인 (+20% 가산)" : "개인"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">부가세 유형</dt>
              <dd className="font-medium text-neutral-800">
                {vatType === "general" ? "일반과세자" : vatType === "simplified" ? "간이과세자 (−10%)" : "면세사업자"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-neutral-500">직원 수</dt>
              <dd className="font-medium text-neutral-800">
                {employees === "0" ? "없음" : employees === "1-3" ? "1~3명" : employees === "4-9" ? "4~9명 (+10%)" : "10명 이상 (+20%)"}
              </dd>
            </div>
          </dl>

          {/* Judgment */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-900">
              이 규모에서 적정 기장료 범위입니다
            </p>
            <p className="mt-1 text-xs text-amber-700">
              현재 내고 계신 기장료가 이 범위를 크게 벗어난다면,
              시중 기장료보다 높게 내고 계실 수 있습니다.
            </p>
          </div>

          {/* Emotional message */}
          <div className="rounded-xl border border-line bg-surface p-5">
            <p className="text-sm leading-7 text-neutral-700">
              기장료는 단순 비용이 아니라 <span className="font-semibold text-neutral-900">세금 설계 비용</span>입니다.
              같은 매출이라도 세무사에 따라 환급액이 수백만 원 차이 납니다.
            </p>
          </div>

          {/* CTA */}
          <CalculatorConsultCta
            calculatorLabel="기장료 판단"
            defaultSituation="bookkeeping"
            resultSummary={resultSummary}
            disabled={!decision}
            calculatorSlug="bookkeeping_decision"
            resultBand={decisionTone.band}
            titleOverride="내 기장료와 업무 범위가 적정한지 비교해 보세요"
            subtitleOverride="매출·거래건수·직원 수를 기준으로 세무사에게 실제 견적과 포함 업무 범위를 확인할 수 있습니다."
            buttonLabelOverride="기장료 비교 상담 받기"
          />

          <CalculatorEstimateNotice>
            <p>
              업계 평균 기장료 기준 참고치이며, 사무소별·지역별 실제 요금은 다를 수 있습니다.
              신고 건수·장부 복잡도 등에 따라 추가 비용이 발생할 수 있으므로 전문가에게 직접 확인하세요.
            </p>
          </CalculatorEstimateNotice>
        </div>
      ) : (
        <p className="mt-6 text-sm text-neutral-500">연 매출액을 입력하면 예상 기장료가 표시됩니다.</p>
      )}
    </div>
  );
}
