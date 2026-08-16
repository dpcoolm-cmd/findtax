import { NextResponse } from "next/server";
import { sendTaxCaseReminder } from "@/lib/email/tax-case-reminder";
import { createServerClient } from "@/lib/supabase";
import { koreaDateString } from "@/lib/tax-cases/deadlines";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || auth !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const databaseToken = process.env.TAX_REMINDER_DB_TOKEN?.trim();
  const supabase = createServerClient();
  if (!databaseToken || !supabase) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const runDate = koreaDateString();
  const { data: reminders, error } = await supabase.rpc(
    "api_claim_due_tax_case_reminders_v1",
    {
      p_cron_token: databaseToken,
      p_run_date: runDate,
    },
  );
  if (error) {
    console.error("[cron/tax-case-reminders] claim failed", error.message);
    return NextResponse.json({ error: "reminder_claim_failed" }, { status: 500 });
  }

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const reminder of reminders ?? []) {
    if (!reminder.user_email) {
      skipped += 1;
      await supabase.rpc("api_complete_tax_case_reminder_v1", {
        p_cron_token: databaseToken,
        p_delivery_id: reminder.delivery_id,
        p_status: "skipped",
        p_provider_message_id: null,
        p_error_code: "user_email_not_found",
      });
      continue;
    }

    const result = await sendTaxCaseReminder({
      to: reminder.user_email,
      caseType: reminder.case_type,
      periodLabel: reminder.filing_period_label,
      filingDeadline: reminder.filing_deadline,
      daysBefore: reminder.days_before,
      readinessScore: reminder.readiness_score,
    });

    if (result.sent) {
      sent += 1;
      await supabase.rpc("api_complete_tax_case_reminder_v1", {
        p_cron_token: databaseToken,
        p_delivery_id: reminder.delivery_id,
        p_status: "sent",
        p_provider_message_id: result.messageId ?? null,
        p_error_code: null,
      });
    } else {
      failed += 1;
      await supabase.rpc("api_complete_tax_case_reminder_v1", {
        p_cron_token: databaseToken,
        p_delivery_id: reminder.delivery_id,
        p_status: "failed",
        p_provider_message_id: null,
        p_error_code: result.reason ?? "email_send_failed",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    runDate,
    claimed: reminders?.length ?? 0,
    sent,
    failed,
    skipped,
  });
}
