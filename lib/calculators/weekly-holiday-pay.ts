/**
 * 주휴수당 참고 산출
 *
 * - 주 15시간 이상 근로 시 주휴 발생(소정근로일 개근 전제, 간이).
 * - 주휴수당 = 시급 × 1일 소정근로시간, 1일 소정근로시간 = 주 근무시간 ÷ 주 근무일수.
 */

const WEEKS_PER_MONTH = 4.345;

export function calculateWeeklyHolidayPay(input: {
  hourlyWon: number;
  /** 주간 총 소정근로시간 */
  weeklyWorkHours: number;
  /** 주간 근무일수 */
  weeklyWorkDays: number;
}): {
  qualifies: boolean;
  dailyPrescribedHours: number;
  weeklyHolidayPay: number;
  effectiveHourlyWithHoliday: number;
  monthlyEstimateWithHoliday: number;
} {
  if (
    !Number.isFinite(input.hourlyWon) ||
    !Number.isFinite(input.weeklyWorkHours) ||
    !Number.isFinite(input.weeklyWorkDays)
  ) {
    return {
      qualifies: false,
      dailyPrescribedHours: 0,
      weeklyHolidayPay: 0,
      effectiveHourlyWithHoliday: 0,
      monthlyEstimateWithHoliday: 0,
    };
  }
  const h = Math.max(0, input.hourlyWon);
  const wh = Math.max(0, input.weeklyWorkHours);
  const wd = Math.max(1, Math.floor(input.weeklyWorkDays));
  const qualifies = wh >= 15;
  const dailyPrescribedHours = wh / wd;
  const weeklyHolidayPay = qualifies ? Math.floor(h * dailyPrescribedHours) : 0;
  const weeklyWorkPay = Math.floor(wh * h);
  const weeklyTotal = weeklyWorkPay + weeklyHolidayPay;
  const effectiveHourlyWithHoliday = wh > 0 ? weeklyTotal / wh : h;
  const monthlyEstimateWithHoliday = Math.floor(weeklyTotal * WEEKS_PER_MONTH);
  return {
    qualifies,
    dailyPrescribedHours,
    weeklyHolidayPay,
    effectiveHourlyWithHoliday: Number.isFinite(effectiveHourlyWithHoliday)
      ? effectiveHourlyWithHoliday
      : h,
    monthlyEstimateWithHoliday,
  };
}

export function explainWeeklyHolidayPayLines(
  input: { hourlyWon: number; weeklyWorkHours: number; weeklyWorkDays: number },
  result: ReturnType<typeof calculateWeeklyHolidayPay>,
): string[] {
  const wd = Math.max(1, Math.floor(input.weeklyWorkDays));
  const daily = input.weeklyWorkHours / wd;
  if (!result.qualifies) {
    return [
      `주 ${input.weeklyWorkHours}시간은 15시간 미만이어서 주휴 미발생(간이).`,
      `1일 소정근로시간 = ${input.weeklyWorkHours} ÷ ${wd} = ${daily.toFixed(4)}시간`,
    ];
  }
  return [
    `1일 소정근로시간 = 주 근무시간(${input.weeklyWorkHours}h) ÷ 근무일수(${wd}일) = ${daily.toFixed(4)}시간`,
    `주휴수당 = floor(시급(${input.hourlyWon.toLocaleString("ko-KR")}원) × ${daily.toFixed(4)}h) = ${result.weeklyHolidayPay.toLocaleString("ko-KR")}원`,
  ];
}
