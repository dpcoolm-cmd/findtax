"use client";

import { useState } from "react";
import { PartnerPricingWaitlistModal } from "@/components/PartnerPricingWaitlistModal";

type PlanKey = "starter" | "basic" | "pro";

const PLANS: {
  key: PlanKey;
  name: string;
  price: string;
  badge?: string;
  bullets: string[];
}[] = [
  {
    key: "starter",
    name: "Starter",
    price: "무료 (Founding Partner 한정)",
    bullets: [
      "리드 20개 무료",
      "이후 건당 결제",
      "우선 배정 혜택",
    ],
  },
  {
    key: "basic",
    name: "Basic",
    price: "월 99,000원",
    bullets: [
      "월 리드 10개 포함",
      "추가 리드 건당 20% 할인",
      "내 지역 신규 상담 알림",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    price: "월 199,000원",
    bullets: [
      "월 리드 30개 포함",
      "추가 리드 건당 30% 할인",
      "프리미엄 리드 우선 배정",
      "프로필 상단 노출",
    ],
  },
];

export function PartnerPricingPlans() {
  const [modal, setModal] = useState<{ key: PlanKey; label: string } | null>(null);

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.key}
            className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-bold text-neutral-900">{p.name}</h2>
            <p className="mt-1 text-sm font-semibold text-brand">{p.price}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-neutral-700">
              {p.bullets.map((b) => (
                <li key={b} className="flex gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="mt-6 w-full rounded-xl border border-brand bg-white py-3 text-sm font-semibold text-brand hover:bg-brand-light/40"
              onClick={() => setModal({ key: p.key, label: p.name })}
            >
              준비 중 — 출시 알림 받기
            </button>
          </div>
        ))}
      </div>

      <PartnerPricingWaitlistModal
        planKey={modal?.key ?? "starter"}
        planLabel={modal?.label ?? ""}
        open={modal != null}
        onClose={() => setModal(null)}
      />
    </>
  );
}
