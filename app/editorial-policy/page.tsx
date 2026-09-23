import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "편집 원칙과 수정 정책",
  description: "FindTax 세금 콘텐츠의 자료 확인, 광고 분리, 정정 및 업데이트 원칙입니다.",
  alternates: { canonical: "/editorial-policy" },
};

export default function EditorialPolicyPage() {
  return (
    <article className="mx-auto max-w-[820px] px-4 py-14 sm:px-6">
      <h1 className="text-4xl font-extrabold text-ink">편집 원칙과 수정 정책</h1>
      <div className="mt-8 space-y-8 leading-8 text-ink-muted">
        <section>
          <h2 className="text-2xl font-bold text-ink">1. 공식 자료를 먼저 봅니다</h2>
          <p className="mt-3">세율, 신고기한, 공제요건은 국세청·법령·정부기관 자료를 우선 확인합니다. 출처를 직접 확인한 글은 본문 하단에 자료명과 확인일을 표시합니다.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">2. 판단과 사실을 구분합니다</h2>
          <p className="mt-3">법에 정해진 사실과 FindTax가 제안하는 실무 체크리스트를 구분합니다. 실제 상담 사례로 확인되지 않은 숫자는 가상 사례로 표시하며, 개인별 세액이나 환급을 보장하지 않습니다. 출처 확인과 세무사의 개별 검수는 서로 다릅니다. 검수자와 검수 범위가 표시되지 않은 글을 세무사 검수 콘텐츠로 안내하지 않습니다.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">3. 광고가 결론을 바꾸지 않습니다</h2>
          <p className="mt-3">광고·제휴·전문가 연결은 콘텐츠의 선정 기준과 분리합니다. 대가성 링크나 상담 연결이 있을 때는 이용자가 알아볼 수 있도록 표시합니다.</p>
          <p className="mt-3">서비스는 Google AdSense 자동 광고를 운영합니다. 광고는 편집·자료 선정과 분리하며, 광고가 세금 정보나 상담 안내로 오인되지 않도록 합니다. 광고 배치는 이용자가 본문과 계산·신고 자료를 확인하는 데 지장을 주지 않도록 점검합니다.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">4. 수정 이력을 남깁니다</h2>
          <p className="mt-3">제도 변경이나 오류를 확인하면 해당 본문과 수정일을 갱신합니다. 단순 배포만으로 모든 글의 날짜를 최신으로 바꾸지 않습니다. 수정 요약이 있는 글은 제목 아래에 변경 내용을 표시합니다. 오류 제보는 해당 글의 주소와 문제가 되는 문장을 포함해 <Link href="/support" className="font-semibold text-ink underline">고객지원</Link>으로 보내주세요.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">5. 분량보다 질문의 해결을 우선합니다</h2>
          <p className="mt-3">글자 수를 채우기 위한 공통 문단을 자동으로 붙이지 않습니다. 신고 대상, 준비자료, 예외, 계산의 전제처럼 주제에 필요한 정보를 담고, 자료가 부족한 내용은 확인된 사실처럼 단정하지 않습니다. 새로운 카테고리보다 기존 글의 오류 수정과 출처 보완을 먼저 진행합니다.</p>
        </section>
        <p className="border-t border-line pt-6 text-sm">최종 수정: 2026-09-05 · FindTax</p>
      </div>
    </article>
  );
}
