/**
 * 2026년 4대보험 월 보험료 참고 산출
 *
 * - 2026년 7월 이후 국민연금 기준소득월액과 보험료율 기준.
 * - 건강보험과 고용보험에는 국민연금 상한을 적용하지 않는다.
 * - 산재는 사업주만 부담하며 업종평균 참고 요율을 사용한다.
 */

/** 국민연금 기준소득월액 상한(2026-07-01~2027-06-30) */
export const NATIONAL_PENSION_MONTHLY_CAP_WON = 6_590_000;

/** 기존 UI 호환용 별칭. 국민연금에만 적용된다. */
export const SOCIAL_INSURANCE_MONTHLY_CAP_WON = NATIONAL_PENSION_MONTHLY_CAP_WON;

export const RATES_2026 = {
  /** 국민연금 총 9.5% 중 근로자·사용자 각 4.75% */
  nationalPensionEmployee: 0.0475,
  /** 건강보험 총 7.19% 중 근로자 3.595% */
  healthEmployee: 0.03595,
  /** 장기요양 = 건강보험료(해당 주체 분) × 13.14% */
  longTermCareOfHealthPremium: 0.1314,
  /** 고용보험 총 1.8% 중 근로자 0.9% */
  employmentEmployee: 0.009,
  /** 사업주 부담 산재(업종평균 참고치) */
  industrialEmployerOnly: 0.0147,
} as const;

function floorByRate(baseWon: number, rate: number): number {
  const rateUnits = Math.round(rate * 100_000);
  return Math.floor((baseWon * rateUnits) / 100_000);
}

export function monthlySocialInsurance(input: {
  monthlySalaryWon: number;
  role: "employee" | "employer";
}): {
  nationalPension: number;
  health: number;
  longTermCare: number;
  employment: number;
  industrialAccident: number;
  total: number;
  contributionBaseWon: number;
  salaryCapped: boolean;
} {
  const raw = input.monthlySalaryWon;
  if (!Number.isFinite(raw) || raw <= 0) {
    return {
      nationalPension: 0,
      health: 0,
      longTermCare: 0,
      employment: 0,
      industrialAccident: 0,
      total: 0,
      contributionBaseWon: 0,
      salaryCapped: false,
    };
  }
  const pensionBase = Math.min(Math.max(0, raw), NATIONAL_PENSION_MONTHLY_CAP_WON);
  const healthEmploymentBase = Math.max(0, raw);
  const salaryCapped = raw > NATIONAL_PENSION_MONTHLY_CAP_WON;
  const np = floorByRate(pensionBase, RATES_2026.nationalPensionEmployee);
  const health = floorByRate(healthEmploymentBase, RATES_2026.healthEmployee);
  const ltc = floorByRate(health, RATES_2026.longTermCareOfHealthPremium);
  const emp = floorByRate(healthEmploymentBase, RATES_2026.employmentEmployee);
  const ia =
    input.role === "employer"
      ? floorByRate(healthEmploymentBase, RATES_2026.industrialEmployerOnly)
      : 0;
  const total = np + health + ltc + emp + ia;
  return {
    nationalPension: np,
    health,
    longTermCare: ltc,
    employment: emp,
    industrialAccident: ia,
    total,
    contributionBaseWon: pensionBase,
    salaryCapped,
  };
}

export function explainSocialInsuranceLines(input: {
  monthlySalaryWon: number;
  role: "employee" | "employer";
}): string[] {
  const r = monthlySocialInsurance(input);
  const pensionBase = r.contributionBaseWon;
  const salaryBase = Math.max(0, input.monthlySalaryWon);
  const roleKo = input.role === "employee" ? "근로자" : "사업주";
  const lines = [
    `국민연금 기준소득월액: ${pensionBase.toLocaleString("ko-KR")}원${r.salaryCapped ? " (월 659만 원 상한 적용)" : ""}`,
    `건강·고용보험 보수월액: ${salaryBase.toLocaleString("ko-KR")}원`,
    `${roleKo} 국민연금 = floor(${pensionBase.toLocaleString("ko-KR")} × 4.75%) = ${r.nationalPension.toLocaleString("ko-KR")}원`,
    `${roleKo} 건강보험 = floor(${salaryBase.toLocaleString("ko-KR")} × 3.595%) = ${r.health.toLocaleString("ko-KR")}원`,
    `${roleKo} 장기요양 = floor(건강보험료 × 13.14%) = ${r.longTermCare.toLocaleString("ko-KR")}원`,
    `${roleKo} 고용보험 = floor(${salaryBase.toLocaleString("ko-KR")} × 0.9%) = ${r.employment.toLocaleString("ko-KR")}원`,
  ];
  if (input.role === "employer") {
    lines.push(
      `사업주 산재보험 참고치 = floor(${salaryBase.toLocaleString("ko-KR")} × 1.47%) = ${r.industrialAccident.toLocaleString("ko-KR")}원`,
    );
  }
  lines.push(`합계 = ${r.total.toLocaleString("ko-KR")}원`);
  return lines;
}
