/** 계산기 공통 입력 검증 (2026 기준 UI용) */

export const DEFAULT_MAX_WON = 100_000_000_000_000; // 100조

export type ParsedInput<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export function formatGroupedNumericInput(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString("ko-KR");
}

export function formatKoreanMoneyFromManwonInput(raw: string): string | null {
  const normalized = raw.replace(/,/g, "").trim();
  if (!/^\d+$/.test(normalized)) return null;

  const manwon = Number(normalized);
  if (!Number.isFinite(manwon)) return null;
  if (manwon === 0) return "0만원";

  let remain = manwon;
  const jo = Math.floor(remain / 100_000_000);
  remain %= 100_000_000;
  const eok = Math.floor(remain / 10_000);
  remain %= 10_000;

  const parts: string[] = [];
  if (jo > 0) parts.push(`${jo.toLocaleString("ko-KR")}조`);
  if (eok > 0) parts.push(`${eok.toLocaleString("ko-KR")}억`);
  if (remain > 0) parts.push(`${remain.toLocaleString("ko-KR")}만원`);

  if (parts.length === 0) return `${manwon.toLocaleString("ko-KR")}만원`;
  return parts.join(" ");
}

/** 쉼표 제거 후 숫자만 허용, 음수·0 불가 */
export function parsePositiveWonString(
  raw: string,
  maxWon = DEFAULT_MAX_WON,
): ParsedInput<number> {
  const normalized = raw.replace(/,/g, "").trim();
  if (normalized === "") return { ok: false, error: "값을 입력하세요." };
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, error: "숫자만 입력할 수 있습니다." };
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "0보다 큰 숫자를 입력하세요." };
  }
  if (n > maxWon) {
    return {
      ok: false,
      error: `입력 한도를 초과했습니다. (${maxWon.toLocaleString("ko-KR")}원 이하)`,
    };
  }
  return { ok: true, value: n };
}

/** 만원 단위 입력 → 원 단위 환산, 음수·0 불가 */
export function parsePositiveManwonString(
  raw: string,
  maxWon = DEFAULT_MAX_WON,
): ParsedInput<number> {
  const normalized = raw.replace(/,/g, "").trim();
  if (normalized === "") return { ok: false, error: "값을 입력하세요." };
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, error: "숫자만 입력할 수 있습니다." };
  }
  const manwon = Number(normalized);
  const won = manwon * 10_000;
  if (!Number.isFinite(won) || won <= 0) {
    return { ok: false, error: "0보다 큰 숫자를 입력하세요." };
  }
  if (won > maxWon) {
    return {
      ok: false,
      error: `입력 한도를 초과했습니다. (${maxWon.toLocaleString("ko-KR")}원 이하)`,
    };
  }
  return { ok: true, value: won };
}

/** 0 허용 (공제 등), 음수·비숫자 불가 */
export function parseNonNegativeWonString(
  raw: string,
  maxWon = DEFAULT_MAX_WON,
): ParsedInput<number> {
  const normalized = raw.replace(/,/g, "").trim();
  if (normalized === "") return { ok: true, value: 0 };
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, error: "숫자만 입력할 수 있습니다." };
  }
  const n = Number(normalized);
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: "0 이상의 숫자를 입력하세요." };
  }
  if (n > maxWon) {
    return {
      ok: false,
      error: `입력 한도를 초과했습니다. (${maxWon.toLocaleString("ko-KR")}원 이하)`,
    };
  }
  return { ok: true, value: n };
}

/** 만원 단위 입력 → 원 단위 환산, 0 허용 */
export function parseNonNegativeManwonString(
  raw: string,
  maxWon = DEFAULT_MAX_WON,
): ParsedInput<number> {
  const normalized = raw.replace(/,/g, "").trim();
  if (normalized === "") return { ok: true, value: 0 };
  if (!/^\d+$/.test(normalized)) {
    return { ok: false, error: "숫자만 입력할 수 있습니다." };
  }
  const manwon = Number(normalized);
  const won = manwon * 10_000;
  if (!Number.isFinite(won) || won < 0) {
    return { ok: false, error: "0 이상의 숫자를 입력하세요." };
  }
  if (won > maxWon) {
    return {
      ok: false,
      error: `입력 한도를 초과했습니다. (${maxWon.toLocaleString("ko-KR")}원 이하)`,
    };
  }
  return { ok: true, value: won };
}

/** 시간·일수 등 양의 실수 */
export function parsePositiveDecimalString(raw: string, max = 1_000_000): ParsedInput<number> {
  const s = raw.replace(/,/g, "").trim();
  if (s === "") return { ok: false, error: "값을 입력하세요." };
  if (!/^\d*\.?\d+$/.test(s)) {
    return { ok: false, error: "숫자만 입력할 수 있습니다." };
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: "0보다 큰 값을 입력하세요." };
  }
  if (n > max) return { ok: false, error: "입력 범위를 초과했습니다." };
  return { ok: true, value: n };
}

/** 정수 (근무일수 등), 최소 1 */
export function parsePositiveIntString(raw: string, max = 366): ParsedInput<number> {
  const s = raw.replace(/,/g, "").trim();
  if (s === "") return { ok: false, error: "값을 입력하세요." };
  if (!/^\d+$/.test(s)) return { ok: false, error: "숫자만 입력할 수 있습니다." };
  const n = Number(s);
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, error: "1 이상의 정수를 입력하세요." };
  }
  if (n > max) return { ok: false, error: "입력 범위를 초과했습니다." };
  return { ok: true, value: n };
}
