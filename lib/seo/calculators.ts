export const CALCULATOR_SLUGS = [
  "1인사업자",
  "부업",
  "종합소득세",
  "양도세",
  "부가세",
  "증여세",
  "취득세",
  "퇴직금",
  "4대보험",
  "주휴수당",
  "연말정산",
  "상속증여",
] as const;

export type CalculatorSlug = (typeof CALCULATOR_SLUGS)[number];

export function isCalculatorSlug(s: string): s is CalculatorSlug {
  return (CALCULATOR_SLUGS as readonly string[]).includes(s);
}

export type CalculatorDirectoryItem = {
  key: string;
  title: string;
  shortTitle: string;
  description: string;
  href: string;
  category: string;
  featured?: boolean;
};

export const CALCULATOR_DIRECTORY: CalculatorDirectoryItem[] = [
  {
    key: "solo-business",
    title: "1인사업자 세무 운영표",
    shortTitle: "1인사업자",
    description: "부가세·종소세·원천세 중 내게 필요한 의무와 다음 일정을 한 번에 정리합니다.",
    href: "/calculator/1%EC%9D%B8%EC%82%AC%EC%97%85%EC%9E%90",
    category: "사업자",
    featured: true,
  },
  {
    key: "side-hustle",
    title: "N잡·부업 세금 계산기",
    shortTitle: "부업 세금",
    description: "직장인 부업, 애드센스, 쿠팡파트너스, 스마트스토어 수익의 신고 위험도를 진단합니다.",
    href: "/calculator/%EB%B6%80%EC%97%85",
    category: "N잡",
    featured: true,
  },
  {
    key: "transfer-tax",
    title: "양도세 계산기",
    shortTitle: "양도세",
    description: "주택 수, 취득·양도가액, 보유 기간 기준으로 예상 세액을 비교합니다.",
    href: "/calculator/%EC%96%91%EB%8F%84%EC%84%B8",
    category: "부동산",
    featured: true,
  },
  {
    key: "income-tax",
    title: "종합소득세 계산기",
    shortTitle: "종합소득세",
    description: "사업·프리랜서·부업 소득을 합산해 예상 세금을 계산합니다.",
    href: "/calculator/%EC%A2%85%ED%95%A9%EC%86%8C%EB%93%9D%EC%84%B8",
    category: "소득",
    featured: true,
  },
  {
    key: "bookkeeping-fee",
    title: "기장료 계산기",
    shortTitle: "기장료",
    description: "매출 규모와 업종을 기준으로 적정 기장료 범위를 확인합니다.",
    href: "/calculator/jangbu",
    category: "사업자",
    featured: true,
  },
  {
    key: "inheritance-gift",
    title: "상속·증여 사전 시뮬레이터",
    shortTitle: "상속·증여",
    description: "지금 증여할지, 상속을 준비할지 시나리오별 차이를 살펴봅니다.",
    href: "/calculator/%EC%83%81%EC%86%8D%EC%A6%9D%EC%97%AC",
    category: "자산 이전",
    featured: true,
  },
  {
    key: "gift-tax",
    title: "증여세 계산기",
    shortTitle: "증여세",
    description: "증여 금액과 관계에 따른 공제 및 예상 세액을 확인합니다.",
    href: "/calculator/%EC%A6%9D%EC%97%AC%EC%84%B8",
    category: "가족",
  },
  {
    key: "vat",
    title: "부가세 계산기",
    shortTitle: "부가세",
    description: "매출과 매입을 기준으로 예상 납부세액을 빠르게 계산합니다.",
    href: "/calculator/%EB%B6%80%EA%B0%80%EC%84%B8",
    category: "사업자",
  },
  {
    key: "acquisition-tax",
    title: "취득세 계산기",
    shortTitle: "취득세",
    description: "부동산 취득 금액과 조건에 따른 예상 취득세를 계산합니다.",
    href: "/calculator/%EC%B7%A8%EB%93%9D%EC%84%B8",
    category: "부동산",
  },
  {
    key: "severance-pay",
    title: "퇴직금 계산기",
    shortTitle: "퇴직금",
    description: "근속 기간과 평균임금 기준으로 예상 퇴직금을 계산합니다.",
    href: "/calculator/%ED%87%B4%EC%A7%81%EA%B8%88",
    category: "근로",
  },
  {
    key: "social-insurance",
    title: "4대보험 계산기",
    shortTitle: "4대보험",
    description: "급여 기준으로 사업주와 근로자의 보험료 부담을 확인합니다.",
    href: "/calculator/4%EB%8C%80%EB%B3%B4%ED%97%98",
    category: "급여",
  },
  {
    key: "weekly-holiday-pay",
    title: "주휴수당 계산기",
    shortTitle: "주휴수당",
    description: "근무 시간과 시급 기준으로 주휴수당 발생 여부와 금액을 봅니다.",
    href: "/calculator/%EC%A3%BC%ED%9C%B4%EC%88%98%EB%8B%B9",
    category: "근로",
  },
  {
    key: "year-end-tax",
    title: "연금·IRP 절세 시뮬레이터",
    shortTitle: "연말정산",
    description: "연금저축·IRP 납입에 따른 절세 가능 금액을 비교합니다.",
    href: "/calculator/%EC%97%B0%EB%A7%90%EC%A0%95%EC%82%B0",
    category: "절세",
  },
];
