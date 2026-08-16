"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useLeadExperience } from "@/components/lead-experience-context";

export function LeadSectionTrigger() {
  const { open } = useLeadExperience();

  return (
    <section
      id="consult-section"
      className="grid gap-8 rounded-lg bg-primary px-6 py-10 text-white md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:px-10 md:py-12"
    >
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-brand">
          <ShieldCheck size={15} />
          상담 전 마지막 확인
        </span>
        <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-white md:text-5xl">
          계산만으로 애매하다면,
          <br />
          전문가에게 확인하세요.
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
          상황과 지역을 남기면 상담에 필요한 내용을 정리해 적합한 세무사 연결을
          도와드립니다.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
        <button
          type="button"
          onClick={() => open({})}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-base font-bold text-brand-dark hover:bg-brand-light"
        >
          무료 상담 신청
          <ArrowRight size={18} />
        </button>
        <Link
          href="/situation/income_tax"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white hover:bg-white/15"
        >
          상황별 가이드 보기
        </Link>
      </div>
    </section>
  );
}
