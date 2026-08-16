import type { Metadata } from "next";
import { CalculatorDirectory } from "@/components/CalculatorDirectory";
import { IndustryTaxDiagnosisHub } from "@/components/IndustryTaxDiagnosisHub";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo/auto-content";
import { absoluteUrl } from "@/lib/seo/urls";

export const revalidate = 86400;

const title = "세금 계산기 전체 목록";
const description =
  "양도세, 종합소득세, 기장료, 상속·증여, 부가세, 취득세, 퇴직금, 4대보험 등 FindTax 계산기를 한 곳에서 선택하세요.";

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
            필요한 세금 계산기를 한 곳에서 찾으세요.
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
