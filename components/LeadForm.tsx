"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BOOKKEEPING_ACCOUNTANT_OPTIONS,
  BOOKKEEPING_BUSINESS_TYPES,
  BOOKKEEPING_EMPLOYEE_BANDS,
  BOOKKEEPING_REVENUE_BRACKETS,
  getBookkeepingFeeEstimateLine,
} from "@/lib/bookkeeping-lead";
import { RegionSelector } from "@/components/RegionSelector";
import { SituationSelector } from "@/components/SituationSelector";
import { useLeadExperience } from "@/components/lead-experience-context";
import { trackGoogleEvent } from "@/lib/site-track";

export function LeadForm({
  defaultTargetAccountantId,
  defaultSido = "서울특별시",
  defaultSigungu = "강남구",
  defaultSituation,
  prefillMessage,
  taxCaseToken,
  taxCaseSummary,
  mode = "modal",
}: {
  defaultTargetAccountantId?: string | null;
  defaultSido?: string;
  defaultSigungu?: string;
  defaultSituation?: string;
  prefillMessage?: string;
  taxCaseToken?: string;
  taxCaseSummary?: string;
  mode?: "modal" | "embedded";
}) {
  const router = useRouter();
  const { close, showToast } = useLeadExperience();
  const embedded = mode === "embedded";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sido, setSido] = useState(defaultSido);
  const [sigungu, setSigungu] = useState(defaultSigungu);
  const [situation, setSituation] = useState("");
  const [budgetRange] = useState("not_sure");
  const [timeline, setTimeline] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [monthlyRevenue, setMonthlyRevenue] = useState("");
  const [industry, setIndustry] = useState("");
  const [hasAccountant, setHasAccountant] = useState("");
  const [employeeBand, setEmployeeBand] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isBookkeeping = situation === "bookkeeping";

  useEffect(() => {
    setSido(defaultSido);
    setSigungu(defaultSigungu);
  }, [defaultSido, defaultSigungu]);

  useEffect(() => {
    if (defaultSituation) setSituation(defaultSituation);
  }, [defaultSituation]);

  useEffect(() => {
    if (prefillMessage) setMessage(prefillMessage);
  }, [prefillMessage]);

  const isValidPhone = /^\d{2,3}-?\d{3,4}-?\d{4}$/.test(phone.replace(/\s/g, ""));
  const emailTrim = email.trim();
  const emailOk =
    emailTrim === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim);
  const messageLength = message.trim().length;

  const bookkeepingReady =
    Boolean(businessType) &&
    Boolean(monthlyRevenue) &&
    Boolean(industry.trim()) &&
    Boolean(hasAccountant);

  const canSubmit = isBookkeeping
    ? name.trim().length > 1 &&
      isValidPhone &&
      emailOk &&
      Boolean(sido) &&
      Boolean(sigungu) &&
      Boolean(situation) &&
      bookkeepingReady &&
      !pending
    : name.trim().length > 1 &&
      isValidPhone &&
      emailOk &&
      Boolean(sido) &&
      Boolean(sigungu) &&
      Boolean(situation) &&
      Boolean(timeline) &&
      messageLength >= 10 &&
      !pending;

  const validateForm = () => {
    if (name.trim().length < 2) return "이름을 2자 이상 입력해 주세요.";
    if (!isValidPhone) return "연락처 형식이 올바르지 않습니다.";
    if (!emailOk) return "이메일 형식을 확인해 주세요.";
    if (!sido || !sigungu) return "지역을 선택해 주세요.";
    if (!situation) return "상담 유형을 선택해 주세요.";
    if (isBookkeeping) {
      if (!businessType) return "사업자 유형을 선택해 주세요.";
      if (!monthlyRevenue) return "월 매출 규모를 선택해 주세요.";
      if (!industry.trim()) return "업종을 입력해 주세요.";
      if (!hasAccountant) return "현재 세무사 이용 여부를 선택해 주세요.";
      return null;
    }
    if (!timeline) return "진행 시기를 선택해 주세요.";
    if (message.trim().length < 10) return "상담 내용은 10자 이상 입력해 주세요.";
    return null;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const error = validateForm();
    if (error) {
      setFormError(error);
      return;
    }
    setPending(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        phone,
        sido,
        sigungu,
        situation,
        message: message.trim() || null,
        targetAccountantId: defaultTargetAccountantId ?? null,
        sourcePath: window.location.pathname,
        calculatorType: window.location.pathname.startsWith("/calculator/")
          ? decodeURIComponent(window.location.pathname.split("/")[2] ?? "")
          : null,
        taxCaseToken: taxCaseToken ?? null,
      };
      if (emailTrim) {
        payload.email = emailTrim;
      }
      if (isBookkeeping) {
        payload.businessType = businessType;
        payload.monthlyRevenue = monthlyRevenue;
        payload.industry = industry.trim();
        payload.hasAccountant = hasAccountant;
        if (employeeBand.trim() !== "") {
          payload.employeeBand = employeeBand.trim();
        }
      } else {
        payload.budgetRange = budgetRange;
        payload.timeline = timeline;
        payload.message = message.trim();
      }

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        lead?: { id: string; trackingToken: string } | null;
      };
      if (!res.ok) {
        showToast(data.error ?? "전송에 실패했습니다.", "error");
        return;
      }
      showToast(
        isBookkeeping
          ? "기장 상담 요청이 접수되었습니다. 빠르게 연락드리겠습니다."
          : "상담 신청이 접수되었습니다. 빠르게 연락드리겠습니다.",
        "success",
      );
      trackGoogleEvent("lead_submit", {
        category: isBookkeeping ? "bookkeeping" : "tax_consult",
        situation,
      });
      if (!embedded) close();
      setName("");
      setPhone("");
      setEmail("");
      setMessage("");
      setSituation("");
      setTimeline("");
      setBusinessType("");
      setMonthlyRevenue("");
      setIndustry("");
      setHasAccountant("");
      setEmployeeBand("");
      const params = new URLSearchParams();
      if (isBookkeeping) params.set("category", "bookkeeping");
      if (data.lead?.trackingToken) params.set("token", data.lead.trackingToken);
      router.push(`/consult/thank-you${params.size ? `?${params.toString()}` : ""}`);
    } catch {
      showToast("네트워크 오류가 발생했습니다.", "error");
    } finally {
      setPending(false);
    }
  }

  const submitLabel = isBookkeeping
    ? pending
      ? "전송 중…"
      : hasAccountant === "yes"
        ? "지금 기장료 비교해보기"
        : "세금 관리 맡기기"
    : pending
      ? "전송 중…"
      : "무료 매칭 신청하기";

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {taxCaseSummary ? (
        <section className="rounded-lg border border-[#CDB7A7] bg-[#F8F3EF] p-4">
          <p className="text-sm font-black text-[#6A442D]">
            FindTax 진단 인계서가 연결됐습니다.
          </p>
          <p className="mt-1 text-xs leading-5 text-neutral-600">
            준비도·남은 할 일·필요자료가 상담 요청과 함께 전달됩니다.
          </p>
          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-bold text-neutral-700">
              전달 내용 미리보기
            </summary>
            <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-white p-3 font-sans text-xs leading-5 text-neutral-600">
              {taxCaseSummary}
            </pre>
          </details>
        </section>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-neutral-800">
          이름
          <input
            required
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            disabled={pending}
          />
        </label>
        <label className="block text-sm font-medium text-neutral-800">
          연락처
          <input
            required
            type="tel"
            inputMode="tel"
            className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
            placeholder="010-0000-0000"
            disabled={pending}
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-neutral-800">
        이메일 (선택)
        <input
          type="email"
          className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="세금 일정표를 받으려면 입력해 주세요"
          disabled={pending}
        />
        <span className="mt-1 block text-xs text-neutral-500">
          입력 시 맞춤 세금 일정 안내 메일을 보내드립니다.
        </span>
      </label>

      <RegionSelector
        sido={sido}
        sigungu={sigungu}
        onSidoChange={setSido}
        onSigunguChange={setSigungu}
        disabled={pending}
      />

      <SituationSelector
        value={situation}
        onChange={(id) => {
          setSituation(id);
          if (id !== "bookkeeping") {
            setBusinessType("");
            setMonthlyRevenue("");
            setIndustry("");
            setHasAccountant("");
            setEmployeeBand("");
          } else {
            setTimeline("");
          }
        }}
        disabled={pending}
      />

      {isBookkeeping ? (
        <div className="space-y-4 rounded-xl border border-brand/30 bg-brand-light/30 p-3 sm:p-4">
          <p className="text-xs font-semibold text-brand">
            기장 상담 받아보기 — 아래 정보만으로도 견적 범위를 좁힐 수 있습니다.
          </p>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-neutral-800">사업자 유형</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {BOOKKEEPING_BUSINESS_TYPES.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm ${
                    businessType === opt.value ? "ring-2 ring-brand" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="businessType"
                    value={opt.value}
                    checked={businessType === opt.value}
                    onChange={() => setBusinessType(opt.value)}
                    className="h-4 w-4 border-neutral-300 text-brand focus:ring-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-medium text-neutral-800">
            월 매출 규모
            <select
              required
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
              value={monthlyRevenue}
              onChange={(e) => setMonthlyRevenue(e.target.value)}
              disabled={pending}
            >
              <option value="">선택해 주세요</option>
              {BOOKKEEPING_REVENUE_BRACKETS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
            {monthlyRevenue ? (
              <div className="mt-1.5 space-y-0.5">
                {(() => {
                  const line = getBookkeepingFeeEstimateLine(monthlyRevenue);
                  return line ? (
                    <p className="text-sm text-gray-500">{line}</p>
                  ) : null;
                })()}
                <p className="text-sm text-gray-500">
                  실제 금액은 업종·직원 수에 따라 다를 수 있어요
                </p>
              </div>
            ) : null}
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            업종
            <input
              required
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="예: 음식점업, 도소매, IT서비스"
              disabled={pending}
            />
          </label>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-neutral-800">현재 세무사 이용 여부</legend>
            <div className="flex flex-wrap gap-2">
              {BOOKKEEPING_ACCOUNTANT_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm ${
                    hasAccountant === opt.value ? "ring-2 ring-brand" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="hasAccountant"
                    value={opt.value}
                    checked={hasAccountant === opt.value}
                    onChange={() => setHasAccountant(opt.value)}
                    className="h-4 w-4 border-neutral-300 text-brand focus:ring-brand"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block text-sm font-medium text-neutral-800">
            직원 수 (선택)
            <select
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
              value={employeeBand}
              onChange={(e) => setEmployeeBand(e.target.value)}
              disabled={pending}
            >
              <option value="">선택 안 함 (등급 Standard까지)</option>
              {BOOKKEEPING_EMPLOYEE_BANDS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            요청사항 (선택)
            <textarea
              rows={3}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="정산 주기, 분기별 관리 희망 등"
              disabled={pending}
            />
          </label>
        </div>
      ) : (
        <>
          <label className="block text-sm font-medium text-neutral-800">
            연락 희망 시기
            <select
              required
              className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              disabled={pending}
            >
              <option value="">연락받기 좋은 시기를 선택해 주세요</option>
              <option value="immediate">가능한 빨리</option>
              <option value="within_week">1주 이내</option>
              <option value="within_month">1개월 이내</option>
              <option value="not_sure">아직 미정</option>
            </select>
          </label>

          <label className="block text-sm font-medium text-neutral-800">
            상담 내용 (10자 이상)
            <textarea
              required
              rows={4}
              className="mt-1 w-full resize-y rounded-xl border border-neutral-200 px-3 py-2.5 text-base shadow-sm outline-none ring-brand focus:ring-2"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="현재 상황과 확인하고 싶은 내용을 간단히 적어 주세요."
              disabled={pending}
            />
          </label>
        </>
      )}

      <p className="text-xs font-medium text-neutral-600">
        남겨주시면 담당자가 확인 후 순차적으로 연락드립니다.
      </p>

      {formError ? (
        <p className="text-sm text-red-600" role="alert">
          {formError}
        </p>
      ) : null}

      <div
        className={`flex gap-2 ${embedded ? "flex-col-reverse sm:flex-row sm:justify-end" : "flex-col-reverse sm:flex-row sm:justify-end"}`}
      >
        {!embedded ? (
          <button
            type="button"
            onClick={close}
            disabled={pending}
            className="rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
          >
            닫기
          </button>
        ) : null}
        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-ink shadow-md hover:bg-brand-light disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
