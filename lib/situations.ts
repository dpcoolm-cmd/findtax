export interface TaxSituation {
  id: string;
  label: string;
  /** 상황 선택·랜딩 보조 문구 */
  subtitle?: string;
}

export const TAX_SITUATIONS: readonly TaxSituation[] = [
  { id: "income_tax", label: "종합소득세·부가세 신고" },
  { id: "corporate_tax", label: "법인세·결산·장부" },
  { id: "startup", label: "창업·사업자등록·초기 세팅" },
  { id: "payroll", label: "급여·원천징수·4대보험" },
  { id: "audit", label: "세무조사·과세전적검토" },
  { id: "inheritance", label: "상속·증여·양도소득세" },
  { id: "international", label: "국제조세·해외거주" },
  { id: "restructuring", label: "M&A·조직개편·분할합병" },
  { id: "rnd_credit", label: "R&D·고용·투자 세액공제" },
  {
    id: "bookkeeping",
    label: "세무 기장",
    subtitle: "매달 세금, 손해 없이 관리하세요",
  },
] as const;

export function getSituationLabel(id: string): string {
  return TAX_SITUATIONS.find((s) => s.id === id)?.label ?? id;
}
