import type { Database } from "@/types/database";
import { createServerClient } from "@/lib/supabase";

export type TaxAccountantRow =
  Database["public"]["Tables"]["tax_accountants"]["Row"];

export const NO_ACCOUNTANTS_FALLBACK_MESSAGE =
  "현재 등록된 세무사가 없습니다. 무료 상담 신청을 통해 연결해드립니다.";

export interface ListTaxAccountantsFilters {
  sido?: string;
  sigungu?: string;
  limit?: number;
}

export interface ListTaxAccountantsResult {
  accountants: TaxAccountantRow[];
  isEmpty: boolean;
  emptyMessage: string | null;
  error: string | null;
}

function tierRank(row: TaxAccountantRow): number {
  const t = (row.tier ?? "").toLowerCase();
  if (t === "premium") return 1;
  if (t === "standard") return 2;
  if (row.is_premium) return 1;
  return 3;
}

/** premium → standard → free, 동순위는 리뷰 수·사무소명 */
export function sortAccountantsByTierReviewName(
  rows: TaxAccountantRow[],
): TaxAccountantRow[] {
  return [...rows].sort((a, b) => {
    const td = tierRank(a) - tierRank(b);
    if (td !== 0) return td;
    const ac = a.review_count ?? 0;
    const bc = b.review_count ?? 0;
    if (bc !== ac) return bc - ac;
    return (a.office_name ?? "").localeCompare(b.office_name ?? "", "ko");
  });
}

export async function listTaxAccountants(
  filters: ListTaxAccountantsFilters = {},
): Promise<ListTaxAccountantsResult> {
  const client = createServerClient();
  if (!client) {
    return {
      accountants: [],
      isEmpty: true,
      emptyMessage: NO_ACCOUNTANTS_FALLBACK_MESSAGE,
      error: "supabase_not_configured",
    };
  }

  let q = client
    .from("tax_accountants")
    .select("*")
    .eq("is_active", true);

  if (filters.sido) q = q.eq("sido", filters.sido);
  if (filters.sigungu) q = q.eq("sigungu", filters.sigungu);

  const { data, error } = await q;

  if (error) {
    return {
      accountants: [],
      isEmpty: true,
      emptyMessage: NO_ACCOUNTANTS_FALLBACK_MESSAGE,
      error: error.message,
    };
  }

  let rows = sortAccountantsByTierReviewName(data ?? []);
  if (filters.limit != null) {
    rows = rows.slice(0, filters.limit);
  }

  const isEmpty = rows.length === 0;
  return {
    accountants: rows,
    isEmpty,
    emptyMessage: isEmpty ? NO_ACCOUNTANTS_FALLBACK_MESSAGE : null,
    error: null,
  };
}

export async function listActiveRegionPairs(): Promise<
  { sido: string; sigungu: string }[]
> {
  const client = createServerClient();
  if (!client) return [];

  const seen = new Set<string>();
  const rows: { sido: string; sigungu: string }[] = [];
  const pageSize = 1000;

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("tax_accountants")
      .select("sido,sigungu")
      .eq("is_active", true)
      .range(from, from + pageSize - 1);

    if (error || !data) return rows;
    if (data.length === 0) break;

    for (const row of data) {
      if (typeof row.sido !== "string" || typeof row.sigungu !== "string") continue;
      const key = `${row.sido}::${row.sigungu}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({ sido: row.sido, sigungu: row.sigungu });
    }

    if (data.length < pageSize) break;
  }

  return rows;
}

export async function listAccountantSlugParams(): Promise<
  { sido: string; sigungu: string; id: string }[]
> {
  const client = createServerClient();
  if (!client) return [];
  const { data, error } = await client
    .from("tax_accountants")
    .select("slug,sido,sigungu")
    .eq("is_active", true);
  if (error || !data) return [];
  return data
    .filter(
      (row) =>
        typeof row.sido === "string" &&
        typeof row.sigungu === "string" &&
        typeof row.slug === "string",
    )
    .map((row) => ({
      sido: row.sido,
      sigungu: row.sigungu,
      id: row.slug,
    }));
}

export async function listTaxAccountantProfileIds(): Promise<{ id: string }[]> {
  const client = createServerClient();
  if (!client) return [];
  const { data, error } = await client
    .from("tax_accountants")
    .select("id")
    .eq("is_active", true);
  if (error || !data) return [];
  return data
    .map((r) => r.id)
    .filter((id): id is string => typeof id === "string" && id.length > 0)
    .map((id) => ({ id }));
}

export async function getTaxAccountantBySlug(
  slug: string,
): Promise<{ accountant: TaxAccountantRow | null; error: string | null }> {
  const client = createServerClient();
  if (!client) {
    return { accountant: null, error: "supabase_not_configured" };
  }

  const { data, error } = await client
    .from("tax_accountants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return { accountant: null, error: error.message };
  return { accountant: data, error: null };
}

export async function getTaxAccountantById(
  id: string,
): Promise<{ accountant: TaxAccountantRow | null; error: string | null }> {
  const client = createServerClient();
  if (!client) {
    return { accountant: null, error: "supabase_not_configured" };
  }

  const { data, error } = await client
    .from("tax_accountants")
    .select("*")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) return { accountant: null, error: error.message };
  return { accountant: data, error: null };
}
