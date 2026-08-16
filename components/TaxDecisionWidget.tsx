"use client";

import Link from "next/link";
import { ArrowRight, Building2, Calculator, Check, MapPin } from "lucide-react";
import { useState } from "react";
import { calculatorPath, regionSidoPath } from "@/lib/seo/urls";

const OPTIONS = [
  {
    id: "business",
    label: "1인사업자·부업 소득이 있어요",
    description: "부가세·종소세·원천세와 다음 신고 일정을 정리합니다.",
    href: calculatorPath("1인사업자"),
    cta: "내 사업 세금 정리하기",
  },
  {
    id: "seller",
    label: "온라인·글로벌 판매를 하고 있어요",
    description: "스마트스토어·구매대행·역직구의 증빙과 세금 위험도를 진단합니다.",
    href: "/calculator#industry-diagnosis",
    cta: "셀러 세금 진단하기",
  },
  {
    id: "gift",
    label: "가족에게 증여할 계획이에요",
    description: "10년 공제 한도와 예상 세금, 신고기한을 확인합니다.",
    href: calculatorPath("증여세"),
    cta: "증여 계획 확인하기",
  },
] as const;

export function TaxDecisionWidget() {
  const [selected, setSelected] = useState<(typeof OPTIONS)[number]["id"]>("business");
  const current = OPTIONS.find((option) => option.id === selected) ?? OPTIONS[0];

  return (
    <div className="rounded-lg border border-line bg-white p-5 shadow-card sm:p-7">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-ink-soft">바로 시작하기</p>
          <h2 className="mt-1 text-2xl font-black text-ink">내 상황부터 선택하세요.</h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-accent text-brand-dark">
          <Calculator size={21} />
        </span>
      </div>

      <div className="mt-6 space-y-2" role="radiogroup" aria-label="세금 상황 선택">
        {OPTIONS.map((option) => {
          const active = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setSelected(option.id)}
              className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition ${
                active
                  ? "border-line-strong bg-brand-accent/50"
                  : "border-line bg-white hover:border-ink-soft hover:bg-surface-muted"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  active ? "bg-ink text-brand" : "bg-bg-muted text-transparent"
                }`}
              >
                <Check size={14} strokeWidth={3} />
              </span>
              <span className="text-sm font-semibold text-ink">{option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-lg bg-primary p-5 text-white">
        <p className="text-sm leading-6 text-white/65">{current.description}</p>
        <Link
          href={current.href}
          className="mt-4 flex min-h-12 items-center justify-between rounded-lg bg-brand px-4 text-sm font-bold text-brand-dark hover:bg-brand-light"
        >
          {current.cta}
          <ArrowRight size={18} />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={regionSidoPath("서울특별시")}
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg bg-bg-muted px-3 text-sm font-semibold text-ink"
        >
          <MapPin size={17} />
          지역 세무사
        </Link>
        <Link
          href="/consult"
          className="flex min-h-11 items-center justify-center gap-2 rounded-lg border border-line px-3 text-sm font-semibold text-ink"
        >
          <Building2 size={17} />
          상담 신청
        </Link>
      </div>
    </div>
  );
}
