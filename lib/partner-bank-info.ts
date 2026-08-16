/** Lines shown on partner recharge UI. Use `NEXT_PUBLIC_PARTNER_BANK_INFO` (newline-separated). */
export function getPartnerBankInfoLines(): string[] {
  const raw = process.env.NEXT_PUBLIC_PARTNER_BANK_INFO ?? "";
  const lines = raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [
      "무통장 입금 계좌는 운영팀에서 안내 중입니다.",
      "관리자에게 NEXT_PUBLIC_PARTNER_BANK_INFO 환경변수 설정을 요청해 주세요.",
    ];
  }
  return lines;
}
