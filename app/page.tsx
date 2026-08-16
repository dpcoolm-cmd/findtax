import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronRight,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CalculatorDirectory } from "@/components/CalculatorDirectory";
import { FaqSection, InternalLinksSection } from "@/components/SeoBlocks";
import { JsonLd } from "@/components/JsonLd";
import { LeadSectionTrigger } from "@/components/LeadSectionTrigger";
import { TaxDecisionWidget } from "@/components/TaxDecisionWidget";
import { buildMainFaq, faqJsonLd } from "@/lib/seo/auto-content";
import { SIDO_NAMES } from "@/lib/regions";
import { absoluteUrl, calculatorPath, regionSidoPath, situationPath } from "@/lib/seo/urls";

export const revalidate = 3600;

const description =
  "1인사업자·부업러·온라인·글로벌 셀러가 세금과 신고 일정을 확인하고, 필요할 때 세무사에게 상담할 수 있는 FindTax입니다.";

export const metadata: Metadata = {
  title: "FindTax | 사업과 판매의 세금, 다음 할 일까지",
  description,
  alternates: { canonical: absoluteUrl("/") },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl("/"),
    title: "FindTax | 사업과 판매의 세금, 다음 할 일까지",
    description,
  },
};

const STEPS = [
  {
    number: "01",
    title: "상황을 선택하세요",
    description: "양도, 소득, 상속·증여, 기장처럼 지금 필요한 세금 문제를 고릅니다.",
  },
  {
    number: "02",
    title: "내 운영표로 저장하세요",
    description: "예상 세액, 준비자료와 다음 신고 일정을 한 곳에 모읍니다.",
  },
  {
    number: "03",
    title: "기한 전에 알림을 받으세요",
    description: "남은 할 일을 이어서 확인하고 신고 전 다시 점검합니다.",
  },
  {
    number: "04",
    title: "필요할 때만 연결하세요",
    description: "정리된 진단 인계서와 함께 세무사에게 마지막 판단을 확인합니다.",
  },
] as const;

function mainInternalLinks() {
  return [
    { href: regionSidoPath("서울특별시"), label: "서울특별시 세무사 찾기" },
    { href: regionSidoPath("경기도"), label: "경기도 세무사 찾기" },
    { href: situationPath("income_tax"), label: "종합소득세 상황별 가이드" },
    { href: situationPath("corporate_tax"), label: "법인세 상황별 가이드" },
    { href: calculatorPath("양도세"), label: "양도세 계산기" },
    { href: "/consult", label: "세무 상담 신청" },
  ];
}

export default function HomePage() {
  const faqs = buildMainFaq();
  const url = absoluteUrl("/");

  return (
    <>
      <JsonLd data={faqJsonLd(faqs, url)} />

      <section className="bg-bg">
        <div className="app-shell-frame grid gap-10 py-14 lg:min-h-[540px] lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.72fr)] lg:items-center lg:py-16">
          <div className="max-w-3xl">
            <div className="badge-neutral gap-2">
              <Sparkles size={14} className="text-brand-dark" />
              1인사업자 · 부업러 · 온라인 · 글로벌 셀러
            </div>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.12] text-ink sm:text-5xl">
              사업과 판매에서 생기는 세금,
              <br />
              해야 할 일까지 정리해 드립니다.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-ink-muted md:text-xl">
              구매대행·역직구까지, 내 세금과 다음 할 일을 한 번에.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={calculatorPath("1인사업자")}
                className="btn-primary px-7 text-base font-bold"
              >
                내 사업 세금 정리하기
                <ArrowRight size={19} />
              </Link>
              <Link
                href="/calculator#industry-diagnosis"
                className="btn-secondary px-7 text-base font-bold"
              >
                <Calculator size={19} />
                셀러 세금 진단하기
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-ink-muted">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-brand-dark" />
                회원가입 없이 시작
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-brand-dark" />
                신고 일정 정리
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-brand-dark" />
                필요할 때 전문가 연결
              </span>
            </div>
            <Link
              href="/my-taxes"
              className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#6A442D] underline underline-offset-4"
            >
              저장한 내 세금 운영표 이어보기
              <ArrowRight size={16} />
            </Link>
          </div>

          <TaxDecisionWidget />
        </div>
      </section>

      <CalculatorDirectory
        title="상담 전에, 숫자부터 확인하세요."
        description="계산기 메뉴를 한 곳으로 모았습니다. 자주 쓰는 양도세·종합소득세·기장료·상속증여는 추천 항목으로 먼저 볼 수 있습니다."
      />

      <section className="bg-white">
        <div className="app-shell-frame app-section">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-bold text-brand-dark">이용 방법</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight md:text-4xl">
              계산하고,
              <br />
              판단하고,
              <br />
              확인하세요.
            </h2>
            <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">
              세무 상담을 받기 전에 핵심 정보를 정리하면 더 빠르고 구체적인 답을 얻을 수
              있습니다.
            </p>
          </div>

          <div className="space-y-3">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="grid gap-5 rounded-lg border border-line bg-surface-muted p-6 transition-colors hover:border-line-strong sm:grid-cols-[72px_minmax(0,1fr)] sm:p-8"
              >
                <span className="text-4xl font-black text-brand-dark leading-none">{step.number}</span>
                <div>
                  <h3 className="text-2xl font-bold text-ink">{step.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-ink-muted">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </section>

      <section className="bg-bg">
        <div className="app-shell-frame app-section">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:items-center">
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-brand-dark">
                <MapPin size={23} />
              </span>
              <h2 className="mt-6 text-3xl font-extrabold leading-tight md:text-4xl">
                가까운 지역의
                <br />
                세무사를 찾아보세요.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-ink-muted">
                지역을 선택해 등록 세무사 목록과 연락처를 확인하고, 필요하면 상담을
                신청할 수 있습니다.
              </p>
              <Link href="/region" className="btn-primary mt-7 w-fit px-6 text-sm font-bold">
                전체 지역 보기
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="rounded-lg border border-line bg-white p-5 sm:p-7">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-ink">지역 선택</p>
                <span className="text-xs font-semibold text-ink-soft">17개 시·도</span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SIDO_NAMES.map((sido) => (
                  <Link
                    key={sido}
                    href={regionSidoPath(sido)}
                    className="flex min-h-11 items-center justify-between rounded-lg border border-line bg-surface-muted px-4 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-brand-accent"
                  >
                    {sido}
                    <ChevronRight size={16} />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="app-shell-frame app-section space-y-16">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calculator, title: "먼저 계산", text: "상담 전에 예상 세액과 기준을 확인합니다." },
            { icon: MapPin, title: "지역 검색", text: "전국 시·군·구별 세무사 정보를 찾습니다." },
            { icon: PhoneCall, title: "바로 연결", text: "전화 또는 상담 신청으로 이어집니다." },
            { icon: ShieldCheck, title: "개인정보 보호", text: "상담 연결 목적에 필요한 정보만 사용합니다." },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="border-t border-ink pt-5">
                <Icon size={21} />
                <h3 className="mt-5 text-lg font-bold">{item.title}</h3>
                <p className="mt-2 text-sm leading-6">{item.text}</p>
              </div>
            );
          })}
        </section>

        <LeadSectionTrigger />

        <InternalLinksSection links={mainInternalLinks()} />
        <FaqSection items={faqs} />
      </div>
    </>
  );
}
