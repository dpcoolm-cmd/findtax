import type { Database } from "@/types/database";
import { createBrowserClient, createServerClient } from "@/lib/supabase";

export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadRow = Database["public"]["Tables"]["leads"]["Row"];

export interface InsertLeadInput {
  name: string;
  phone: string;
  email?: string | null;
  sido: string;
  sigungu: string;
  situation: string;
  message?: string | null;
  targetAccountantId?: string | null;
  category?: string | null;
  businessType?: string | null;
  monthlyRevenue?: string | null;
  industry?: string | null;
  hasAccountant?: string | null;
  employeeCount?: number | null;
  leadQuality?: string | null;
}

export interface InsertLeadResult {
  lead: LeadRow | null;
  error: string | null;
}

/**
 * leads 테이블은 anon SELECT 정책이 없어 `insert().select()`가 RLS로 막힌다.
 * 그래서 서버 검증을 마친 뒤 SECURITY DEFINER RPC(rpc_submit_lead)로 삽입 + 행 반환을 처리한다.
 */
function toRpcArgs(
  input: InsertLeadInput,
): Database["public"]["Functions"]["rpc_submit_lead"]["Args"] {
  const isBookkeeping = input.situation === "bookkeeping";
  return {
    p_name: input.name.trim(),
    p_phone: input.phone.trim(),
    p_email: input.email?.trim() || null,
    p_sido: input.sido,
    p_sigungu: input.sigungu,
    p_situation: input.situation,
    p_message: input.message?.trim() || null,
    p_target_accountant_id: input.targetAccountantId ?? null,
    p_category: input.category?.trim() || input.situation,
    p_business_type: isBookkeeping ? input.businessType?.trim() || null : null,
    p_monthly_revenue: isBookkeeping ? input.monthlyRevenue?.trim() || null : null,
    p_industry: isBookkeeping ? input.industry?.trim() || null : null,
    p_has_accountant: isBookkeeping ? input.hasAccountant?.trim() || null : null,
    p_employee_count: isBookkeeping ? input.employeeCount ?? null : null,
    p_lead_quality: isBookkeeping ? input.leadQuality?.trim() || null : null,
  };
}

function firstLeadRow(data: LeadRow[] | LeadRow | null): LeadRow | null {
  if (!data) return null;
  return Array.isArray(data) ? data[0] ?? null : data;
}

export async function insertLeadServer(
  input: InsertLeadInput,
): Promise<InsertLeadResult> {
  const client = createServerClient();
  if (!client) {
    return { lead: null, error: "supabase_not_configured" };
  }

  const { data, error } = await client.rpc("rpc_submit_lead", toRpcArgs(input));
  if (error) return { lead: null, error: error.message };
  const lead = firstLeadRow(data);
  return { lead, error: lead ? null : "insert_failed" };
}

export async function insertLeadBrowser(
  input: InsertLeadInput,
): Promise<InsertLeadResult> {
  const client = createBrowserClient();
  const { data, error } = await client.rpc("rpc_submit_lead", toRpcArgs(input));
  if (error) return { lead: null, error: error.message };
  const lead = firstLeadRow(data);
  return { lead, error: lead ? null : "insert_failed" };
}
