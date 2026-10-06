import type { TaxAccountantRow } from "@/lib/tax-accountants";

/** 색인 허용 기준: 공개 등록 사무소가 이 수 이상인 시·군·구만 검색에 노출한다(목록이 얇은 페이지 제외). */
export const REGION_INDEX_MIN_OFFICES = 5;

export type RegionSummary = {
  /** 공개 등록 세무사 수(행 기준) */
  accountantCount: number;
  /** 사무소 수(사무소명+주소 중복 제거) */
  officeCount: number;
  /** 사무소가 많은 법정동 상위 목록 */
  topDongs: { dong: string; offices: number }[];
};

/** "…(풍납동,선무빌딩)" 같은 도로명 주소 괄호 안의 법정동을 뽑는다. */
export function extractDong(address: string | null): string | null {
  if (!address) return null;
  const inParen = address.match(/\(([^,()]+?(?:동|가|읍|면|리))(?:[,)])/);
  if (inParen) return inParen[1].trim();
  const plain = address.match(/\s([가-힣0-9]+(?:동|읍|면))(?:\s|$)/);
  return plain ? plain[1] : null;
}

export function summarizeRegion(rows: TaxAccountantRow[], topN = 5): RegionSummary {
  const offices = new Map<string, string | null>();
  for (const row of rows) {
    const key = `${(row.office_name ?? "").trim()}|${(row.address ?? "").trim()}`;
    if (!offices.has(key)) offices.set(key, extractDong(row.address));
  }
  const dongCounts = new Map<string, number>();
  for (const dong of offices.values()) {
    if (!dong) continue;
    dongCounts.set(dong, (dongCounts.get(dong) ?? 0) + 1);
  }
  const topDongs = [...dongCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ko"))
    .slice(0, topN)
    .map(([dong, count]) => ({ dong, offices: count }));
  return { accountantCount: rows.length, officeCount: offices.size, topDongs };
}

export function isRegionIndexable(summary: Pick<RegionSummary, "officeCount">): boolean {
  return summary.officeCount >= REGION_INDEX_MIN_OFFICES;
}
