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
          <p className="mt-3">법에 정해진 사실과 편집팀이 제안하는 실무 체크리스트를 구분합니다. 사례는 이해를 돕기 위한 예시이며 개인별 세액을 확정하지 않습니다.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">3. 광고가 결론을 바꾸지 않습니다</h2>
          <p className="mt-3">광고·제휴·전문가 연결은 콘텐츠의 선정 기준과 분리합니다. 대가성 링크나 상담 연결이 있을 때는 이용자가 알아볼 수 있도록 표시합니다.</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">4. 수정 이력을 남깁니다</h2>
          <p className="mt-3">제도 변경이나 오류를 확인하면 최종 수정일과 출처를 갱신합니다. 중요한 오류 제보는 <Link href="/support" className="font-semibold text-brand underline">고객지원</Link>에서 받습니다.</p>
        </section>
        <p className="border-t border-line pt-6 text-sm">최종 수정: 2026-08-12 · 운영 주체: FindTax 편집팀</p>
      </div>
    </article>
  );
}
