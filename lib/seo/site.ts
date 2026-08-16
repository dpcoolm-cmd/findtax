export const siteName = "findtax.kr";

export const siteDescription =
  "지역별 세무사 검색, 상담 신청, 세무 리드 매칭. 가까운 세무사를 찾고 바로 상담을 요청하세요.";

export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://example.com"
  );
}
