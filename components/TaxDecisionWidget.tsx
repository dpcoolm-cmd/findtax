"use client";

import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, Gift, Globe2, Wallet } from "lucide-react";
import { calculatorPath } from "@/lib/seo/urls";
import { trackSiteEvent } from "@/lib/site-track";

const OPTIONS = [
  { id: "business", title: "사업·부업", detail: "1인사업자 · 프리랜서 · N잡", next: "신고할 세금 확인", href: calculatorPath("1인사업자"), icon: BriefcaseBusiness, color: "bg-brand-accent text-brand-dark" },
  { id: "seller", title: "온라인·해외 셀러", detail: "쇼핑몰 · 구매대행 · 역직구", next: "판매 유형별 진단", href: "/calculator#industry-diagnosis", icon: Globe2, color: "bg-sky-100 text-sky-900" },
  { id: "gift", title: "가족 증여", detail: "자녀 · 부모 · 배우자", next: "증여세와 신고 준비", href: calculatorPath("증여세"), icon: Gift, color: "bg-rose-100 text-rose-900" },
  { id: "retirement", title: "연금·노후", detail: "직장인 · 은퇴 준비", next: "노후 생활비 계산", href: "/calculator/retirement-income", icon: Wallet, color: "bg-amber-100 text-amber-900" },
] as const;

export function TaxDecisionWidget() {
  return (
    <nav aria-label="내 상황으로 시작하기" className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {OPTIONS.map(({ id, title, detail, next, href, icon: Icon, color }) => (
        <Link key={id} href={href}
          onClick={() => trackSiteEvent("home_entry_click", { category: id, destination: href, placement: "home_entry", path: "/" })}
          className="group flex min-w-0 items-center gap-4 rounded-lg border border-line bg-white p-5 transition-colors hover:border-primary sm:min-h-[184px] sm:flex-col sm:items-start sm:gap-0">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${color}`}><Icon size={23} aria-hidden /></span>
          <div className="min-w-0 flex-1 sm:mt-4">
            <h2 className="text-lg font-bold text-ink">{title}</h2>
            <p className="mt-1 text-xs leading-6 text-ink-muted">{detail}</p>
            <span className="mt-3 hidden text-sm font-semibold text-brand-dark sm:block">{next}</span>
          </div>
          <ArrowUpRight size={19} aria-hidden className="shrink-0 text-ink-muted sm:hidden" />
        </Link>
      ))}
    </nav>
  );
}
