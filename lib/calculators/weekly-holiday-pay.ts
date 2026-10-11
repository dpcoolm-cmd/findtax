/**
 * 주휴수당 참고 산출
 *
 * - 주 15시간 이상 근로 시 주휴 발생(소정근로일 개근 전제, 간이).
 * - 주휴수당 = 시급 × 1일 소정근로시간, 주 5일·40시간 통상근로자 기준 주휴시간 = min(주 소정근로시간, 40) ÷ 5. 실제 근무일수로 나누지 않음.
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
  const qualifies = wh >= 15;
  const dailyPrescribedHours = Math.min(wh, 40) / 5;
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
  const daily = Math.min(input.weeklyWorkHours, 40) / 5;
  if (!result.qualifies) {
    return [
      `주 ${input.weeklyWorkHours}시간은 15시간 미만이어서 주휴 미발생(간이).`,
      `주 5일·40시간 통상근로자 기준 주휴시간 = min(${input.weeklyWorkHours}, 40) ÷ 5 = ${daily.toFixed(4)}시간`,
    ];
  }
  return [
    `주 5일·40시간 통상근로자 기준 주휴시간 = min(${input.weeklyWorkHours}, 40) ÷ 5 = ${daily.toFixed(4)}시간`,
    `주휴수당 = floor(시급(${input.hourlyWon.toLocaleString("ko-KR")}원) × ${daily.toFixed(4)}h) = ${result.weeklyHolidayPay.toLocaleString("ko-KR")}원`,
  ];
}
