"use client";

import { useEffect, useState } from "react";

export function HeroAnimation() {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    // 카드 3장이 모두 내려온 뒤(1.2s + 0.55s) 프로그레스바 시작
    const t = setTimeout(() => setBarWidth(82), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex flex-col gap-4 py-4 pl-3 pr-6 md:py-6">
      {/* Card 1 — 맨 위, 약간 왼쪽 */}
      <div
        className="self-start w-[88%] rounded-2xl border p-5 shadow-soft"
        style={{
          backgroundColor: "#F5F0E8",
          borderColor: "#E8E0D0",
          animation: "card-drop-in 0.55s cubic-bezier(0.22,1,0.36,1) 0.2s both",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7f8793" }}>
          종합소득세 예상 세액
        </p>
        <p className="mt-2 text-2xl font-bold" style={{ color: "#1D1B18" }}>
          3,240,000<span className="text-base font-medium">원</span>
        </p>
        <p className="mt-1.5 text-sm font-semibold" style={{ color: "#2f7a4f" }}>
          절세 가능 금액 820,000원 ↓
        </p>
      </div>

      {/* Card 2 — 중간 */}
      <div
        className="self-center w-[92%] rounded-2xl p-5 shadow-soft"
        style={{
          backgroundColor: "#1C3829",
          animation: "card-drop-in 0.55s cubic-bezier(0.22,1,0.36,1) 0.7s both",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
          세무사 상담 완료
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#C9A84C] text-xs font-bold text-[#1C3829]"
            style={{
              animation: "check-pop 0.4s cubic-bezier(0.22,1,0.36,1) 1.5s both",
            }}
          >
            ✓
          </span>
          <p className="text-base font-semibold text-white">최적 절세 구조 확인됨</p>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[#C9A84C]"
            style={{
              width: `${barWidth}%`,
              transition: "width 1.4s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-white/40">절세율 82%</p>
      </div>

      {/* Card 3 — 맨 아래, 약간 오른쪽 */}
      <div
        className="self-end w-[88%] rounded-2xl border bg-white p-5 shadow-soft"
        style={{
          borderColor: "#E8E0D0",
          animation: "card-drop-in 0.55s cubic-bezier(0.22,1,0.36,1) 1.2s both",
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#7f8793" }}>
          예상 환급액
        </p>
        <p
          className="mt-2 text-2xl font-bold"
          style={{ color: "#C9A84C" }}
        >
          1,240,000<span className="text-base font-medium">원</span>
        </p>
        <p className="mt-1.5 text-xs" style={{ color: "#7f8793" }}>
          신고 전 세무사 검토 후 확정됩니다
        </p>
      </div>
    </div>
  );
}
