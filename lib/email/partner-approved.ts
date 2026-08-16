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

export async function sendPartnerApprovedEmail(input: {
  to: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const resend = createResend();
  if (!resend) return { sent: false, reason: "missing_resend_key" };
  const base = getBaseUrl().replace(/\/$/, "");
  const dash = `${base}/partner/dashboard`;
  const subject = "findtax.kr 파트너 승인 완료! 이렇게 시작하세요";
  const text = [
    "findtax.kr 파트너 등록이 승인되었습니다.",
    "",
    "1) 리드 받는 방법",
    "- 대시보드 → 배정된 리드 확인 → 2시간 내 확인·Unlock",
    "",
    "2) 첫 연락 템플릿 예시",
    "- 종합소득세: 안녕하세요, findtax.kr 파트너 세무사입니다. 종합소득세 관련 문의 주셨는데, 간단히 상황 여쭤봐도 될까요?",
    "- 양도세: 안녕하세요. 양도세 절세 관련 상담 신청 확인했습니다. 매물 정보 간략히 알려주시면 바로 검토해드리겠습니다.",
    "- 기장: 안녕하세요. 기장 서비스 문의 주셨습니다. 사업 규모와 업종 알려주시면 맞춤 기장료 안내해드리겠습니다.",
    "",
    "3) 주의사항",
    "- 2시간 미응답 시 리드 배정이 만료될 수 있습니다.",
    "",
    `대시보드: ${dash}`,
  ].join("\n");

  const html = `<pre style="font-family:system-ui;white-space:pre-wrap">${text.replace(
    /</g,
    "&lt;",
  )}</pre><p><a href="${dash}">대시보드로 이동</a></p>`;

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
