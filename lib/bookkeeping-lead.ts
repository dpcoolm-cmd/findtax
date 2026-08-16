/** bookkeeping 리드 품질·폼 상수 (API·폼과 동일 키 유지) */

export const BOOKKEEPING_BUSINESS_TYPES = [
  { value: "individual", label: "개인사업자" },
  { value: "corporation", label: "법인" },
  { value: "planned", label: "개업예정" },
] as const;

export const BOOKKEEPING_REVENUE_BRACKETS = [
  { value: "0_10m", label: "0~1천만원" },
  { value: "10m_50m", label: "1천~5천만원" },
  { value: "50m_100m", label: "5천만~1억원" },
  { value: "100m_plus", label: "1억원 이상" },
] as const;

export const BOOKKEEPING_ACCOUNTANT_OPTIONS = [
  { value: "yes", label: "있음" },
  { value: "no", label: "없음" },
] as const;

export const BOOKKEEPING_BUSINESS_TYPE_VALUES: readonly string[] =
  BOOKKEEPING_BUSINESS_TYPES.map((x) => x.value);
export const BOOKKEEPING_REVENUE_VALUES: readonly string[] =
  BOOKKEEPING_REVENUE_BRACKETS.map((x) => x.value);
export const BOOKKEEPING_ACCOUNTANT_VALUES: readonly string[] =
  BOOKKEEPING_ACCOUNTANT_OPTIONS.map((x) => x.value);

/** 직원 수 구간(선택) — DB `employee_count`는 대표값으로 매핑 */
export const BOOKKEEPING_EMPLOYEE_BANDS = [
  { value: "none", label: "없음" },
  { value: "1_5", label: "1~5명" },
  { value: "6_10", label: "6~10명" },
  { value: "10_plus", label: "10명+" },
] as const;

export const BOOKKEEPING_EMPLOYEE_BAND_VALUES: readonly string[] =
  BOOKKEEPING_EMPLOYEE_BANDS.map((x) => x.value);

export function bookkeepingEmployeeBandLabel(band: string): string | null {
  return BOOKKEEPING_EMPLOYEE_BANDS.find((b) => b.value === band)?.label ?? null;
}

/** 리드·등급 계산용 대표 인원수 (미선택 시 null) */
export function bookkeepingEmployeeBandToCount(band: string): number | null {
  switch (band) {
    case "none":
      return 0;
    case "1_5":
      return 3;
    case "6_10":
      return 8;
    case "10_plus":
      return 12;
    default:
      return null;
  }
}

/** 월 매출 구간 선택 시 폼에 표시하는 참고용 기장료 문구 */
export function getBookkeepingFeeEstimateLine(revenueKey: string): string | null {
  switch (revenueKey) {
    case "0_10m":
      return "예상 기장료: 월 10~20만원";
    case "10m_50m":
      return "예상 기장료: 월 20~40만원";
    case "50m_100m":
      return "예상 기장료: 월 40~80만원";
    case "100m_plus":
      return "예상 기장료: 월 80만원~";
    default:
      return null;
  }
}

export type BookkeepingLeadQuality = "basic" | "standard" | "premium";

export function computeBookkeepingLeadQuality(input: {
  businessType: string;
  monthlyRevenue: string;
  industry: string;
  hasAccountant: string;
  employeeCount: number | null;
}): BookkeepingLeadQuality {
  const typeOk = Boolean(input.businessType.trim());
  const revOk = Boolean(input.monthlyRevenue.trim());
  const industryOk = input.industry.trim().length > 0;
  const accountantOk = Boolean(input.hasAccountant.trim());
  const employeesOk =
    input.employeeCount !== null &&
    input.employeeCount !== undefined &&
    Number.isFinite(input.employeeCount) &&
    input.employeeCount >= 0;

  if (!typeOk) return "basic";
  if (!revOk || !industryOk) return "basic";
  if (!accountantOk) return "basic";
  if (!employeesOk) return "standard";
  return "premium";
}
