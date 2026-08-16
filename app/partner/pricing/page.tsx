import Link from "next/link";
import type { Metadata } from "next";
import { PartnerPricingPlans } from "@/components/PartnerPricingPlans";

export const metadata: Metadata = {
  title: "파트너 요금제",
  description:
    "findtax.kr 파트너 비용 구조: 고정비 없이 리드 열람 시에만 포인트 차감. 오픈베타 파운더는 열람 무료 혜택이 제공됩니다.",
  robots: { index: false, follow: false },
};

export default function PartnerPricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-neutral-600">
        <Link href="/" className="hover:text-brand">
          홈
        </Link>
        <span className="mx-2">/</span>
        <Link href="/partner/dashboard" className="hover:text-brand">
          파트너
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-900">요금제</span>
      </nav>
      <h1 className="mt-4 text-2xl font-bold text-brand-dark sm:text-3xl">파트너 요금제</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        고정 광고비 없이, 상담 리드의 연락처를 열람할 때만 포인트가 차감되는 구조입니다.
      </p>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border-2 border-brand bg-brand/10 p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-dark">
            오픈베타 파운더 · 선착 20명
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">지금 승인되면 리드 열람 무료</h2>
          <ul className="mt-4 space-y-2 text-sm text-neutral-700">
            <li>· 파운더 기간 동안 리드 연락처 열람 포인트 차감 없음</li>
            <li>· 파운더 종료 후에도 1년간 열람 단가 20% 할인</li>
            <li>· 지역 페이지 &lsquo;FindTax 인증 파트너&rsquo; 섹션 노출</li>
          </ul>
          <Link
            href="/register"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand px-5 py-3 text-sm font-bold text-ink hover:bg-brand-light"
          >
            파운더로 입점 신청하기
          </Link>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            기본 구조 · 건별 열람
          </p>
          <h2 className="mt-2 text-xl font-bold text-ink">쓴 만큼만, 리드 단위 포인트</h2>
          <ul className="mt-4 space-y-2 text-sm text-neutral-700">
            <li>· 일반 상담 리드 열람: 10,000P</li>
            <li>· 자산(상속·증여·부동산) 리드 열람: 30,000P</li>
            <li>· 기장 리드 열람: 40,000P</li>
            <li>· 배정만 받고 열람하지 않으면 과금 없음</li>
          </ul>
          <p className="mt-4 text-xs text-neutral-500">
            단가는 운영 상황에 따라 조정될 수 있으며, 변경 시 사전 안내합니다.
          </p>
        </div>
      </section>

      <h2 className="mt-12 text-lg font-bold text-ink">정식 구독 플랜 (준비 중)</h2>
      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
        월 구독형 플랜은 준비 중입니다. 관심 플랜을 선택하면 출시 시 우선 안내드립니다.
      </p>
      <div className="mt-6">
        <PartnerPricingPlans />
      </div>
      <p className="mt-10 text-center text-sm text-neutral-600">
        <Link href="/partner/apply" className="font-medium text-brand hover:underline">
          파트너 입점 신청
        </Link>
        <span className="mx-2">·</span>
        <Link href="/partner/dashboard" className="font-medium text-brand hover:underline">
          대시보드
        </Link>
      </p>
    </div>
  );
}
