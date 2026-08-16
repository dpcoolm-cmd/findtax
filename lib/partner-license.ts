export type PartnerProfessionalType = "tax_advisor" | "cpa";

/** Normalize for duplicate checks: digits only. */
export function normalizeLicenseNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Lightweight format checks (final 진위는 관리자 서류 검토).
 * 세무사/회계사 등록번호는 통상 숫자 구성이며 길이를 제한합니다.
 */
export function validateLicenseFormat(
  raw: string,
  type: PartnerProfessionalType,
): { ok: true } | { ok: false; message: string } {
  const digits = normalizeLicenseNumber(raw);
  if (type === "tax_advisor") {
    if (digits.length < 5 || digits.length > 6) {
      return {
        ok: false,
        message: "세무사 등록번호는 숫자 5~6자리로 입력해 주세요.",
      };
    }
    return { ok: true };
  }
  if (digits.length < 5 || digits.length > 20) {
    return {
      ok: false,
      message: "자격번호 형식이 올바르지 않습니다. 숫자만 입력하거나 하이픈을 포함해 주세요.",
    };
  }
  return { ok: true };
}
