import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminUserFromRequest } from "@/lib/admin-auth";
import { isLikelyTestValue } from "@/lib/traffic-quality";
import type { Database, Json } from "@/types/database";

type TrackingRow = {
  event_type: string;
  payload: unknown;
  created_at: string;
};

type CalculatorInsight = {
  calculatorType: string;
  resultViews: number;
  summaryCopies: number;
  linkCopies: number;
  ctaClicks: number;
  leadSubmits: number;
};

type SituationInsight = {
  situationId: string;
  pageViews: number;
  calculatorClicks: number;
  expertCheckClicks: number;
  regionClicks: number;
  leadSubmits: number;
};

type BlogInsight = {
  blogSlug: string;
  calculatorClicks: number;
  consultClicks: number;
  totalClicks: number;
  topCalculatorType: string | null;
};

type IndustryInsight = {
  profile: string;
  resultViews: number;
  ctaClicks: number;
  highCount: number;
  midCount: number;
  lowCount: number;
  scoreTotal: number;
  avgScore: number;
};

type TaxCaseRow = {
  id: string;
  case_type: "vat" | "gift" | "solo_business" | "pension" | "seller";
  status: "preparing" | "ready" | "completed";
  readiness_score: number;
  complexity_score: number;
  recommendation: "self" | "review" | "tax_accountant";
  source_path: string | null;
  user_id: string | null;
  filing_method: "undecided" | "direct" | "professional";
  created_at: string;
  filing_completed_at: string | null;
  hometax_opened_at: string | null;
  consultation_opened_at: string | null;
  completion_outcome:
    | "filed_self"
    | "filed_professional"
    | "prepared_only"
    | "not_required"
    | null;
  actual_tax_amount_won: number | null;
  completion_blocker:
    | "none"
    | "documents"
    | "hometax"
    | "rules"
    | "expert"
    | null;
  feedback_submitted_at: string | null;
};

type TaxCaseDocumentRow = {
  case_id: string;
  status: "pending" | "ready";
};

type AdminInsightsSnapshot = {
  trackingRows: TrackingRow[];
  operationLeads: Array<{
    workflow_status: string;
    assigned_partner_id: string | null;
    created_at: string;
    updated_at: string;
  }>;
  taxCases: TaxCaseRow[];
  taxCaseDocuments: TaxCaseDocumentRow[];
};

function parseAdminSnapshot(value: Json | null): AdminInsightsSnapshot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const snapshot = value as Record<string, Json | undefined>;
  if (
    !Array.isArray(snapshot.trackingRows) ||
    !Array.isArray(snapshot.operationLeads) ||
    !Array.isArray(snapshot.taxCases) ||
    !Array.isArray(snapshot.taxCaseDocuments)
  ) {
    return null;
  }
  return snapshot as unknown as AdminInsightsSnapshot;
}

function asPayload(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getString(payload: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

function getNumber(payload: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

function increment(map: Map<string, number>, key: string | null, by = 1) {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + by);
}

function kstDay(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}

function rollingDays(count: number) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const days: string[] = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    days.push(formatter.format(d));
  }
  return days;
}

function topEntries(map: Map<string, number>, limit: number) {
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function ensureCalculator(map: Map<string, CalculatorInsight>, type: string) {
  if (!map.has(type)) {
    map.set(type, {
      calculatorType: type,
      resultViews: 0,
      summaryCopies: 0,
      linkCopies: 0,
      ctaClicks: 0,
      leadSubmits: 0,
    });
  }
  return map.get(type)!;
}

function ensureSituation(map: Map<string, SituationInsight>, id: string) {
  if (!map.has(id)) {
    map.set(id, {
      situationId: id,
      pageViews: 0,
      calculatorClicks: 0,
      expertCheckClicks: 0,
      regionClicks: 0,
      leadSubmits: 0,
    });
  }
  return map.get(id)!;
}

function ensureBlog(map: Map<string, BlogInsight>, slug: string) {
  if (!map.has(slug)) {
    map.set(slug, {
      blogSlug: slug,
      calculatorClicks: 0,
      consultClicks: 0,
      totalClicks: 0,
      topCalculatorType: null,
    });
  }
  return map.get(slug)!;
}

function ensureIndustry(map: Map<string, IndustryInsight>, profile: string) {
  if (!map.has(profile)) {
    map.set(profile, {
      profile,
      resultViews: 0,
      ctaClicks: 0,
      highCount: 0,
      midCount: 0,
      lowCount: 0,
      scoreTotal: 0,
      avgScore: 0,
    });
  }
  return map.get(profile)!;
}

export async function GET(req: Request) {
  const admin = await getAdminUserFromRequest(req);
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authHeader = req.headers.get("authorization");
  if (!url || !anon || !authHeader) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const supabase = createClient<Database>(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authHeader } },
  });

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: snapshotData, error } = await supabase.rpc(
    "api_admin_insights_snapshot_v1",
    { p_since: since.toISOString() },
  );
  const snapshot = parseAdminSnapshot(snapshotData);
  if (error || !snapshot) {
    return NextResponse.json(
      { error: error?.message ?? "invalid_admin_snapshot" },
      { status: 500 },
    );
  }

  const operations = snapshot.operationLeads;
  const assignedCount = operations.filter((lead) => lead.assigned_partner_id || lead.workflow_status !== "new").length;
  const contactedCount = operations.filter((lead) => ["contacted", "consulting", "completed", "closed"].includes(lead.workflow_status)).length;
  const completedCount = operations.filter((lead) => lead.workflow_status === "completed").length;
  const overdueCount = operations.filter((lead) => {
    const age = Date.now() - new Date(lead.updated_at).getTime();
    if (["new", "assigned"].includes(lead.workflow_status)) return age > 2 * 60 * 60 * 1000;
    if (["contacted", "consulting"].includes(lead.workflow_status)) return age > 24 * 60 * 60 * 1000;
    return false;
  }).length;

  const rows = snapshot.trackingRows.filter((row) => {
    const payload = asPayload(row.payload);
    if (payload.isTestTraffic === true) return false;
    return ![
      payload.path,
      payload.sourcePath,
      payload.visitorId,
      payload.visitor_id,
      payload.sessionId,
      payload.session_id,
      payload.referrer,
    ].some(isLikelyTestValue);
  });

  const taxCases = snapshot.taxCases.filter(
    (taxCase) => !isLikelyTestValue(taxCase.source_path),
  );
  const taxCaseIds = new Set(taxCases.map((taxCase) => taxCase.id));
  const documentsByCase = new Map<string, { total: number; ready: number }>();
  for (const document of snapshot.taxCaseDocuments) {
    if (!taxCaseIds.has(document.case_id)) continue;
    const current = documentsByCase.get(document.case_id) ?? {
      total: 0,
      ready: 0,
    };
    current.total += 1;
    if (document.status === "ready") current.ready += 1;
    documentsByCase.set(document.case_id, current);
  }

  const taxCaseTrendMap = new Map<
    string,
    {
      day: string;
      created: number;
      hometaxOpened: number;
      consultationOpened: number;
      completed: number;
    }
  >();
  for (const day of rollingDays(30)) {
    taxCaseTrendMap.set(day, {
      day,
      created: 0,
      hometaxOpened: 0,
      consultationOpened: 0,
      completed: 0,
    });
  }

  const recommendations = new Map<
    TaxCaseRow["recommendation"],
    {
      recommendation: TaxCaseRow["recommendation"];
      cases: number;
      methodSelected: number;
      professionalSelected: number;
      completed: number;
    }
  >();
  for (const recommendation of [
    "self",
    "review",
    "tax_accountant",
  ] as const) {
    recommendations.set(recommendation, {
      recommendation,
      cases: 0,
      methodSelected: 0,
      professionalSelected: 0,
      completed: 0,
    });
  }

  const complexityBands = {
    low: { band: "low", cases: 0, completed: 0 },
    mid: { band: "mid", cases: 0, completed: 0 },
    high: { band: "high", cases: 0, completed: 0 },
  };

  for (const taxCase of taxCases) {
    const createdTrend = taxCaseTrendMap.get(kstDay(taxCase.created_at));
    if (createdTrend) createdTrend.created += 1;
    if (taxCase.hometax_opened_at) {
      const actionTrend = taxCaseTrendMap.get(
        kstDay(taxCase.hometax_opened_at),
      );
      if (actionTrend) actionTrend.hometaxOpened += 1;
    }
    if (taxCase.consultation_opened_at) {
      const actionTrend = taxCaseTrendMap.get(
        kstDay(taxCase.consultation_opened_at),
      );
      if (actionTrend) actionTrend.consultationOpened += 1;
    }
    if (taxCase.filing_completed_at) {
      const completedTrend = taxCaseTrendMap.get(
        kstDay(taxCase.filing_completed_at),
      );
      if (completedTrend) completedTrend.completed += 1;
    }

    const recommendation = recommendations.get(taxCase.recommendation)!;
    recommendation.cases += 1;
    if (taxCase.filing_method !== "undecided") {
      recommendation.methodSelected += 1;
    }
    if (taxCase.filing_method === "professional") {
      recommendation.professionalSelected += 1;
    }
    if (taxCase.status === "completed") recommendation.completed += 1;

    const band =
      taxCase.complexity_score >= 62
        ? complexityBands.high
        : taxCase.complexity_score >= 34
          ? complexityBands.mid
          : complexityBands.low;
    band.cases += 1;
    if (taxCase.status === "completed") band.completed += 1;
  }

  const claimedCases = taxCases.filter((taxCase) => taxCase.user_id).length;
  const methodSelectedCases = taxCases.filter(
    (taxCase) => taxCase.filing_method !== "undecided",
  ).length;
  const directCases = taxCases.filter(
    (taxCase) => taxCase.filing_method === "direct",
  ).length;
  const professionalCases = taxCases.filter(
    (taxCase) => taxCase.filing_method === "professional",
  ).length;
  const documentsStartedCases = taxCases.filter(
    (taxCase) => (documentsByCase.get(taxCase.id)?.ready ?? 0) > 0,
  ).length;
  const documentsReadyCases = taxCases.filter((taxCase) => {
    const documents = documentsByCase.get(taxCase.id);
    return Boolean(
      documents && documents.total > 0 && documents.ready === documents.total,
    );
  }).length;
  const hometaxOpenedCases = taxCases.filter(
    (taxCase) =>
      taxCase.filing_method === "direct" && taxCase.hometax_opened_at,
  ).length;
  const consultationOpenedCases = taxCases.filter(
    (taxCase) =>
      taxCase.filing_method === "professional" &&
      taxCase.consultation_opened_at,
  ).length;
  const filingCompletedCases = taxCases.filter(
    (taxCase) => taxCase.status === "completed",
  ).length;
  const feedbackCases = taxCases.filter(
    (taxCase) => taxCase.feedback_submitted_at,
  );
  const completionOutcomes = (
    [
      "filed_self",
      "filed_professional",
      "prepared_only",
      "not_required",
    ] as const
  ).map((outcome) => ({
    outcome,
    count: feedbackCases.filter(
      (taxCase) => taxCase.completion_outcome === outcome,
    ).length,
  }));
  const completionBlockers = (
    ["none", "documents", "hometax", "rules", "expert"] as const
  ).map((blocker) => ({
    blocker,
    count: feedbackCases.filter(
      (taxCase) => taxCase.completion_blocker === blocker,
    ).length,
  }));
  const byCaseType = ([
    "vat",
    "gift",
    "solo_business",
    "pension",
    "seller",
  ] as const).map(
    (caseType) => {
      const cases = taxCases.filter(
        (taxCase) => taxCase.case_type === caseType,
      );
      return {
        caseType,
        cases: cases.length,
        claimed: cases.filter((taxCase) => taxCase.user_id).length,
        methodSelected: cases.filter(
          (taxCase) => taxCase.filing_method !== "undecided",
        ).length,
        completed: cases.filter((taxCase) => taxCase.status === "completed")
          .length,
      };
    },
  );
  const trendMap = new Map<string, { day: string; pageViews: number; visitors: Set<string>; sessions: Set<string>; leads: number; phoneClicks: number }>();
  for (const day of rollingDays(30)) {
    trendMap.set(day, {
      day,
      pageViews: 0,
      visitors: new Set(),
      sessions: new Set(),
      leads: 0,
      phoneClicks: 0,
    });
  }

  const visitors = new Set<string>();
  const sessions = new Set<string>();
  const pageMap = new Map<string, number>();
  const sourceMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const phoneRegionMap = new Map<string, number>();
  const calculatorMap = new Map<string, CalculatorInsight>();
  const situationMap = new Map<string, SituationInsight>();
  const blogMap = new Map<string, BlogInsight>();
  const blogCalculatorCounts = new Map<string, Map<string, number>>();
  const industryMap = new Map<string, IndustryInsight>();

  let totalPageViews = 0;
  let totalPhoneClicks = 0;
  let totalResultViews = 0;
  let totalSummaryCopies = 0;
  let totalLinkCopies = 0;
  let totalCtaClicks = 0;
  let totalLeadSubmits = 0;
  let totalSituationViews = 0;

  for (const row of rows) {
    const payload = asPayload(row.payload);
    const day = kstDay(row.created_at);
    const trend = trendMap.get(day);
    const path = getString(payload, "path") ?? "(unknown)";
    const source = getString(payload, "source") ?? "unknown";
    const device = getString(payload, "device") ?? "unknown";
    const visitorId = getString(payload, "visitorId", "visitor_id");
    const sessionId = getString(payload, "sessionId", "session_id");
    const calculatorType = getString(payload, "calculator_type", "calculatorType");
    const situationId = getString(payload, "situationId", "defaultSituation", "situation");
    const target = getString(payload, "target");
    const blogSlug = getString(payload, "blog_slug", "blogSlug");
    const profile = getString(payload, "profile");
    const level = getString(payload, "level");
    const score = getNumber(payload, "score");

    if (calculatorType) ensureCalculator(calculatorMap, calculatorType);
    if (situationId) ensureSituation(situationMap, situationId);

    switch (row.event_type) {
      case "page_view":
        totalPageViews += 1;
        if (trend) {
          trend.pageViews += 1;
          if (visitorId) trend.visitors.add(visitorId);
          if (sessionId) trend.sessions.add(sessionId);
        }
        if (visitorId) visitors.add(visitorId);
        if (sessionId) sessions.add(sessionId);
        increment(pageMap, path);
        increment(sourceMap, source);
        increment(deviceMap, device);
        break;
      case "phone_click": {
        totalPhoneClicks += 1;
        if (trend) trend.phoneClicks += 1;
        const sido = getString(payload, "sido");
        const sigungu = getString(payload, "sigungu");
        increment(phoneRegionMap, sido && sigungu ? `${sido} ${sigungu}` : sido ?? sigungu);
        break;
      }
      case "calculator_result_view":
        totalResultViews += 1;
        if (calculatorType) ensureCalculator(calculatorMap, calculatorType).resultViews += 1;
        break;
      case "calculator_summary_copy":
        totalSummaryCopies += 1;
        if (calculatorType) ensureCalculator(calculatorMap, calculatorType).summaryCopies += 1;
        break;
      case "calculator_link_copy":
        totalLinkCopies += 1;
        if (calculatorType) ensureCalculator(calculatorMap, calculatorType).linkCopies += 1;
        break;
      case "calculator_cta_click":
        totalCtaClicks += 1;
        if (calculatorType) ensureCalculator(calculatorMap, calculatorType).ctaClicks += 1;
        break;
      case "blog_cta_click": {
        if (!blogSlug) break;
        const item = ensureBlog(blogMap, blogSlug);
        item.totalClicks += 1;
        if (target === "calculator") item.calculatorClicks += 1;
        if (target === "consult") item.consultClicks += 1;
        if (calculatorType) {
          if (!blogCalculatorCounts.has(blogSlug)) {
            blogCalculatorCounts.set(blogSlug, new Map());
          }
          increment(blogCalculatorCounts.get(blogSlug)!, calculatorType);
        }
        break;
      }
      case "industry_diagnosis_result_view": {
        if (!profile) break;
        const item = ensureIndustry(industryMap, profile);
        item.resultViews += 1;
        if (score != null) item.scoreTotal += score;
        if (level === "high") item.highCount += 1;
        else if (level === "mid") item.midCount += 1;
        else item.lowCount += 1;
        break;
      }
      case "industry_diagnosis_cta_click": {
        if (!profile) break;
        ensureIndustry(industryMap, profile).ctaClicks += 1;
        break;
      }
      case "lead_submit":
        totalLeadSubmits += 1;
        if (trend) trend.leads += 1;
        if (situationId) ensureSituation(situationMap, situationId).leadSubmits += 1;
        if (calculatorType) ensureCalculator(calculatorMap, calculatorType).leadSubmits += 1;
        break;
      case "situation_page_view":
        totalSituationViews += 1;
        if (situationId) ensureSituation(situationMap, situationId).pageViews += 1;
        break;
      case "situation_cta_click":
        if (situationId && target) {
          const item = ensureSituation(situationMap, situationId);
          if (target === "calculator") item.calculatorClicks += 1;
          if (target === "expert_check") item.expertCheckClicks += 1;
          if (target === "region") item.regionClicks += 1;
        }
        break;
      default:
        break;
    }
  }

  return NextResponse.json({
    period: {
      days: 30,
      since: since.toISOString(),
      timezone: "Asia/Seoul",
    },
    totals: {
      totalPageViews,
      totalVisitors: visitors.size,
      totalSessions: sessions.size,
      totalPhoneClicks,
      totalResultViews,
      totalSummaryCopies,
      totalLinkCopies,
      totalCtaClicks,
      totalLeadSubmits,
      totalSituationViews,
    },
    leadOperations: {
      submitted: operations.length,
      assigned: assignedCount,
      contacted: contactedCount,
      completed: completedCount,
      overdue: overdueCount,
    },
    taxCaseFunnel: {
      cohort: taxCases.length,
      claimed: claimedCases,
      methodSelected: methodSelectedCases,
      documentsStarted: documentsStartedCases,
      documentsReady: documentsReadyCases,
      completed: filingCompletedCases,
      direct: {
        selected: directCases,
        hometaxOpened: hometaxOpenedCases,
        completed: taxCases.filter(
          (taxCase) =>
            taxCase.filing_method === "direct" &&
            taxCase.status === "completed",
        ).length,
      },
      professional: {
        selected: professionalCases,
        consultationOpened: consultationOpenedCases,
        completed: taxCases.filter(
          (taxCase) =>
            taxCase.filing_method === "professional" &&
            taxCase.status === "completed",
        ).length,
      },
      byRecommendation: Array.from(recommendations.values()),
      byComplexity: Object.values(complexityBands),
      byCaseType,
      feedback: {
        submitted: feedbackCases.length,
        actualAmountProvided: feedbackCases.filter(
          (taxCase) => taxCase.actual_tax_amount_won != null,
        ).length,
        byOutcome: completionOutcomes,
        byBlocker: completionBlockers,
      },
      trend: Array.from(taxCaseTrendMap.values()),
      excludedTestTraffic: snapshot.taxCases.length - taxCases.length,
    },
    trend: Array.from(trendMap.values()).map((item) => ({
      day: item.day,
      pageViews: item.pageViews,
      visitors: item.visitors.size,
      sessions: item.sessions.size,
      leads: item.leads,
      phoneClicks: item.phoneClicks,
    })),
    topPages: topEntries(pageMap, 12).map(({ key, count }) => ({ path: key, pageViews: count })),
    sources: topEntries(sourceMap, 8).map(({ key, count }) => ({ source: key, pageViews: count })),
    devices: topEntries(deviceMap, 5).map(({ key, count }) => ({ device: key, pageViews: count })),
    phoneRegions: topEntries(phoneRegionMap, 10).map(({ key, count }) => ({ region: key, phoneClicks: count })),
    calculators: Array.from(calculatorMap.values()).sort((a, b) => b.resultViews - a.resultViews),
    situations: Array.from(situationMap.values()).sort((a, b) => b.pageViews - a.pageViews),
    blogs: Array.from(blogMap.values())
      .map((item) => {
        const topCalculatorType =
          topEntries(blogCalculatorCounts.get(item.blogSlug) ?? new Map(), 1)[0]?.key ?? null;
        return { ...item, topCalculatorType };
      })
      .sort((a, b) => b.totalClicks - a.totalClicks),
    industries: Array.from(industryMap.values())
      .map((item) => ({
        ...item,
        avgScore: item.resultViews > 0 ? Math.round((item.scoreTotal / item.resultViews) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.resultViews - a.resultViews),
  });
}
