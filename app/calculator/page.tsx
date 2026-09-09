import type { Metadata } from "next";
import { CalculatorDirectory } from "@/components/CalculatorDirectory";
import { IndustryTaxDiagnosisHub } from "@/components/IndustryTaxDiagnosisHub";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";

export const revalidate = 86400;

const title = "세금·연금 계산기 전체 목록";
const description =
  "사업·부업, 부동산, 상속·증여, 근로, 연금·재무 계산기를 한 곳에서 선택하세요. 노후월급과 연금·IRP 절세까지 내 조건으로 비교합니다.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/calculator") },
  robots: { index: true, follow: true },
  openGraph: {
    url: absoluteUrl("/calculator"),
    title,
    description,
  },
};

export default function CalculatorHubPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: "계산기", url: "/calculator" },
        ])}
      />

      <section className="border-b border-line bg-bg">
        <div className="app-shell-frame py-10 md:py-14">
          <p className="text-sm font-bold text-brand-dark">전체 계산기</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            세금부터 연금까지, 내 숫자로 비교하세요.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
            많이 찾는 계산기를 먼저 표시했습니다. 목적에 맞는 계산기를 선택해 바로 결과를
            확인할 수 있습니다.
          </p>
        </div>
      </section>

      <CalculatorDirectory
        title="전체 계산기"
        description="추천 항목부터 사업자·근로·자산 관련 계산기까지 같은 목록에서 바로 이동할 수 있습니다."
      />

      <IndustryTaxDiagnosisHub />
    </>
  );
}
