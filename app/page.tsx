import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Calculator, ChevronDown } from "lucide-react";
import { JsonLd } from "@/components/JsonLd";
import { TaxDecisionWidget } from "@/components/TaxDecisionWidget";
import { getBlogArticle } from "@/lib/blog/posts";
import { faqJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";

export const revalidate = 3600;
const description = "1인사업자·부업러·온라인·글로벌 셀러가 세금과 신고 일정을 확인하고, 무료 계산기와 실무 가이드로 준비하는 FindTax입니다.";
export const metadata: Metadata = {
  title: "FindTax | 사업과 판매의 세금, 다음 할 일까지",
  description,
  alternates: { canonical: absoluteUrl("/") },
  robots: { index: true, follow: true },
  openGraph: { url: absoluteUrl("/"), title: "FindTax | 사업과 판매의 세금, 다음 할 일까지", description },
};

const STARTER_GUIDES = [
  { slug: "부가세-신고-세무사-직접-판단", audience: "사업자·셀러", summary: "직접 신고와 세무사 의뢰, 자료 상태에 맞춰 판단하기." },
  { slug: "프리랜서-3점3-종합소득세-환급-추가납부", audience: "프리랜서·부업", summary: "이미 뗀 3.3%와 최종 세금이 다른 이유 알아보기." },
] as const;
const FAQS = [
  { question: "회원가입 없이 이용할 수 있나요?", answer: "계산기와 가이드는 회원가입 없이 이용할 수 있습니다. 세금 운영표 저장과 이어보기 등 일부 기능은 로그인 또는 저장 링크가 필요합니다." },
  { question: "계산 결과로 바로 신고해도 되나요?", answer: "계산 결과는 입력한 조건에 따른 참고용 추정치입니다. 공제·예외·신고연도에 따라 실제 세액이 달라질 수 있으므로 해당 계산기의 적용 범위와 공식 자료를 확인하세요." },
];

export default function HomePage() {
  return (
    <div className="bg-white">
      <JsonLd data={faqJsonLd(FAQS, absoluteUrl("/"))} />
      <section aria-labelledby="home-title" className="border-b border-line bg-surface-muted">
        <div className="app-shell-frame pb-10 pt-10 sm:pb-12 sm:pt-14">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-black text-brand-dark">FindTax</p>
            <Link href="/my-taxes" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink-muted underline underline-offset-4">
              저장한 내 세금<ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <h1 id="home-title" className="mt-5 max-w-3xl text-3xl font-extrabold leading-tight text-ink sm:text-[44px]">
            내 상황에 맞는<br className="sm:hidden" /> 세금 계산과 신고 준비
          </h1>
          <p className="mt-4 text-base leading-7 text-ink-muted sm:text-lg">사업·부업부터 가족 증여, 노후 준비까지.</p>
          <TaxDecisionWidget />
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
            <p className="text-sm text-ink-muted">계산과 가이드는 회원가입 없이 이용할 수 있습니다.</p>
            <Link id="calculators" href="/calculator" className="inline-flex min-h-11 scroll-mt-32 items-center gap-2 text-sm font-bold text-ink underline underline-offset-4">
              <Calculator size={17} aria-hidden />전체 계산기<ArrowRight size={17} aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section aria-labelledby="starter-guides-title" className="app-shell-frame py-12 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 id="starter-guides-title" className="flex items-center gap-3 text-2xl font-bold text-ink"><BookOpen size={23} aria-hidden />신고 전, 이 질문부터</h2>
          <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-ink underline underline-offset-4">전체 가이드<ArrowRight size={17} aria-hidden /></Link>
        </div>
        <div className="mt-6 grid gap-x-10 md:grid-cols-2">
          {STARTER_GUIDES.map((guide) => {
            const article = getBlogArticle(guide.slug);
            if (!article) return null;
            return (
              <Link key={guide.slug} href={`/blog/${guide.slug}`} className="group border-t border-line py-6">
                <p className="text-sm font-semibold text-brand-dark">{guide.audience}</p>
                <h3 className="mt-3 text-xl font-bold leading-snug text-ink group-hover:underline underline-offset-4">{article.h1}</h3>
                <p className="mt-3 text-sm leading-7 text-ink-muted">{guide.summary}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink">읽어보기<ArrowRight size={16} aria-hidden /></span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-y border-line bg-surface-muted" aria-labelledby="next-resources-title">
        <div className="app-shell-frame flex flex-wrap items-center justify-between gap-5 py-9">
          <div>
            <h2 id="next-resources-title" className="text-2xl font-bold text-ink">내 상황에 맞는 계산과 가이드를 더 찾아보세요</h2>
            <p className="mt-3 text-sm leading-7 text-ink-muted">필요한 숫자를 직접 비교하고, 신고 전에 확인할 내용을 읽어볼 수 있습니다.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/calculator" className="btn-primary inline-flex min-h-11 items-center gap-2 text-sm">전체 계산기<ArrowRight size={17} aria-hidden /></Link>
            <Link href="/blog" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 text-sm font-semibold text-ink">세금 가이드<ArrowRight size={17} aria-hidden /></Link>
          </div>
        </div>
      </section>

      <section className="app-shell-frame py-12 sm:py-16" aria-labelledby="home-faq-title">
        <h2 id="home-faq-title" className="text-2xl font-bold text-ink">이용 전 궁금한 점</h2>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-1">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {faq.question}<ChevronDown size={19} aria-hidden className="shrink-0 group-open:rotate-180" />
              </summary>
              <p className="max-w-3xl pb-5 text-sm leading-7 text-ink-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
