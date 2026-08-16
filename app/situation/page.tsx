import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl, situationPath } from "@/lib/seo/urls";
import { TAX_SITUATIONS } from "@/lib/situations";

export const revalidate = 86400;

const path = "/situation";

export const metadata: Metadata = {
  title: "상황별 세금 안내",
  description:
    "연금·IRP 절세, 상속·증여, 기장, 창업, 법인세, 급여·4대보험 등 지금 겪고 있는 세금 상황을 골라 판단 가이드와 계산기로 바로 이동하세요.",
  alternates: { canonical: absoluteUrl(path) },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl(path),
    title: "상황별 세금 안내",
    description:
      "지금 겪고 있는 세금 상황을 골라 판단 가이드와 계산기로 바로 이동하세요.",
  },
};

/** 인덱스 카드용 한 줄 소개 — 상세 페이지 콘텐츠와 톤 일치 */
const SITUATION_BLURBS: Record<string, string> = {
  income_tax: "연금저축·IRP·ISA, 무엇부터 채울지 순서를 먼저 정리합니다.",
  corporate_tax: "결산·장부·배당까지, 법인이 챙길 세무 흐름을 확인합니다.",
  startup: "사업자등록과 과세 유형 선택 등 초기 세팅을 정리합니다.",
  payroll: "급여·원천징수·4대보험 신고 부담을 한 번에 점검합니다.",
  audit: "세무조사·과세전적부심 대응 순서를 미리 준비합니다.",
  inheritance: "지금 증여할지, 나중에 상속할지 시나리오로 비교합니다.",
  international: "해외 소득·거주자 판정 등 국제조세 쟁점을 확인합니다.",
  restructuring: "M&A·분할합병 전에 세무 이슈를 먼저 짚습니다.",
  rnd_credit: "R&D·고용·투자 세액공제, 놓치는 항목이 없는지 확인합니다.",
  bookkeeping: "매출 규모에 맞는 기장 방식과 적정 기장료를 판단합니다.",
};

const SITUATION_NEXT_STEPS: Record<string, string> = {
  income_tax: "신고 복잡도와 예상 세액 확인",
  corporate_tax: "결산·기장 관리 범위 확인",
  startup: "사업자등록 전 체크리스트 확인",
  payroll: "급여·4대보험 부담 확인",
  audit: "대응 자료와 진행 순서 확인",
  inheritance: "상속·증여 시나리오 비교",
  international: "거주자·해외소득 쟁점 확인",
  restructuring: "거래 전 세무 쟁점 확인",
  rnd_credit: "공제 대상과 증빙 확인",
  bookkeeping: "직접 관리와 기장 손익 비교",
};

const SITUATION_GROUPS = [
  {
    title: "사업 시작·운영",
    description: "사업을 시작하거나 매달 관리해야 하는 세금 업무를 정리합니다.",
    ids: ["startup", "bookkeeping", "corporate_tax", "payroll"],
  },
  {
    title: "신고·절세",
    description: "정기 신고와 공제 항목 중 무엇을 먼저 확인할지 판단합니다.",
    ids: ["income_tax", "rnd_credit"],
  },
  {
    title: "자산·전문 쟁점",
    description: "금액과 조건에 따라 결과 차이가 큰 세무 이슈를 살펴봅니다.",
    ids: ["inheritance", "international", "audit", "restructuring"],
  },
] as const;

export default function SituationIndexPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: "상황별 안내", url: path },
        ])}
      />

      <div className="app-shell-frame pb-24 pt-10 md:pb-28">
        <div className="space-y-10">
          <section className="space-y-5 border-b border-line pb-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">
                홈
              </Link>
              <span>/</span>
              <span className="text-ink">상황별 안내</span>
            </div>
            <h1 className="max-w-3xl text-[2.6rem] leading-[1.05] md:text-[3.4rem]">
              지금 어떤 세금 상황인가요?
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-ink-muted">
              상황을 고르면 무엇을 먼저 판단해야 하는지, 어떤 계산기로 비교하면 되는지
              바로 이어서 볼 수 있습니다.
            </p>
          </section>

          <section className="space-y-12" aria-label="상황 목록">
            {SITUATION_GROUPS.map((group) => {
              const situations = group.ids
                .map((id) => TAX_SITUATIONS.find((item) => item.id === id))
                .filter((item): item is (typeof TAX_SITUATIONS)[number] => Boolean(item));

              return (
                <div key={group.title}>
                  <div className="border-b border-line pb-4 md:flex md:items-end md:justify-between md:gap-6">
                    <h2 className="text-2xl font-extrabold text-ink">{group.title}</h2>
                    <p className="mt-2 text-sm text-ink-muted md:mt-0">{group.description}</p>
                  </div>
                  <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {situations.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={situationPath(s.id)}
                          className="group flex h-full min-h-52 flex-col rounded-lg border border-line bg-white p-6 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-soft"
                        >
                          <h3 className="text-lg font-bold text-ink">{s.label}</h3>
                          <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">
                            {SITUATION_BLURBS[s.id] ??
                              "지금 필요한 판단과 계산 흐름을 안내합니다."}
                          </p>
                          <p className="mt-4 border-t border-line pt-3 text-xs font-semibold text-brand-dark">
                            다음 확인: {SITUATION_NEXT_STEPS[s.id] ?? "판단 가이드 확인"}
                          </p>
                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-ink">
                            가이드 보기
                            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
                              →
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>

          <section className="rounded-2xl border border-line bg-bg-muted p-6 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div>
              <h2 className="text-xl font-bold text-ink">어느 상황인지 애매하다면?</h2>
              <p className="mt-1 text-sm text-ink-muted">
                상담 신청에 상황을 간단히 남겨주시면 담당자가 확인 후 적합한 세무사 연결을 도와드립니다.
              </p>
            </div>
            <Link href="/consult" className="btn-primary mt-4 sm:mt-0">
              무료 매칭 신청
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
