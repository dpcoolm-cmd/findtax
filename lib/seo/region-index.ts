import { createServerClient } from "@/lib/supabase";
import { REGION_INDEX_MIN_OFFICES } from "@/lib/seo/region-insights";

export type RegionOfficeCount = { sido: string; sigungu: string; offices: number };

/** 시·군·구별 사무소 수(사무소명+주소 중복 제거). 사이트맵·시도 페이지에서 쓴다. */
export async function listRegionOfficeCounts(): Promise<RegionOfficeCount[]> {
  const client = createServerClient();
  if (!client) return [];
  const offices = new Map<string, Set<string>>();
  const pageSize = 1000;
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from("tax_accountants")
      .select("sido,sigungu,office_name,address")
      .eq("is_active", true)
      .order("id")
      .range(from, from + pageSize - 1);
    if (error || !data) break;
    for (const row of data) {
      if (typeof row.sido !== "string" || typeof row.sigungu !== "string") continue;
      const key = `${row.sido}::${row.sigungu}`;
      const office = `${(row.office_name ?? "").trim()}|${(row.address ?? "").trim()}`;
      if (!offices.has(key)) offices.set(key, new Set());
      offices.get(key)!.add(office);
    }
    if (data.length < pageSize) break;
  }
  return [...offices.entries()].map(([key, set]) => {
    const [sido, sigungu] = key.split("::");
    return { sido, sigungu, offices: set.size };
  });
}

export async function listIndexableRegions(): Promise<RegionOfficeCount[]> {
  return (await listRegionOfficeCounts()).filter((r) => r.offices >= REGION_INDEX_MIN_OFFICES);
}
