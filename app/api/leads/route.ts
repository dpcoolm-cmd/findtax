import { NextResponse } from "next/server";
import {
  BOOKKEEPING_ACCOUNTANT_VALUES,
  BOOKKEEPING_BUSINESS_TYPE_VALUES,
  BOOKKEEPING_EMPLOYEE_BAND_VALUES,
  BOOKKEEPING_REVENUE_VALUES,
  bookkeepingEmployeeBandLabel,
  bookkeepingEmployeeBandToCount,
  computeBookkeepingLeadQuality,
} from "@/lib/bookkeeping-lead";
import { sendAdminLeadNotification } from "@/lib/email/admin-lead";
import { sendLeadUserTaxCalendarEmail } from "@/lib/email/lead-user-tax-calendar";
import { notifyAssignedPartnersForLead } from "@/lib/lead-assignment-notify";
import { insertLeadServer } from "@/lib/leads";
import { logSubmissionToSheet } from "@/lib/sheets-log";
import { insertTrackingEvent } from "@/lib/tracking";
import { buildTaxCaseHandoffText } from "@/lib/tax-cases/handoff";
import { getTaxCaseByToken } from "@/lib/tax-cases/server";

function requestHostHeader(req: Request): string | null {
  const xf = req.headers.get("x-forwarded-host");
  if (xf) {
    const first = xf.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("host");
}

const BK_TYPE = new Set(BOOKKEEPING_BUSINESS_TYPE_VALUES);
const BK_REV = new Set(BOOKKEEPING_REVENUE_VALUES);
const BK_ACCT = new Set(BOOKKEEPING_ACCOUNTANT_VALUES);
const BK_EMP_BAND = new Set(BOOKKEEPING_EMPLOYEE_BAND_VALUES);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const requestHost = requestHostHeader(req);
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const name = typeof o.name === "string" ? o.name : "";
  const phone = typeof o.phone === "string" ? o.phone : "";
  const sido = typeof o.sido === "string" ? o.sido : "";
  const sigungu = typeof o.sigungu === "string" ? o.sigungu : "";
  const situation = typeof o.situation === "string" ? o.situation : "";
  const message = typeof o.message === "string" ? o.message : "";
  const budgetRange = typeof o.budgetRange === "string" ? o.budgetRange : "";
  const timeline = typeof o.timeline === "string" ? o.timeline : "";
  const email = typeof o.email === "string" ? o.email : null;
  const targetAccountantId =
    typeof o.targetAccountantId === "string" ? o.targetAccountantId : null;
  const sourcePath = typeof o.sourcePath === "string" ? o.sourcePath.slice(0, 300) : null;
  const calculatorType = typeof o.calculatorType === "string" ? o.calculatorType.slice(0, 100) : null;
  const taxCaseToken =
    typeof o.taxCaseToken === "string" && UUID_RE.test(o.taxCaseToken)
      ? o.taxCaseToken
      : null;

  if (!name.trim() || !phone.trim() || !sido || !sigungu || !situation) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const isBookkeeping = situation === "bookkeeping";

  let enrichedMessage: string;
  let businessType: string | null = null;
  let monthlyRevenue: string | null = null;
  let industry: string | null = null;
  let hasAccountant: string | null = null;
  let employeeCount: number | null = null;
  let leadQuality: string | null = null;

  if (isBookkeeping) {
    businessType = typeof o.businessType === "string" ? o.businessType.trim() : "";
    monthlyRevenue = typeof o.monthlyRevenue === "string" ? o.monthlyRevenue.trim() : "";
    industry = typeof o.industry === "string" ? o.industry.trim() : "";
    hasAccountant = typeof o.hasAccountant === "string" ? o.hasAccountant.trim() : "";
    const employeeBand =
      typeof o.employeeBand === "string" ? o.employeeBand.trim() : "";
    if (employeeBand === "") {
      employeeCount = null;
    } else if (!BK_EMP_BAND.has(employeeBand)) {
      return NextResponse.json({ error: "invalid_employee_band" }, { status: 400 });
    } else {
      employeeCount = bookkeepingEmployeeBandToCount(employeeBand);
    }

    if (!BK_TYPE.has(businessType)) {
      return NextResponse.json({ error: "invalid_business_type" }, { status: 400 });
    }
    if (!BK_REV.has(monthlyRevenue)) {
      return NextResponse.json({ error: "invalid_monthly_revenue" }, { status: 400 });
    }
    if (!industry) {
      return NextResponse.json({ error: "missing_industry" }, { status: 400 });
    }
    if (!BK_ACCT.has(hasAccountant)) {
      return NextResponse.json({ error: "invalid_has_accountant" }, { status: 400 });
    }

    leadQuality = computeBookkeepingLeadQuality({
      businessType,
      monthlyRevenue,
      industry,
      hasAccountant,
      employeeCount,
    });

    const lines = [
      `[세무 기장]`,
      `사업자 유형: ${businessType}`,
      `월 매출 규모: ${monthlyRevenue}`,
      `업종: ${industry}`,
      `현재 세무사 이용: ${hasAccountant}`,
      employeeBand !== ""
        ? `직원 수: ${bookkeepingEmployeeBandLabel(employeeBand) ?? employeeBand}`
        : null,
      leadQuality ? `리드 등급: ${leadQuality}` : null,
      "",
      message.trim() || "(요청사항 없음)",
    ].filter((x) => x !== null);
    enrichedMessage = lines.join("\n");
  } else {
    if (!budgetRange || !timeline) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }
    if (message.trim().length < 10) {
      return NextResponse.json({ error: "message_too_short" }, { status: 400 });
    }
    enrichedMessage = [
      `예산 범위: ${budgetRange === "not_sure" ? "미정" : budgetRange}`,
      `진행 시기: ${timeline}`,
      "",
      message.trim(),
    ].join("\n");
  }

  if (taxCaseToken) {
    const taxCase = await getTaxCaseByToken(taxCaseToken);
    if (taxCase) {
      enrichedMessage = [
        enrichedMessage,
        "",
        "====================",
        buildTaxCaseHandoffText(taxCase),
      ].join("\n");
    }
  }

  const { lead, error } = await insertLeadServer({
    name,
    phone,
    email,
    sido,
    sigungu,
    situation,
    message: enrichedMessage,
    targetAccountantId,
    category: situation,
    businessType,
    monthlyRevenue,
    industry,
    hasAccountant,
    employeeCount,
    leadQuality,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  if (lead) {
    void insertTrackingEvent("lead_submit", {
      leadId: lead.id,
      sido,
      sigungu,
      situation,
      targetAccountantId: targetAccountantId ?? null,
      source: "api_leads",
      sourcePath,
      calculatorType,
      taxCaseAttached: Boolean(taxCaseToken),
    });
    // 구글 시트 적재 (알림은 이미 Resend 관리자 메일이 처리 → alert:false)
    void logSubmissionToSheet("lead", {
      leadId: lead.id,
      name,
      phone,
      email: email ?? "",
      sido,
      sigungu,
      situation,
      leadQuality: leadQuality ?? "",
      message: enrichedMessage,
    });
    const emailResult = await sendAdminLeadNotification({
      leadId: lead.id,
      name,
      phone,
      email,
      sido,
      sigungu,
      situation,
      message: enrichedMessage,
      targetAccountantId,
      requestHost,
      leadQuality,
      isBookkeeping,
    });
    if (!emailResult.sent) {
      console.warn("[api/leads] admin notify skipped:", emailResult.reason);
    }

    void notifyAssignedPartnersForLead(lead.id);
    const userMail = email?.trim();
    if (userMail) {
      void sendLeadUserTaxCalendarEmail({ to: userMail }).then((r) => {
        if (!r.sent) {
          console.warn("[api/leads] user calendar email skipped:", r.reason);
        }
      });
    }
  }

  return NextResponse.json(
    {
      lead: lead
        ? { id: lead.id, trackingToken: lead.public_tracking_token }
        : null,
    },
    { status: 201 },
  );
}
