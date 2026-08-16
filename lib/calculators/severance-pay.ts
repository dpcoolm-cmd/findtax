/** 퇴직금·퇴직소득세 참고치 (간이) */

export function parseYmd(s: string): Date | null {
  const t = s.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) return null;
  return dt;
}

/** 입·퇴사일 포함 근속일수(달력일) */
export function serviceDaysInclusive(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return 0;
  return Math.floor(ms / 86_400_000) + 1;
}

/**
 * 퇴직일 전 3개월간 임금 산정용 달력일수(행안부 안내 흐름과 동일하게,
 * 퇴직일에서 3개월 전 같은 날의 다음 날부터 퇴직일까지 일수).
 */
export function wageReferencePeriodDaysInclusive(resign: Date): number {
  const y = resign.getFullYear();
  const m = resign.getMonth();
  const d = resign.getDate();
  const end = new Date(y, m, d);
  const start = new Date(y, m - 3, d);
  start.setDate(start.getDate() + 1);
  return serviceDaysInclusive(start, end);
}

export function calculateSeverancePay(input: {
  hireYmd: string;
  resignYmd: string;
  /** 퇴직 전 3개월 기간 중 지급된 기본급 등 합계 */
  lastThreeMonthsSalaryTotal: number;
  /** 동 기간 중 지급된 상여금 합계(선택) */
  bonusInPeriodWon?: number;
  /** 동 기간 중 지급된 연차수당 합계(선택) */
  annualLeaveAllowanceInPeriodWon?: number;
}): {
  serviceDays: number;
  serviceYears: number;
  referencePeriodDays: number;
  wageTotalForAverage: number;
  dailyAverageWage: number;
  severanceGross: number;
  estimatedIncomeTax: number;
  netAfterTax: number;
} | null {
  const hire = parseYmd(input.hireYmd);
  const resign = parseYmd(input.resignYmd);
  if (!hire || !resign) return null;
  if (resign.getTime() < hire.getTime()) return null;

  const salaryRaw = input.lastThreeMonthsSalaryTotal;
  if (!Number.isFinite(salaryRaw)) return null;
  const bonus = Math.max(0, Number.isFinite(input.bonusInPeriodWon ?? 0) ? (input.bonusInPeriodWon ?? 0) : 0);
  const annual = Math.max(
    0,
    Number.isFinite(input.annualLeaveAllowanceInPeriodWon ?? 0)
      ? (input.annualLeaveAllowanceInPeriodWon ?? 0)
      : 0,
  );
  const wageTotal = Math.max(0, salaryRaw) + bonus + annual;
  if (wageTotal <= 0) return null;

  const serviceDays = serviceDaysInclusive(hire, resign);
  if (serviceDays < 1) return null;

  const referencePeriodDays = wageReferencePeriodDaysInclusive(resign);
  const daysForAverage = Math.max(1, referencePeriodDays);
  const dailyAverageWage = wageTotal / daysForAverage;
  const serviceYears = serviceDays / 365;
  const severanceGross = Math.floor(dailyAverageWage * 30 * serviceYears);
  const estimatedIncomeTax = Math.floor(severanceGross * 0.05);
  const netAfterTax = severanceGross - estimatedIncomeTax;
  return {
    serviceDays,
    serviceYears,
    referencePeriodDays,
    wageTotalForAverage: wageTotal,
    dailyAverageWage,
    severanceGross,
    estimatedIncomeTax,
    netAfterTax,
  };
}

export function explainSeverancePayLines(result: NonNullable<ReturnType<typeof calculateSeverancePay>>): string[] {
  return [
    `평균임금 = 임금총액(${result.wageTotalForAverage.toLocaleString("ko-KR")}원) ÷ 산정기간 일수(${result.referencePeriodDays}일)`,
    `         ≈ ${Math.round(result.dailyAverageWage).toLocaleString("ko-KR")}원/일`,
    `퇴직금 = floor(평균임금 × 30일 × (근속일수 ${result.serviceDays}일 ÷ 365))`,
    `       = ${result.severanceGross.toLocaleString("ko-KR")}원`,
  ];
}
