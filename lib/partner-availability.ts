import { createServerClient } from "@/lib/supabase";

/**
 * 승인된 파트너 세무사가 한 명도 없는지. 조회에 실패하면 false(=대체 광고 미노출)로 본다.
 * 블로그는 정적 생성이라 배포 시점 기준으로 반영된다.
 */
export async function hasNoApprovedPartners(): Promise<boolean> {
  const client = createServerClient();
  if (!client) return false;
  const { data, error } = await client.rpc("rpc_public_site_stats");
  if (error || !data || typeof data !== "object") return false;
  const approved = (data as Record<string, unknown>).partners_approved;
  return approved === 0;
}
