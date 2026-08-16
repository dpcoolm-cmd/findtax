import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FindTax 소개",
  description: "세금 판단 도구와 세무사 연결을 제공하는 FindTax의 운영 목적과 콘텐츠 작성 기준을 안내합니다.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-[820px] px-4 py-14 sm:px-6">
      <p className="text-sm font-semibold text-brand">ABOUT FINDTAX</p>
      <h1 className="mt-3 text-4xl font-extrabold text-ink">세금 문제를 ‘다음 행동’으로 바꿉니다</h1>
      <div className="mt-8 space-y-7 leading-8 text-ink-muted">
        <p>
          FindTax는 세금을 대신 확정해 주는 서비스가 아닙니다. 신고를 직접 해도 되는지, 어떤 자료가 빠졌는지,
          언제 전문가 검토가 필요한지를 먼저 판단할 수 있도록 계산기와 실전 가이드를 제공합니다.
        </p>
        <section>
          <h2 className="text-2xl font-bold text-ink">콘텐츠는 이렇게 만듭니다</h2>
          <p className="mt-3">
            FindTax 편집팀은 국세청, 국가법령정보, 금융위원회 등 공개된 1차 자료를 우선 확인합니다.
            변경 가능성이 큰 신고기한·공제한도·세율은 확인일을 함께 표시하고, 개인별 결론이 달라지는 내용은 단정하지 않습니다.
          </p>
        </section>
        <section>
          <h2 className="text-2xl font-bold text-ink">계산기와 상담의 경계</h2>
          <p className="mt-3">
            계산 결과는 입력값을 바탕으로 한 참고용 진단입니다. 해외거래, 다수 사업장, 부동산 양도·증여,
            장부 누락처럼 사실관계가 복잡한 경우에는 세무대리인의 개별 검토가 필요합니다.
          </p>
        </section>
        <p>
          오류나 오래된 내용을 발견하면 <Link href="/support" className="font-semibold text-brand underline">고객지원</Link>으로 알려주세요.
          확인 후 수정일과 근거를 갱신합니다.
        </p>
        <p>
          <Link href="/editorial-policy" className="font-semibold text-brand underline">편집 원칙 자세히 보기</Link>
        </p>
      </div>
    </article>
  );
}
