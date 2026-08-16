"use client";

import { ArrowUpRight, House } from "lucide-react";
import { trackSiteEvent } from "@/lib/site-track";

type HomeAtozPlacement =
  | "acquisition_tax_result"
  | "transfer_tax_result"
  | "inheritance_gift_result";

const COPY: Record<
  HomeAtozPlacement,
  { eyebrow: string; title: string; description: string; label: string }
> = {
  acquisition_tax_result: {
    eyebrow: "세금 계산 다음 단계",
    title: "집 구매 준비도 이어서 확인하세요",
    description: "계약 전 점검부터 대출·법무·이사 준비까지 Home-AtoZ에서 연결해서 볼 수 있어요.",
    label: "집 구매 준비 확인하기",
  },
  transfer_tax_result: {
    eyebrow: "매도 이후도 함께 준비",
    title: "매도 후 주거 계획을 이어서 확인하세요",
    description: "새 집 계약, 대출, 법무와 이사 준비를 Home-AtoZ에서 한 번에 점검할 수 있어요.",
    label: "주거 계획 이어서 보기",
  },
  inheritance_gift_result: {
    eyebrow: "상속·증여 자산에 집이 포함되어 있다면",
    title: "집의 관리와 다음 절차도 확인하세요",
    description: "부동산 계약·법무·대출·이사 관련 다음 행동을 Home-AtoZ에서 살펴볼 수 있어요.",
    label: "상속받은 집 관리 항목 보기",
  },
};

export function HomeAtozCta({ placement }: { placement: HomeAtozPlacement }) {
  const copy = COPY[placement];
  const href = `https://home-atoz.kr/?utm_source=findtax&utm_medium=referral&utm_campaign=service_crosslink&utm_content=${placement}`;

  return (
    <section className="border-y border-line py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF8DF] text-[#2F641D]" aria-hidden>
            <House size={20} />
          </span>
          <div>
            <p className="text-xs font-bold text-positive-deep">{copy.eyebrow}</p>
            <h3 className="mt-1 text-base font-bold text-ink">{copy.title}</h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-ink-muted">{copy.description}</p>
          </div>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() =>
            trackSiteEvent("cross_service_click", {
              destination: "home-atoz",
              placement,
              path: window.location.pathname,
            })
          }
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#78C850] bg-white px-4 text-sm font-bold text-[#2F641D] transition-colors hover:bg-[#F2FBEA]"
        >
          {copy.label}
          <ArrowUpRight size={16} aria-hidden />
        </a>
      </div>
      <p className="mt-3 text-right text-[11px] text-ink-soft">Home-AtoZ에서 제공</p>
    </section>
  );
}
