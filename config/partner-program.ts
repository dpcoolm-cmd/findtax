/**
 * 파트너·파운더스·추천 포인트 등 **앱·표시** 기준.
 *
 * 실제 지급·차감 금액은 Supabase RPC/마이그레이션과 맞춰야 합니다.
 * (예: `rpc_partner_onboarding`, `rpc_public_founder_stats`, `20260418210000_founder_open_beta.sql`)
 * 숫자를 바꿀 때는 SQL 쪽 동일 상수를 함께 수정하세요.
 */

/** 파운더스 멤버 상한(선착순) — RPC `rpc_public_founder_stats`의 cap과 동기 */
export const FOUNDING_PARTNER_MEMBER_CAP = 20;
