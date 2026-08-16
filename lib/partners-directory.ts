import { createServerClient } from "@/lib/supabase";

/**
 * 공개 디렉터리에 노출되는 "FindTax 인증 파트너".
 * partners 테이블의 안전 컬럼만 RPC(rpc_public_list_partners)로 받아온다.
 * 민감정보(points·user_id·license 등)는 RPC에서 제외되어 절대 노출되지 않는다.
 */
export interface VerifiedPartner {
  id: string;
  officeName: string;
  representativeName: string | null;
  sido: string;
  sigungu: string;
  specialties: string[];
  isFounder: boolean;
}

export async function listVerifiedPartners(filters: {
  sido: string;
  sigungu?: string;
}): Promise<VerifiedPartner[]> {
  const client = createServerClient();
  if (!client) return [];

  const { data, error } = await client.rpc("rpc_public_list_partners", {
    p_sido: filters.sido,
    p_sigungu: filters.sigungu ?? null,
  });

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    officeName: row.office_name,
    representativeName: row.representative_name ?? null,
    sido: row.sido,
    sigungu: row.sigungu,
    specialties: Array.isArray(row.specialties) ? row.specialties : [],
    isFounder: !!row.is_founder,
  }));
}
