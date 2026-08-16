import { Resend } from "resend";

/** Resend 가입·운영 기본 수신 (환경 변수가 비어 있거나 다른 주소만 있어도 최우선 배치) */
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

/**
 * ADMIN_NOTIFY_EMAIL · ADMIN_EMAIL
 * - 비어 있으면 둘 다 Resend 가입 Gmail(`PRIMARY_ADMIN_NOTIFY_EMAIL`)로 간주합니다.
 * - 파싱된 주소 중 `PRIMARY_ADMIN_NOTIFY_EMAIL`을 항상 맨 앞(To 최우선), 나머지는 중복 제거 후 뒤에 붙입니다.
 */
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
  if (set.size === 0) {
    return [PRIMARY_ADMIN_NOTIFY_EMAIL];
  }
  return [PRIMARY_ADMIN_NOTIFY_EMAIL, ...fromEnv];
}

/**
 * Resend 무료 티어·도메인 미인증: 발신은 **항상** `onboarding@resend.dev`.
 * `RESEND_FROM_EMAIL`에 다른 값이 있어도, `RESEND_DOMAIN_VERIFIED`가 true/1/yes가 아니면 무시합니다.
 * 인증 완료 후에만 `RESEND_FROM_EMAIL`을 사용하고, 그때도 비어 있으면 샌드박스로 폴백합니다.
 */
function resendFromAddress(): string {
  const verifiedRaw = process.env.RESEND_DOMAIN_VERIFIED?.trim().toLowerCase();
  const verified = verifiedRaw === "true" || verifiedRaw === "1" || verifiedRaw === "yes";
  const custom = process.env.RESEND_FROM_EMAIL?.trim();

  if (!verified) {
    if (custom && normEmail(custom) !== normEmail(RESEND_SANDBOX_FROM)) {
      console.log(
        "[admin-lead-email] From: forced onboarding@resend.dev (RESEND_DOMAIN_VERIFIED is not true; ignoring RESEND_FROM_EMAIL)",
      );
    }
    return RESEND_SANDBOX_FROM;
  }

  if (!custom) {
    console.warn(
      "[admin-lead-email] From: RESEND_DOMAIN_VERIFIED is set but RESEND_FROM_EMAIL is empty; using onboarding@resend.dev",
    );
    return RESEND_SANDBOX_FROM;
  }

  return custom;
}

function siteLabelFromHost(host: string | null): string {
  if (host) return host;
  const base = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (base) {
    try {
      return new URL(base).hostname;
    } catch {
      /* ignore */
    }
  }
  return "findtax.kr";
}

export async function sendAdminLeadNotification(input: {
  leadId: string;
  name: string;
  phone: string;
  email: string | null;
  sido: string;
  sigungu: string;
  situation: string;
  message: string | null;
  targetAccountantId: string | null;
  /** 요청 Host (findtax.kr / home-atoz.kr 등 구분용) */
  requestHost?: string | null;
  leadQuality?: string | null;
  isBookkeeping?: boolean;
}): Promise<{ sent: boolean; reason?: string }> {
  const to = adminRecipientEmails();
  const from = resendFromAddress();
  if (!to.length) {
    console.warn("[admin-lead-email] RESULT: SKIP — no To addresses resolved.");
    return { sent: false, reason: "missing_admin_or_from" };
  }

  const resend = createResend();
  if (!resend) {
    console.warn("[admin-lead-email] RESULT: SKIP — RESEND_API_KEY is not set.");
    return { sent: false, reason: "missing_resend_key" };
  }

  const site = siteLabelFromHost(input.requestHost ?? null);

  const lines = [
    input.isBookkeeping ? `새 기장 상담 리드가 접수되었습니다.` : `새 상담 리드가 접수되었습니다.`,
    `사이트: ${site}`,
    ``,
    `리드 ID: ${input.leadId}`,
    `이름: ${input.name}`,
    `연락처: ${input.phone}`,
    input.email ? `이메일: ${input.email}` : null,
    `지역: ${input.sido} ${input.sigungu}`,
    `상황: ${input.situation}`,
    input.leadQuality ? `리드 등급: ${input.leadQuality}` : null,
    input.message ? `상담 내용: ${input.message}` : null,
    input.targetAccountantId
      ? `지정 세무사 ID: ${input.targetAccountantId}`
      : null,
  ].filter(Boolean);

  const text = lines.join("\n");
  const html = `<pre style="font-family:system-ui,sans-serif;white-space:pre-wrap">${esc(
    text,
  )}</pre>`;

  const subject = `[${site}] ${input.isBookkeeping ? "기장 상담" : "새 상담 신청"} — ${input.name.slice(0, 120)}`;

  console.log("[admin-lead-email] SEND_ATTEMPT", {
    result: "pending",
    toAddresses: to,
    toJoined: to.join(", "),
    from,
    subjectPreview: subject.slice(0, 80),
    leadId: input.leadId,
  });

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      text,
      html,
    });
    if (error) {
      const errDump =
        typeof error === "object" && error !== null
          ? JSON.stringify(error, null, 2)
          : String(error);
      console.error("[admin-lead-email] RESULT: FAIL (Resend API)", {
        toAddresses: to,
        toJoined: to.join(", "),
        from,
        leadId: input.leadId,
        resendErrorFull: errDump,
      });
      console.error("[admin-lead-email] RESULT: FAIL — Resend error object (raw):", error);
      const msg =
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : errDump;
      return { sent: false, reason: msg };
    }
    console.log("[admin-lead-email] RESULT: SUCCESS", {
      toAddresses: to,
      toJoined: to.join(", "),
      from,
      messageId: data?.id ?? null,
      leadId: input.leadId,
    });
    return { sent: true };
  } catch (e) {
    const errDump =
      e instanceof Error
        ? JSON.stringify(
            { name: e.name, message: e.message, stack: e.stack },
            null,
            2,
          )
        : JSON.stringify(e, null, 2);
    console.error("[admin-lead-email] RESULT: FAIL (exception)", {
      toAddresses: to,
      toJoined: to.join(", "),
      from,
      leadId: input.leadId,
      exceptionFull: errDump,
    });
    console.error("[admin-lead-email] RESULT: FAIL — exception (raw):", e);
    return {
      sent: false,
      reason: e instanceof Error ? e.message : "send_exception",
    };
  }
}
