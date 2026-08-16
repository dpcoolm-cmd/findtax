import { Resend } from "resend";
import { getBaseUrl } from "@/lib/seo/site";

function createResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function fromAddress(): string {
  const verified =
    process.env.RESEND_DOMAIN_VERIFIED?.trim().toLowerCase() === "true" ||
    process.env.RESEND_DOMAIN_VERIFIED?.trim() === "1";
  const custom = process.env.RESEND_FROM_EMAIL?.trim();
  if (verified && custom) return custom;
  return "onboarding@resend.dev";
}

export async function sendLeadUserTaxCalendarEmail(input: {
  to: string;
}): Promise<{ sent: boolean; reason?: string }> {
  if (!input.to.includes("@")) return { sent: false, reason: "invalid_to" };
  const resend = createResend();
  if (!resend) return { sent: false, reason: "missing_resend_key" };

  const base = getBaseUrl().replace(/\/$/, "");
  const consultUrl = `${base}/consult/thank-you`;
  const subject = "findtax.kr | 내 업종 맞춤 세금 일정표";
  const text = [
    "상담 신청이 접수되었습니다. 아래는 자주 쓰이는 신고 일정 예시입니다(참고용).",
    "",
    "- 종합소득세: 매년 5월 신고·납부(일반)",
    "- 부가세: 1월·7월 확정·납부(과세기간에 따라 상이)",
    "- 법인세: 사업연도 종료 후 3개월 내 신고·납부(일반)",
    "",
    `세무사 연결 현황 확인 → ${consultUrl}`,
  ].join("\n");

  const html = `<p>상담 신청이 접수되었습니다.</p>
<ul>
<li>종합소득세: 매년 5월 신고·납부(일반)</li>
<li>부가세: 1월·7월 확정·납부(과세기간에 따라 상이)</li>
<li>법인세: 사업연도 종료 후 3개월 내 신고·납부(일반)</li>
</ul>
<p><a href="${consultUrl}">세무사 연결 현황 확인 →</a></p>`;

  try {
    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: input.to,
      subject,
      text,
      html,
    });
    if (error) return { sent: false, reason: error.message };
    return { sent: true };
  } catch {
    return { sent: false, reason: "send_exception" };
  }
}
