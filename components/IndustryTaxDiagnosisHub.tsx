"use client";

import Link from "next/link";
import { ArrowRight, Check, ClipboardList, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  SellerSettlementCsvAnalyzer,
  type SellerCsvSummary,
} from "@/components/SellerSettlementCsvAnalyzer";
import {
  formatGroupedNumericInput,
  formatKoreanMoneyFromManwonInput,
  parseNonNegativeManwonString,
} from "@/lib/calculator-input";
import {
  calculateIndustryTaxDiagnosis,
  type IndustryTaxProfile,
} from "@/lib/calculators/industry-tax-diagnosis";
import {
  assessSellerTax,
  type SellerTaxInput,
} from "@/lib/tax-cases/seller-case";

const PROFILES: { id: IndustryTaxProfile; label: string; hint: string }[] = [
  { id: "smartstore", label: "스마트스토어·온라인몰", hint: "정산, 반품, 배송비, 광고비" },
  { id: "purchase_agency", label: "구매대행", hint: "해외매입, 대리결제, 배대지" },
  { id: "reverse_export", label: "역직구·해외판매", hint: "수출증빙, 환율, 해외정산" },
  { id: "freelance", label: "프리랜서", hint: "3.3%, 경비, 지급명세서" },
  { id: "creator_ads", label: "애드센스·콘텐츠 부업", hint: "해외수익, 제휴수익, 제작비" },
  { id: "restaurant", label: "음식점·배달매장", hint: "카드매출, 배달앱, 식자재" },
  { id: "rental", label: "임대사업", hint: "월세, 보증금, 수선비" },
];

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-xl border border-line bg-white px-3 py-2.5 text-sm font-bold text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#1F4D3A]"
      />
      {label}
    </label>
  );
}

export function IndustryTaxDiagnosisHub() {
  const router = useRouter();
  const trackedResultRef = useRef<string | null>(null);
  const [profile, setProfile] = useState<IndustryTaxProfile>("smartstore");
  const [annualRevenue, setAnnualRevenue] = useState("5000");
  const [monthlyDocs, setMonthlyDocs] = useState("30");
  const [hasEmployees, setHasEmployees] = useState(false);
  const [hasForeignTransactions, setHasForeignTransactions] = useState(false);
  const [hasVatIssue, setHasVatIssue] = useState(true);
  const [hasMissingReceipts, setHasMissingReceipts] = useState(false);
  const [businessStatus, setBusinessStatus] =
    useState<SellerTaxInput["businessStatus"]>("registered");
  const [vatStatus, setVatStatus] =
    useState<SellerTaxInput["vatStatus"]>("general");
  const [platformCount, setPlatformCount] = useState("1");
  const [settlementCurrencyCount, setSettlementCurrencyCount] = useState("1");
  const [usesFulfillmentAbroad, setUsesFulfillmentAbroad] = useState(false);
  const [hasExportEvidence, setHasExportEvidence] = useState(false);
  const [grossSalesSeparated, setGrossSalesSeparated] = useState(false);
  const [hasMonthlySettlementRoutine, setHasMonthlySettlementRoutine] =
    useState(false);
  const [hasExpenseEvidence, setHasExpenseEvidence] = useState(false);
  const [creatingCase, setCreatingCase] = useState(false);
  const [caseError, setCaseError] = useState<string | null>(null);

  const parsedRevenue = useMemo(() => parseNonNegativeManwonString(annualRevenue), [annualRevenue]);
  const result = useMemo(() => {
    if (!parsedRevenue.ok) return null;
    return calculateIndustryTaxDiagnosis({
      profile,
      annualRevenueWon: parsedRevenue.value,
      monthlyDocs: Number(monthlyDocs.replace(/[^0-9]/g, "")) || 0,
      hasEmployees,
      hasForeignTransactions,
      hasVatIssue,
      hasMissingReceipts,
    });
  }, [
    profile,
    parsedRevenue,
    monthlyDocs,
    hasEmployees,
    hasForeignTransactions,
    hasVatIssue,
    hasMissingReceipts,
  ]);
  const sellerProfile =
    profile === "smartstore" ||
    profile === "purchase_agency" ||
    profile === "reverse_export"
      ? profile
      : null;
  const sellerInput = useMemo<SellerTaxInput | null>(() => {
    if (!sellerProfile || !parsedRevenue.ok) return null;
    return {
      profile: sellerProfile,
      businessStatus,
      vatStatus,
      annualRevenueWon: parsedRevenue.value,
      monthlyOrderCount: Number(monthlyDocs.replace(/[^0-9]/g, "")) || 0,
      platformCount: Math.max(
        1,
        Number(platformCount.replace(/[^0-9]/g, "")) || 1,
      ),
      settlementCurrencyCount: Math.max(
        1,
        Number(settlementCurrencyCount.replace(/[^0-9]/g, "")) || 1,
      ),
      hasEmployees,
      usesFulfillmentAbroad,
      hasExportEvidence,
      grossSalesSeparated,
      hasMonthlySettlementRoutine,
      hasExpenseEvidence,
    };
  }, [
    businessStatus,
    grossSalesSeparated,
    hasEmployees,
    hasExpenseEvidence,
    hasExportEvidence,
    hasMonthlySettlementRoutine,
    monthlyDocs,
    parsedRevenue,
    platformCount,
    sellerProfile,
    settlementCurrencyCount,
    usesFulfillmentAbroad,
    vatStatus,
  ]);
  const sellerAssessment = useMemo(
    () => (sellerInput ? assessSellerTax(sellerInput) : null),
    [sellerInput],
  );

  const createSellerCase = async () => {
    if (!sellerInput || creatingCase) return;
    setCreatingCase(true);
    setCaseError(null);
    try {
      const response = await fetch("/api/tax-cases/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientDedupeKey: crypto.randomUUID(),
          sourcePath: window.location.pathname,
          input: sellerInput,
        }),
      });
      const body = (await response.json()) as { token?: string };
      if (!response.ok || !body.token) {
        setCaseError("운영표를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
        return;
      }
      router.push(`/case/${body.token}`);
    } catch {
      setCaseError("운영표를 만들지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setCreatingCase(false);
    }
  };

  const onCsvAnalyzed = (summary: SellerCsvSummary) => {
    setMonthlyDocs(String(summary.rowCount));
    setSettlementCurrencyCount(String(summary.currencyCount));
    if (summary.detected.amount && summary.detected.fee) {
      setGrossSalesSeparated(true);
    }
  };

  const tone =
    result?.level === "high"
      ? "border-negative bg-red-50 text-negative-deep"
      : result?.level === "mid"
        ? "border-warning bg-[#FFFBEb] text-warning-content"
        : "border-positive bg-positive-pale text-positive-deep";

  useEffect(() => {
    if (!result) return;
    const trackingKey = `${profile}:${result.level}:${result.score}:${annualRevenue}:${monthlyDocs}:${hasEmployees}:${hasForeignTransactions}:${hasVatIssue}:${hasMissingReceipts}`;
    if (trackedResultRef.current === trackingKey) return;
    trackedResultRef.current = trackingKey;

    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "industry_diagnosis_result_view",
        payload: {
          profile,
          score: result.score,
          level: result.level,
          annualRevenueManwon: annualRevenue,
          monthlyDocs,
          hasEmployees,
          hasForeignTransactions,
          hasVatIssue,
          hasMissingReceipts,
        },
      }),
    });
  }, [
    annualRevenue,
    hasEmployees,
    hasForeignTransactions,
    hasMissingReceipts,
    hasVatIssue,
    monthlyDocs,
    profile,
    result,
  ]);

  return (
    <section id="industry-diagnosis" className="scroll-mt-28 bg-bg">
      <div className="app-shell-frame app-section">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold text-brand-dark">업종별 세금 진단</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight text-ink md:text-4xl">
              세목을 몰라도
              <br />
              업종으로 먼저 판단하세요.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-ink-muted">
              스마트스토어, 구매대행, 역직구, 프리랜서처럼 자료 구조가 다른 업종은
              필요한 계산기와 상담 기준도 달라집니다.
            </p>
          </div>

          <div className="rounded-lg border border-line bg-white p-4 shadow-card sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              {PROFILES.map((item) => {
                const active = item.id === profile;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setProfile(item.id)}
                    className={`flex min-h-[88px] items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      active ? "border-line-strong bg-brand-accent/40" : "border-line bg-white hover:border-ink-soft"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        active ? "bg-ink text-brand" : "bg-bg-muted text-transparent"
                      }`}
                    >
                      <Check size={14} strokeWidth={3} />
                    </span>
                    <span>
                      <span className="block text-sm font-black text-ink">{item.label}</span>
                      <span className="mt-1 block text-xs leading-5 text-ink-muted">{item.hint}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold text-ink">
                연 매출
                <div className="mt-1 flex overflow-hidden rounded-xl border border-line bg-white">
                  <input
                    inputMode="numeric"
                    className="min-w-0 flex-1 px-3 py-2.5 outline-none"
                    value={annualRevenue}
                    onChange={(e) => setAnnualRevenue(formatGroupedNumericInput(e.target.value))}
                  />
                  <span className="flex items-center border-l border-line bg-bg-muted px-3 text-sm text-ink-muted">
                    만원
                  </span>
                </div>
                <span className="mt-1 block text-xs font-normal text-ink-muted">
                  {annualRevenue ? formatKoreanMoneyFromManwonInput(annualRevenue) : "만원 단위"}
                </span>
              </label>

              <label className="block text-sm font-bold text-ink">
                월 거래자료
                <div className="mt-1 flex overflow-hidden rounded-xl border border-line bg-white">
                  <input
                    inputMode="numeric"
                    className="min-w-0 flex-1 px-3 py-2.5 outline-none"
                    value={monthlyDocs}
                    onChange={(e) => setMonthlyDocs(formatGroupedNumericInput(e.target.value))}
                  />
                  <span className="flex items-center border-l border-line bg-bg-muted px-3 text-sm text-ink-muted">
                    건
                  </span>
                </div>
                <span className="mt-1 block text-xs font-normal text-ink-muted">
                  매출·매입·정산·영수증 합산
                </span>
              </label>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Toggle checked={hasEmployees} onChange={setHasEmployees} label="직원·외주 인건비 있음" />
              <Toggle checked={hasForeignTransactions} onChange={setHasForeignTransactions} label="해외거래·외화정산 있음" />
              <Toggle checked={hasVatIssue} onChange={setHasVatIssue} label="부가세 신고 검토 필요" />
              <Toggle checked={hasMissingReceipts} onChange={setHasMissingReceipts} label="증빙 빠진 비용 있음" />
            </div>

            {sellerProfile ? (
              <div className="mt-5 space-y-4 rounded-lg border border-[#CDB7A7] bg-[#FBF8F5] p-4">
                <div>
                  <p className="text-sm font-black text-[#6A442D]">
                    셀러 정밀 진단
                  </p>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    정산 구조와 해외증빙까지 확인하면 내 세금 운영표로 저장할 수 있습니다.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-bold text-ink">
                    사업자 상태
                    <select
                      value={businessStatus}
                      onChange={(event) =>
                        setBusinessStatus(
                          event.target.value as SellerTaxInput["businessStatus"],
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3"
                    >
                      <option value="registered">등록 완료</option>
                      <option value="not_registered">미등록</option>
                      <option value="unsure">잘 모르겠음</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold text-ink">
                    부가세 과세유형
                    <select
                      value={vatStatus}
                      onChange={(event) =>
                        setVatStatus(
                          event.target.value as SellerTaxInput["vatStatus"],
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3"
                    >
                      <option value="general">일반과세</option>
                      <option value="simplified">간이과세</option>
                      <option value="exempt">면세</option>
                      <option value="unsure">잘 모르겠음</option>
                    </select>
                  </label>
                  <label className="text-sm font-bold text-ink">
                    판매 플랫폼 수
                    <input
                      inputMode="numeric"
                      value={platformCount}
                      onChange={(event) =>
                        setPlatformCount(
                          event.target.value.replace(/[^0-9]/g, "").slice(0, 3),
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3"
                    />
                  </label>
                  <label className="text-sm font-bold text-ink">
                    정산 통화 수
                    <input
                      inputMode="numeric"
                      value={settlementCurrencyCount}
                      onChange={(event) =>
                        setSettlementCurrencyCount(
                          event.target.value.replace(/[^0-9]/g, "").slice(0, 3),
                        )
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3"
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Toggle
                    checked={grossSalesSeparated}
                    onChange={setGrossSalesSeparated}
                    label="총매출·수수료·반품을 분리함"
                  />
                  <Toggle
                    checked={hasMonthlySettlementRoutine}
                    onChange={setHasMonthlySettlementRoutine}
                    label="월 정산 대사표가 있음"
                  />
                  <Toggle
                    checked={hasExpenseEvidence}
                    onChange={setHasExpenseEvidence}
                    label="매입·광고·배송비 증빙이 있음"
                  />
                  <Toggle
                    checked={usesFulfillmentAbroad}
                    onChange={setUsesFulfillmentAbroad}
                    label="해외 보관·풀필먼트를 사용함"
                  />
                  {sellerProfile === "reverse_export" ? (
                    <Toggle
                      checked={hasExportEvidence}
                      onChange={setHasExportEvidence}
                      label="수출·배송·외화입금 증빙이 있음"
                    />
                  ) : null}
                </div>
                <SellerSettlementCsvAnalyzer onAnalyzed={onCsvAnalyzed} />
              </div>
            ) : null}

            {result ? (
              <div className={`mt-5 rounded-2xl border p-5 ${tone}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.12em]">Diagnosis</p>
                    <h3 className="mt-2 text-2xl font-black text-ink">{result.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">{result.summary}</p>
                  </div>
                  <div className="rounded-xl bg-white px-4 py-3 text-right">
                    <p className="text-xs font-bold text-ink-muted">복잡도</p>
                    <p className="mt-1 text-2xl font-black text-ink">{result.score}/100</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="text-sm font-black text-ink">핵심 사유</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-ink-muted">
                      {result.reasons.slice(0, 4).map((reason) => (
                        <li key={reason}>- {reason}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-black text-ink">먼저 준비할 자료</p>
                    <ul className="mt-2 space-y-2 text-sm leading-6 text-ink-muted">
                      {result.documents.slice(0, 5).map((document) => (
                        <li key={document}>- {document}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-white p-4">
                  <p className="flex items-center gap-2 text-sm font-black text-ink">
                    <ClipboardList size={17} />
                    다음에 볼 계산기
                  </p>
                  <div className="mt-3 grid gap-2">
                    {result.priorityCalculators.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="group flex items-center justify-between gap-4 rounded-xl border border-line px-4 py-3 text-sm transition hover:border-ink"
                        onClick={() => {
                          void fetch("/api/track", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              eventType: "industry_diagnosis_cta_click",
                              payload: {
                                profile,
                                target_href: item.href,
                                target_label: item.label,
                                score: result.score,
                                level: result.level,
                              },
                            }),
                          });
                        }}
                      >
                        <span>
                          <span className="block font-black text-ink">{item.label}</span>
                          <span className="mt-1 block text-xs leading-5 text-ink-muted">{item.reason}</span>
                        </span>
                        <ArrowRight className="shrink-0 transition group-hover:translate-x-1" size={18} />
                      </Link>
                    ))}
                  </div>
                </div>
                {sellerAssessment ? (
                  <div className="mt-4 rounded-lg border border-line bg-white p-4">
                    <p className="text-sm font-black text-ink">
                      셀러 세금 운영 판단
                    </p>
                    <p className="mt-2 text-sm leading-6 text-ink-muted">
                      {sellerAssessment.decisionSummary}
                    </p>
                    <p className="mt-2 text-xs font-bold text-[#6A442D]">
                      다음 기본 기한 {sellerAssessment.nextDeadline} · 보완 증빙{" "}
                      {sellerAssessment.evidenceGaps.length}개
                    </p>
                    <button
                      type="button"
                      onClick={() => void createSellerCase()}
                      disabled={creatingCase}
                      className="btn-primary mt-4 w-full text-sm font-bold disabled:opacity-60 sm:w-auto"
                    >
                      {creatingCase ? (
                        <Loader2 className="animate-spin" size={17} />
                      ) : (
                        <ClipboardList size={17} />
                      )}
                      내 셀러 세금 운영표 만들기
                    </button>
                    {caseError ? (
                      <p className="mt-3 text-sm text-red-700">{caseError}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
