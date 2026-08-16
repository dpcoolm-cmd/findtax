export const CURRENT_VAT_FILING_DEADLINE = {
  periodLabel: "2026년 1기 확정신고",
  deadline: "2026-07-27",
  sourceUrl:
    "https://www.nts.go.kr/nts/na/ntt/selectNttInfo.do?bbsId=1028&mi=2201&nttSn=1352987",
} as const;

const DAY_MS = 86_400_000;

function dateOnlyUtc(value: string | Date): number {
  if (typeof value === "string") {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) throw new Error("invalid_date");
    return Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
}

export function deadlineDaysRemaining(
  deadline: string,
  today: Date = new Date(),
): number {
  return Math.round((dateOnlyUtc(deadline) - dateOnlyUtc(today)) / DAY_MS);
}

export function deadlineBadge(daysRemaining: number): string {
  if (daysRemaining > 0) return `D-${daysRemaining}`;
  if (daysRemaining === 0) return "D-Day";
  return `${Math.abs(daysRemaining)}일 지남`;
}

export function formatKoreanDate(date: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${date}T00:00:00+09:00`));
}

export function koreaDateString(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(date);
}

