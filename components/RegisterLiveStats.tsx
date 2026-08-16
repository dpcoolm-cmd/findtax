"use client";

import { useEffect, useState } from "react";

interface PublicStats {
  calcUses30d: number | null;
  leadsTotal: number | null;
  accountantsTotal: number | null;
  partnersApproved: number | null;
}

/**
 * /register 히어로 아래 실측 지표 스트립.
 * 원칙: 지어낸 숫자 금지. 실데이터가 임계치 이상일 때만 숫자를 보여주고,
 * 아직 작으면 "초기 선점" 프레임(파트너 0~소수 = 상단 고정 기회)을 보여준다.
 */
export function RegisterLiveStats() {
  const [stats, setStats] = useState<PublicStats | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/public-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setStats(d);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (!stats) return null;

  const items: { value: string; label: string }[] = [];

  if (stats.accountantsTotal != null && stats.accountantsTotal >= 1000) {
    items.push({
      value: `${Math.floor(stats.accountantsTotal / 1000).toLocaleString("ko-KR")},000+`,
      label: "전국 세무사 공개 데이터",
    });
  }
  if (stats.calcUses30d != null && stats.calcUses30d >= 100) {
    items.push({
      value: stats.calcUses30d.toLocaleString("ko-KR"),
      label: "최근 30일 계산기 사용",
    });
  }
  if (stats.leadsTotal != null && stats.leadsTotal >= 50) {
    items.push({
      value: stats.leadsTotal.toLocaleString("ko-KR"),
      label: "누적 상담 신청",
    });
  }

  const fewPartners = stats.partnersApproved != null && stats.partnersApproved < 20;

  if (items.length === 0 && !fewPartners) return null;

  return (
    <div className="mx-auto mt-8 max-w-2xl space-y-3">
      {items.length > 0 ? (
        <div className={`grid gap-3 ${items.length === 1 ? "grid-cols-1" : items.length === 2 ? "grid-cols-2" : "grid-cols-3"}`}>
          {items.map((it) => (
            <div key={it.label} className="rounded-xl border border-line bg-white p-4 text-center shadow-card">
              <p className="text-2xl font-bold tabular-nums text-ink">{it.value}</p>
              <p className="mt-1 text-xs text-ink-soft">{it.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {fewPartners ? (
        <div className="rounded-xl border border-brand bg-brand/10 px-4 py-3 text-center">
          <p className="text-sm font-bold text-brand-dark">
            지금은 인증 파트너 자리가 거의 비어 있습니다.
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            승인된 파트너는 지역 페이지 최상단 &lsquo;FindTax 인증 파트너&rsquo; 섹션에 노출됩니다.
            내 지역 1호 파트너가 되면 해당 지역 상담 수요를 우선 배정받습니다.
          </p>
        </div>
      ) : null}
    </div>
  );
}
