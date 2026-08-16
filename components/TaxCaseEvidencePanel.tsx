import { BookOpenCheck, ExternalLink, ShieldCheck } from "lucide-react";
import type { TaxCaseView } from "@/lib/tax-cases/server";

const CASE_EVIDENCE = {
  vat: {
    checked: "매출·매입자료, 예외거래, 신고기한을 기준으로 판단합니다.",
    example: "간이과세·거래 건수 소수·해외거래 없음이면 직접 신고 가능성을 높게 봅니다.",
    links: [
      ["국세청 부가가치세", "https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2273&cntntsId=7669"],
      ["국가법령정보센터", "https://www.law.go.kr"],
    ],
  },
  gift: {
    checked: "관계별 공제, 과거 10년 합산, 재산 평가와 신고기한을 대조합니다.",
    example: "미성년 자녀 현금 증여는 과거 10년 증여액과 2천만원 공제 사용액을 함께 봅니다.",
    links: [
      ["국세청 증여세", "https://www.nts.go.kr"],
      ["상속세 및 증여세법", "https://www.law.go.kr/법령/상속세및증여세법"],
    ],
  },
  solo_business: {
    checked: "과세유형, 매출 규모, 인건비, 해외거래와 증빙 루틴을 기준으로 봅니다.",
    example: "직원 없이 단일 매출원과 월별 증빙이 정리된 경우 직접 관리 가능성을 높게 봅니다.",
    links: [
      ["국세청 개인사업자", "https://www.nts.go.kr"],
      ["홈택스", "https://www.hometax.go.kr"],
    ],
  },
  pension: {
    checked: "연금저축·IRP 합산 한도, ISA 전환 추가 한도와 소득구간을 대조합니다.",
    example: "ISA 전환으로 공제 한도를 이미 채운 경우 추가 납입 절세효과를 0원으로 표시합니다.",
    links: [
      ["국세청 연말정산", "https://www.nts.go.kr"],
      ["소득세법", "https://www.law.go.kr/법령/소득세법"],
    ],
  },
  seller: {
    checked: "총매출·정산금 분리, 반품·수수료, 외화환산과 수출증빙을 기준으로 봅니다.",
    example: "역직구인데 수출·배송·외화입금 증빙이 없으면 영세율 검토를 우선 과제로 표시합니다.",
    links: [
      ["국세청 부가가치세", "https://www.nts.go.kr"],
      ["관세청 수출입 안내", "https://www.customs.go.kr"],
    ],
  },
} as const;

export function TaxCaseEvidencePanel({ taxCase }: { taxCase: TaxCaseView }) {
  const evidence = CASE_EVIDENCE[taxCase.caseType];
  return (
    <section className="mt-8 border-y border-line bg-surface-muted px-2 py-6 sm:px-4">
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
        <div>
          <p className="flex items-center gap-2 text-sm font-black text-ink">
            <ShieldCheck size={18} />
            판단 근거와 검증 상태
          </p>
          <p className="mt-3 text-sm leading-6 text-ink-muted">
            {evidence.checked}
          </p>
          <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-ink-muted">
            <BookOpenCheck className="mt-1 shrink-0" size={16} />
            사례 예시: {evidence.example}
          </p>
          <p className="mt-3 text-xs font-bold text-[#6A442D]">
            기준 점검월 2026-07
            {taxCase.ruleVersion ? ` · 규칙 ${taxCase.ruleVersion}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:max-w-xs md:justify-end">
          {evidence.links.map(([label, href]) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-line bg-white px-3 text-xs font-bold text-ink"
            >
              {label}
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
