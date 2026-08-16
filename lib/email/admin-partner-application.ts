import { Resend } from "resend";

const PRIMARY_ADMIN_NOTIFY_EMAIL = "dpcoolm@gmail.com";
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

function normEmail(s: string): string {
  return s.trim().toLowerCase();
}

function adminRecipientEmails(): string[] {
  const notifyRaw = process.env.ADMIN_NOTIFY_EMAIL?.trim();
  const adminRaw = process.env.ADMIN_EMAIL?.trim();
  const effectiveNotify = notifyRaw || PRIMARY_ADMIN_NOTIFY_EMAIL;
  const effectiveAdmin = adminRaw || PRIMARY_ADMIN_NOTIFY_EMAIL;
  const raw = [effectiveNotify, effectiveAdmin].join(",");
  const set = new Set<string>();
  for (const part of raw.split(/[,;\s]+/)) {
    const t = part.trim();
    if (t.includes("@")) set.add(t);
  }
  const primaryNorm = normEmail(PRIMARY_ADMIN_NOTIFY_EMAIL);
  const fromEnv = [...set].filter((e) => normEmail(e) !== primaryNorm);
  return set.size === 0 ? [PRIMARY_ADMIN_NOTIFY_EMAIL] : [PRIMARY_ADMIN_NOTIFY_EMAIL, ...fromEnv];
}

function resendFromAddress(): string {
  const verifiedRaw = process.env.RESEND_DOMAIN_VERIFIED?.trim().toLowerCase();
  const verified = verifiedRaw === "true" || verifiedRaw === "1" || verifiedRaw === "yes";
  const custom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!verified) return RESEND_SANDBOX_FROM;
  return custom || RESEND_SANDBOX_FROM;
}

function siteLabelFromHost(host: string | null) {
  if (host) return host;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (base) {
    try {
      return new URL(base).hostname;
    } catch {
      return "findtax.kr";
    }
  }
  return "findtax.kr";
}

export async function sendAdminPartnerApplicationNotification(input: {
  name: string;
  officeName: string;
  phone: string;
  email: string;
  address: string;
  plan: string;
  specialties: string[];
  bio: string | null;
  requestHost?: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  const to = adminRecipientEmails();
  const resend = createResend();
  if (!to.length) return { sent: false, reason: "missing_admin_email" };
  if (!resend) return { sent: false, reason: "missing_resend_key" };

  const site = siteLabelFromHost(input.requestHost ?? null);
  const text = [
    "새 세무사 파트너 입점 신청이 접수되었습니다.",
    `사이트: ${site}`,
    "",
    `이름: ${input.name}`,
    `사무소: ${input.officeName}`,
    `연락처: ${input.phone}`,
    `이메일: ${input.email}`,
    `주소: ${input.address}`,
    `요금제: ${input.plan}`,
    input.specialties.length ? `전문분야: ${input.specialties.join(", ")}` : null,
    input.bio ? `소개: ${input.bio}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const { error } = await resend.emails.send({
      from: resendFromAddress(),
      to,
      subject: `[${site}] 세무사 입점 신청 — ${input.name.slice(0, 80)} (${input.officeName.slice(0, 60)})`,
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
