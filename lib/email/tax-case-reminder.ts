import { Resend } from "resend";
import { formatKoreanDate } from "@/lib/tax-cases/deadlines";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fromAddress(): string {
  const verified = ["true", "1", "yes"].includes(
    process.env.RESEND_DOMAIN_VERIFIED?.trim().toLowerCase() ?? "",
  );
  const custom = process.env.RESEND_FROM_EMAIL?.trim();
  return verified && custom ? custom : "onboarding@resend.dev";
}

export async function sendTaxCaseReminder(input: {
  to: string;
  caseType: "vat" | "gift" | "solo_business" | "pension" | "seller";
  periodLabel: string;
  filingDeadline: string;
  daysBefore: number;
  readinessScore: number;
}): Promise<{ sent: boolean; messageId?: string; reason?: string }> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return { sent: false, reason: "missing_resend_key" };

  const resend = new Resend(key);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://findtax.kr";
  const myTaxesUrl = new URL("/my-taxes", baseUrl).toString();
  const periodLabel = escapeHtml(input.periodLabel);
  const deadline = escapeHtml(formatKoreanDate(input.filingDeadline));
  const caseLabel =
    input.caseType === "gift"
      ? "증여세"
      : input.caseType === "solo_business"
        ? "1인사업자 세무 일정"
        : input.caseType === "pension"
          ? "연금계좌 납입 점검"
          : input.caseType === "seller"
            ? "온라인·글로벌 셀러 세금 일정"
            : "부가세";
  const subject = `[FindTax] ${caseLabel} 일정 ${input.daysBefore}일 전입니다`;
  const text = [
    `${input.periodLabel} 신고기한이 ${input.daysBefore}일 남았습니다.`,
    `신고기한: ${formatKoreanDate(input.filingDeadline)}`,
    `현재 준비도: ${input.readinessScore}%`,
    "",
    `내 준비상태 확인: ${myTaxesUrl}`,
    "",
    "직권연장·개별연장 대상은 국세청 또는 본인 안내문의 기한을 우선 확인하세요.",
  ].join("\n");
  const html = `
    <div style="margin:0 auto;max-width:560px;padding:32px 20px;font-family:Arial,'Apple SD Gothic Neo',sans-serif;color:#0e0f0c">
      <p style="margin:0 0 8px;color:#6a442d;font-size:14px;font-weight:700">FindTax 신고 알림</p>
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.35">${periodLabel} 신고까지 ${input.daysBefore}일 남았어요.</h1>
      <div style="margin:24px 0;padding:20px;background:#f5f1ea;border-radius:8px">
        <p style="margin:0 0 8px"><strong>신고기한</strong> ${deadline}</p>
        <p style="margin:0"><strong>현재 준비도</strong> ${input.readinessScore}%</p>
      </div>
      <a href="${escapeHtml(myTaxesUrl)}" style="display:inline-block;padding:13px 20px;border-radius:8px;background:#3b2e25;color:#fff;text-decoration:none;font-weight:700">내 준비상태 확인</a>
      <p style="margin:24px 0 0;color:#686b68;font-size:12px;line-height:1.7">직권연장·개별연장 대상은 국세청 또는 본인 안내문의 기한을 우선 확인하세요. 알림 설정은 내 세금 화면에서 변경할 수 있습니다.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject,
      text,
      html,
    });
    if (error) {
      return {
        sent: false,
        reason:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "resend_error",
      };
    }
    return { sent: true, messageId: data?.id };
  } catch (error) {
    return {
      sent: false,
      reason: error instanceof Error ? error.message : "email_send_failed",
    };
  }
}
