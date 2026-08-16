/**
 * 제출(리드·파트너 신청·문의)을 Google 스프레드시트에 적재하기 위한 웹훅 로거.
 *
 * 동작: SHEETS_WEBHOOK_URL(Google Apps Script 웹앱)로 한 건씩 POST.
 *  - 미설정이면 조용히 no-op → 기존 제출 흐름에 절대 영향 없음.
 *  - fire-and-forget(void)로 호출해 응답 지연·실패가 사용자 응답을 막지 않게 한다.
 *  - SHEETS_WEBHOOK_TOKEN은 임의 POST를 막기 위한 공유 비밀값(Apps Script에서 검증).
 *
 * Apps Script 템플릿: scripts/sheets-webhook.gs
 */
export type SheetLogType = "lead" | "partner_application" | "support";

export interface SheetLogOptions {
  /** true면 Apps Script가 ALERT_EMAIL로 알림 메일을 보낸다(이미 Resend로 알림하는 타입은 false). */
  alert?: boolean;
}

export async function logSubmissionToSheet(
  type: SheetLogType,
  data: Record<string, unknown>,
  opts: SheetLogOptions = {},
): Promise<void> {
  const url = process.env.SHEETS_WEBHOOK_URL?.trim();
  if (!url) return;

  const payload = {
    type,
    alert: opts.alert ?? false,
    token: process.env.SHEETS_WEBHOOK_TOKEN?.trim() ?? "",
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      // Apps Script는 302 리다이렉트로 응답하므로 follow 허용(기본값).
    });
  } catch (error) {
    console.warn(
      "[sheets-log] webhook failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
