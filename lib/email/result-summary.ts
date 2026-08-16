import { Resend } from "resend";

const RESEND_SANDBOX_FROM = "onboarding@resend.dev";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function createResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function resendFromAddress(): string {
  const verifiedRaw = process.env.RESEND_DOMAIN_VERIFIED?.trim().toLowerCase();
  const verified = verifiedRaw === "true" || verifiedRaw === "1" || verifiedRaw === "yes";
  const custom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!verified) return RESEND_SANDBOX_FROM;
  return custom || RESEND_SANDBOX_FROM;
}

/**
 * 계산 결과 요약을 사용자 이메일로 발송.
 * 도메인 미인증(Resend 샌드박스) 상태에서는 계정 소유자 외 주소로 발송이 거부될 수 있다.
 * 호출부는 sent=false여도 이메일 수집 자체는 저장한다(도메인 인증 후 자동 정상화).
 */
export async function sendResultSummaryEmail(input: {
  to: string;
  calculatorLabel: string;
  summary: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const resend = createResend();
  if (!resend) return { sent: false, reason: "missing_resend_key" };

  const text = [
    `FindTax ${input.calculatorLabel} 계산 결과 보관용 요약입니다.`,
    "",
    input.summary,
    "",
    "※ 참고용 간이 계산이며, 실제 신고 세액은 세무사 검토가 필요합니다.",
    "다시 계산하기: https://findtax.kr/calculator",
    "세무사 상담 신청: https://findtax.kr/consult",
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: resendFromAddress(),
      to: [input.to],
      subject: `[FindTax] ${input.calculatorLabel} 계산 결과 요약`,
      text,
      html: `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${esc(text)}</pre>`,
    });
    if (error) {
      const msg =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : "resend_error";
      return { sent: false, reason: msg };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : "send_exception" };
  }
}
