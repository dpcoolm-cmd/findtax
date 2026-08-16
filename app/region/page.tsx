import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, MapPin } from "lucide-react";
import { REGIONS } from "@/lib/regions";
import { absoluteUrl, regionSidoPath, regionSigunguPath } from "@/lib/seo/urls";
import { listActiveRegionPairs } from "@/lib/tax-accountants";

export const metadata: Metadata = {
  title: "지역별 세무사 찾기",
  description: "시·도와 구·군을 선택해 지역 세무사 목록과 상담 가능 분야를 확인하세요.",
  alternates: { canonical: absoluteUrl("/region") },
};

export default async function RegionIndexPage() {
  const quickRegions = (await listActiveRegionPairs())
    .sort((a, b) => `${a.sido}-${a.sigungu}`.localeCompare(`${b.sido}-${b.sigungu}`, "ko"))
    .slice(0, 6);

  return (
    <div className="app-shell-frame pb-24 pt-10 md:pb-28">
      <section className="border-b border-line pb-9">
        <p className="text-sm font-bold text-brand-dark">지역 세무사 찾기</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-tight text-ink md:text-5xl">
          가까운 지역부터 비교해 보세요.
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
          시·도와 구·군을 차례로 선택하면 실제 등록된 세무사 목록과 상담 가능한 세무 분야를
          확인할 수 있습니다.
        </p>
      </section>

      <section className="py-10" aria-labelledby="region-list-title">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-brand-dark">시·도 선택</p>
            <h2 id="region-list-title" className="mt-2 text-2xl font-extrabold text-ink">
              원하는 지역을 선택하세요.
            </h2>
          </div>
          <p className="hidden text-sm text-ink-muted sm:block">전국 17개 시·도</p>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
          {REGIONS.map((region) => (
            <li key={region.name}>
              <Link
                href={regionSidoPath(region.name)}
                className="group flex min-h-20 items-center justify-between rounded-lg border border-line bg-white px-4 py-3 transition-colors hover:border-line-strong hover:bg-surface-muted"
              >
                <span>
                  <span className="block text-sm font-bold text-ink">{region.name}</span>
                  <span className="mt-1 block text-xs text-ink-muted">
                    {region.sigungu.length}개 구·군
                  </span>
                </span>
                <ArrowRight size={17} className="text-ink-soft transition-transform group-hover:translate-x-1" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line py-10" aria-labelledby="quick-region-title">
        <p className="text-sm font-bold text-brand-dark">빠른 지역 선택</p>
        <h2 id="quick-region-title" className="mt-2 text-2xl font-extrabold text-ink">
          주요 구·군으로 바로 이동
        </h2>
        <div className="mt-5 flex flex-wrap gap-2">
          {quickRegions.map(({ sido, sigungu }) => (
            <Link
              key={`${sido}-${sigungu}`}
              href={regionSigunguPath(sido, sigungu)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-line bg-white px-4 text-sm font-semibold text-ink hover:bg-surface-muted"
            >
              <MapPin size={15} className="text-brand-dark" />
              {sido} {sigungu}
            </Link>
          ))}
        </div>
      </section>

      <section className="py-10" aria-labelledby="region-process-title">
        <p className="text-sm font-bold text-brand-dark">이용 흐름</p>
        <h2 id="region-process-title" className="mt-2 text-2xl font-extrabold text-ink">
          비교하고 필요한 경우에만 신청하세요.
        </h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            ["1", "지역 선택", "시·도와 구·군을 선택합니다."],
            ["2", "세무사 비교", "전문 분야와 기본 정보를 확인합니다."],
            ["3", "매칭 신청", "맞는 전문가가 있으면 상담 연결을 요청합니다."],
          ].map(([step, title, body]) => (
            <li key={step} className="border-t border-line pt-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-dark">
                <CheckCircle2 size={15} /> STEP {step}
              </span>
              <h3 className="mt-3 text-lg font-bold text-ink">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
