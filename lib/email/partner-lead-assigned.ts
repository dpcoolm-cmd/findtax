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

export async function sendPartnerLeadAssignedEmail(input: {
  to: string;
  leadId: string;
  sido: string;
  sigungu: string;
  situation: string;
  leadQuality: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  const from = fromAddress();
  if (!input.to.includes("@")) {
    return { sent: false, reason: "invalid_to" };
  }
  const resend = createResend();
  if (!resend) return { sent: false, reason: "missing_resend_key" };

  const base = getBaseUrl().replace(/\/$/, "");
  const dashUrl = `${base}/partner/dashboard`;
  const subject = "[findtax] 새 상담 배정 — 2시간 내 응답 필요";
  const text = [
    "새 상담 리드가 배정되었습니다.",
    "",
    `리드 ID: ${input.leadId}`,
    `지역: ${input.sido} ${input.sigungu}`,
    `상황: ${input.situation}`,
    input.leadQuality ? `리드 등급: ${input.leadQuality}` : null,
    "",
    "2시간 내 대시보드에서 확인해 주세요.",
    dashUrl,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
<p>새 상담 리드가 배정되었습니다.</p>
<ul>
<li>지역: ${escapeHtml(input.sido)} ${escapeHtml(input.sigungu)}</li>
<li>상황: ${escapeHtml(input.situation)}</li>
${input.leadQuality ? `<li>리드 등급: ${escapeHtml(input.leadQuality)}</li>` : ""}
</ul>
<p><a href="${dashUrl}">지금 확인하기 →</a></p>
<p style="font-size:12px;color:#666">2시간 내 응답이 없으면 배정이 만료될 수 있습니다.</p>
`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: input.to,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("[partner-lead-assigned]", JSON.stringify(error, null, 2));
      return { sent: false, reason: error.message };
    }
    console.log("[partner-lead-assigned] Success", { to: input.to, leadId: input.leadId });
    return { sent: true };
  } catch (e) {
    console.error("[partner-lead-assigned]", e);
    return { sent: false, reason: "send_exception" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
