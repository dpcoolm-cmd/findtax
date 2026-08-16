import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { JsonLd } from "@/components/JsonLd";
import { FaqSection, InternalLinksSection } from "@/components/SeoBlocks";
import { SituationLandingActions } from "@/components/SituationLandingActions";
import { StickyPageLeadSection } from "@/components/StickyPageLeadSection";
import { Badge } from "@/components/ui/Badge";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { breadcrumbJsonLd, faqJsonLd, TAX_SITUATIONS } from "@/lib/seo/auto-content";
import { absoluteUrl, calculatorPath, regionSigunguPath, situationPath } from "@/lib/seo/urls";

export const revalidate = 86400;

type SituationContent = {
  label: string;
  headline: string;
  subtitle: string;
  bullets: string[];
  compareQuestions: string[];
  calculatorHref: string;
  calculatorLabel: string;
  regionHref: string;
  regionLabel: string;
  regionSido: string;
  regionSigungu: string;
  guideNote: string;
  faqs: { question: string; answer: string }[];
  links: { href: string; label: string }[];
};

const SITUATION_CONTENT: Record<string, SituationContent> = {
  income_tax: {
    label: "연금·IRP 절세 판단",
    headline: "무엇부터 넣는 게 유리한지 먼저 정리합니다.",
    subtitle:
      "연금저축, IRP, ISA를 모두 아는 것보다 지금 내 상황에서 무엇부터 채우는지가 더 중요합니다. FindTax는 그 순서를 먼저 보여줍니다.",
    bullets: [
      "연금저축 한도를 먼저 채울지, IRP를 먼저 볼지 비교합니다.",
      "아무것도 안 할 때와 지금 채울 때의 세금 차이를 보여줍니다.",
      "복잡한 공제 항목은 마지막에만 전문가와 맞춰봅니다.",
    ],
    compareQuestions: [
      "연금저축부터 채우는 게 맞을까?",
      "IRP까지 넣으면 차이가 얼마나 날까?",
      "ISA는 언제부터 보는 게 좋을까?",
    ],
    calculatorHref: calculatorPath("연말정산"),
    calculatorLabel: "연금·IRP 절세 시뮬레이션 시작하기",
    regionHref: regionSigunguPath("서울특별시", "강남구"),
    regionLabel: "절세 상담 가능한 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "강남구",
    guideNote:
      "직장인 절세는 정보보다 우선순위가 중요합니다. 올해 무엇부터 채우는지 먼저 판단해 보세요.",
    faqs: [
      {
        question: "연금저축과 IRP 중 무엇부터 넣는 게 좋나요?",
        answer:
          "보통은 연금저축 한도를 먼저 채우고, 그다음 IRP를 보는 흐름이 이해하기 쉽습니다. 다만 현재 소득과 추가 예산에 따라 달라질 수 있어 시뮬레이션으로 먼저 비교해 보는 편이 좋습니다.",
      },
      {
        question: "ISA까지 같이 봐야 하나요?",
        answer:
          "ISA는 세액공제보다 비과세와 저율과세 구조를 보는 상품입니다. 연금계좌 한도를 어느 정도 채운 다음 단계로 검토하는 경우가 많습니다.",
      },
      {
        question: "결과만 보고 바로 실행해도 되나요?",
        answer:
          "근로소득 외 소득이나 다른 공제 항목이 많다면 실제 환급 차이가 더 생길 수 있습니다. 방향은 계산기로 보고, 복잡한 부분만 전문가와 맞추는 방식이 현실적입니다.",
      },
    ],
    links: [
      { href: calculatorPath("연말정산"), label: "연금·IRP 절세 시뮬레이터" },
      { href: calculatorPath("종합소득세"), label: "종합소득세 계산기" },
      { href: situationPath("inheritance"), label: "상속·증여 판단 가이드" },
      { href: "/consult", label: "세무사 상담 요청하기" },
    ],
  },
  inheritance: {
    label: "상속·증여 판단",
    headline: "지금 증여할지, 나중에 상속할지 먼저 비교합니다.",
    subtitle:
      "상속과 증여는 세율보다 시점과 대상이 더 중요합니다. 배우자에게 줄지, 자녀에게 나눌지, 지금과 나중의 차이를 먼저 보세요.",
    bullets: [
      "증여와 상속 시나리오를 같은 자산 기준으로 비교합니다.",
      "배우자 우선, 자녀 분산처럼 구조 차이도 함께 봅니다.",
      "실행 전에만 평가와 특례를 전문가와 맞춰봅니다.",
    ],
    compareQuestions: [
      "지금 증여하는 게 나을까?",
      "배우자와 자녀 중 누구에게 먼저 가는 게 유리할까?",
      "10년 합산 가능성까지 같이 봐야 할까?",
    ],
    calculatorHref: calculatorPath("상속증여"),
    calculatorLabel: "상속·증여 시뮬레이션 시작하기",
    regionHref: regionSigunguPath("서울특별시", "서초구"),
    regionLabel: "상속·증여 상담 가능한 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "서초구",
    guideNote:
      "상속과 증여는 한 번 결정하면 되돌리기 어렵습니다. 세금 숫자보다 구조를 먼저 비교하는 쪽이 더 안전합니다.",
    faqs: [
      {
        question: "지금 증여하면 항상 더 유리한가요?",
        answer:
          "그렇지는 않습니다. 자산 성장률, 증여 대상, 10년 합산 가능성에 따라 오히려 상속 쪽이 나은 경우도 있습니다.",
      },
      {
        question: "배우자나 자녀에게 나눠 주면 무조건 유리한가요?",
        answer:
          "공제 구조상 유리한 경우가 많지만 자산 구성과 평가 방식에 따라 달라질 수 있습니다. 단순 분산만으로 확정 판단하기는 어렵습니다.",
      },
      {
        question: "시뮬레이션 결과만 보고 바로 실행해도 되나요?",
        answer:
          "상속·증여는 자산 평가, 합산 규정, 특례가 실제 세액에 큰 영향을 줍니다. 시뮬레이터는 방향을 보는 용도이고 실행 전에는 전문가 확인이 필요합니다.",
      },
    ],
    links: [
      { href: calculatorPath("상속증여"), label: "상속·증여 사전 시뮬레이션" },
      { href: calculatorPath("양도세"), label: "양도세 비교 계산기" },
      { href: situationPath("income_tax"), label: "연금·IRP 절세 판단 가이드" },
      { href: "/consult", label: "상속·증여 상담 요청하기" },
    ],
  },
  bookkeeping: {
    label: "기장 판단",
    headline: "내 상황에서 어떤 기장 방식이 맞는지 먼저 정리합니다.",
    subtitle:
      "기장은 가격만 비교하면 놓치는 부분이 많습니다. 매출 규모, 자료 상태, 직접 관리 여부에 따라 필요한 범위가 달라집니다.",
    bullets: [
      "직접 관리와 맡기기 사이의 차이를 먼저 봅니다.",
      "매출 규모에 따라 기장료 범위를 확인합니다.",
      "세금 정리가 실제로 맞는 세무사와 비교합니다.",
    ],
    compareQuestions: [
      "직접 관리와 맡기기 중 무엇이 맞을까?",
      "지금 자료 상태에서 바로 기장이 가능할까?",
      "가격보다 먼저 확인할 범위는 무엇일까?",
    ],
    calculatorHref: "/calculator/jangbu",
    calculatorLabel: "기장료 계산기 보기",
    regionHref: regionSigunguPath("서울특별시", "마포구"),
    regionLabel: "기장 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "마포구",
    guideNote:
      "기장 업무는 가격보다 관리 범위가 중요합니다. 먼저 내 사업에 필요한 범위를 판단해 보세요.",
    faqs: [
      {
        question: "기장료는 왜 세무사마다 차이가 큰가요?",
        answer:
          "업종, 매출 규모, 직원 수, 자료 정리 상태에 따라 실제 업무량이 달라지기 때문입니다. 최저가보다 범위 확인이 먼저입니다.",
      },
      {
        question: "자료 정리를 못 해도 맡길 수 있나요?",
        answer:
          "가능한 경우가 많습니다. 다만 기존 자료 상태에 따라 초기 정리 비용이나 추가 검토가 생길 수 있어 현재 상황을 먼저 설명하는 편이 좋습니다.",
      },
      {
        question: "기장 상담은 무료인가요?",
        answer:
          "기본 연결은 무료로 가능하고, 실제 업무 범위와 견적은 상담 후 정리됩니다.",
      },
    ],
    links: [
      { href: "/calculator/jangbu", label: "기장료 계산기" },
      { href: calculatorPath("부가세"), label: "부가세 계산기" },
      { href: calculatorPath("종합소득세"), label: "종합소득세 계산기" },
      { href: "/consult", label: "기장 상담 요청하기" },
    ],
  },
  startup: {
    label: "창업·사업자등록·초기 세팅",
    headline: "사업자 유형부터, 처음 세팅이 3년을 좌우합니다.",
    subtitle:
      "개인이냐 법인이냐, 일반과세냐 간이과세냐 — 창업 시점의 선택은 나중에 바꾸려면 비용이 듭니다. 매출 계획 기준으로 무엇이 맞는지 먼저 비교해 보세요.",
    bullets: [
      "개인사업자와 법인, 예상 매출 기준으로 유불리를 봅니다.",
      "일반·간이 과세 유형에 따라 부가세 부담이 어떻게 달라지는지 봅니다.",
      "초기 비용 처리와 장부 세팅을 첫 신고 전에 정리합니다.",
    ],
    compareQuestions: [
      "개인으로 시작할까, 법인으로 시작할까?",
      "간이과세로 시작해도 문제 없을까?",
      "창업 초기 비용은 어디까지 경비가 될까?",
    ],
    calculatorHref: calculatorPath("부가세"),
    calculatorLabel: "부가세 부담 먼저 계산해보기",
    regionHref: regionSigunguPath("서울특별시", "마포구"),
    regionLabel: "창업 세팅 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "마포구",
    guideNote:
      "창업 세무는 절세보다 순서가 중요합니다. 등록 전에 결정할 것과 등록 후에 해도 되는 것을 먼저 구분해 보세요.",
    faqs: [
      {
        question: "처음부터 법인으로 시작하는 게 유리한가요?",
        answer:
          "예상 이익 규모, 자금 인출 계획, 투자 유치 여부에 따라 갈립니다. 이익이 크지 않은 초기에는 개인으로 시작해 법인 전환 시점을 따로 잡는 경우도 많아, 숫자 기준으로 비교하는 편이 안전합니다.",
      },
      {
        question: "간이과세로 시작하면 뭐가 다른가요?",
        answer:
          "부가세 부담은 낮아질 수 있지만 매입세액 공제와 세금계산서 발행에 제약이 생깁니다. 거래처가 사업자 위주라면 일반과세가 맞는 경우도 많습니다.",
      },
      {
        question: "사업자등록 전에 쓴 비용도 처리할 수 있나요?",
        answer:
          "일정 요건을 갖추면 등록 전 지출도 반영할 수 있는 경우가 있습니다. 증빙을 미리 모아두고, 등록 시점과 함께 전문가에게 확인해 보세요.",
      },
    ],
    links: [
      { href: calculatorPath("부가세"), label: "부가세 계산기" },
      { href: "/calculator/jangbu", label: "기장료 계산기" },
      { href: situationPath("bookkeeping"), label: "기장 판단 가이드" },
      { href: "/consult", label: "창업 세무 상담 요청하기" },
    ],
  },
  corporate_tax: {
    label: "법인세·결산·장부",
    headline: "결산 전에 움직여야 줄일 수 있는 항목부터 봅니다.",
    subtitle:
      "법인세는 신고 때가 아니라 결산 전에 대부분 결정됩니다. 대표 급여, 배당, 비용 처리 — 사업연도가 끝나기 전에 조정할 수 있는 것부터 확인하세요.",
    bullets: [
      "대표 급여와 배당 중 어느 쪽으로 가져갈지 비교합니다.",
      "결산 전 정리할 비용·감가상각 항목을 점검합니다.",
      "가지급금·가수금처럼 문제가 되는 계정을 미리 확인합니다.",
    ],
    compareQuestions: [
      "급여로 받을까, 배당으로 받을까?",
      "올해 안에 처리해야 유리한 비용은 무엇일까?",
      "가지급금이 쌓여 있는데 어떻게 정리할까?",
    ],
    calculatorHref: "/calculator/jangbu",
    calculatorLabel: "법인 기장료 범위 확인하기",
    regionHref: regionSigunguPath("서울특별시", "강남구"),
    regionLabel: "법인 결산 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "강남구",
    guideNote:
      "법인세는 신고 기술보다 결산 전 준비가 큽니다. 사업연도 종료 2~3개월 전 점검이 가장 효과적입니다.",
    faqs: [
      {
        question: "법인세 절세는 언제 준비해야 하나요?",
        answer:
          "사업연도가 끝나면 조정할 수 있는 항목이 크게 줄어듭니다. 결산일 2~3개월 전에 이익 규모를 보고 급여·비용·투자 시점을 조정하는 것이 일반적인 흐름입니다.",
      },
      {
        question: "대표 급여와 배당은 뭐가 유리한가요?",
        answer:
          "법인세율, 소득세율, 4대보험 부담이 함께 움직여서 단일 정답이 없습니다. 이익 규모와 개인 소득 상황을 놓고 조합을 비교해야 합니다.",
      },
      {
        question: "가지급금은 왜 문제가 되나요?",
        answer:
          "인정이자 익금산입, 지급이자 손금불산입 등 세무상 불이익이 계속 쌓이는 계정이라, 커지기 전에 상환·급여·배당 등으로 정리 계획을 세우는 편이 좋습니다.",
      },
    ],
    links: [
      { href: "/calculator/jangbu", label: "기장료 계산기" },
      { href: calculatorPath("퇴직금"), label: "퇴직금 계산기" },
      { href: situationPath("payroll"), label: "급여·4대보험 가이드" },
      { href: "/consult", label: "법인 결산 상담 요청하기" },
    ],
  },
  payroll: {
    label: "급여·원천징수·4대보험",
    headline: "직원 한 명의 실제 비용부터 정확히 봅니다.",
    subtitle:
      "급여 세팅은 월급 숫자가 아니라 구조의 문제입니다. 4대보험, 원천세, 주휴수당까지 포함한 실제 인건비를 먼저 계산하고 신고 일정을 맞추세요.",
    bullets: [
      "연봉 기준으로 회사 부담분까지 포함한 실제 인건비를 봅니다.",
      "매달·반기 원천세 신고 일정과 방식이 맞는지 확인합니다.",
      "알바·프리랜서·직원 계약 형태별 처리 차이를 구분합니다.",
    ],
    compareQuestions: [
      "직원 1명 뽑으면 실제로 얼마가 나갈까?",
      "3.3% 프리랜서 계약, 이대로 둬도 될까?",
      "주휴수당은 우리 알바에게도 발생할까?",
    ],
    calculatorHref: calculatorPath("4대보험"),
    calculatorLabel: "4대보험 부담 계산해보기",
    regionHref: regionSigunguPath("서울특별시", "영등포구"),
    regionLabel: "급여·원천 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "영등포구",
    guideNote:
      "급여 실수는 매달 반복되면서 커집니다. 첫 채용 전에 구조를 한 번 정확히 잡는 것이 가장 싼 방법입니다.",
    faqs: [
      {
        question: "직원 채용 시 급여 외에 얼마가 더 드나요?",
        answer:
          "4대보험 회사 부담분이 급여의 일정 비율로 추가되고, 퇴직금 적립까지 감안하면 명목 급여보다 실제 비용이 상당히 커집니다. 계산기로 회사 부담분을 먼저 확인해 보세요.",
      },
      {
        question: "프리랜서 3.3% 계약이면 4대보험을 안 들어도 되나요?",
        answer:
          "계약 명칭이 아니라 실제 근무 형태로 판단됩니다. 출퇴근·지휘감독이 있는 형태라면 근로자로 보아 소급 부담이 생길 수 있어 계약 구조 점검이 필요합니다.",
      },
      {
        question: "원천세 신고를 놓치면 어떻게 되나요?",
        answer:
          "가산세가 붙고 반복되면 부담이 커집니다. 반기납부 승인 등 사업 규모에 맞는 신고 주기를 세팅해 두는 편이 안전합니다.",
      },
    ],
    links: [
      { href: calculatorPath("4대보험"), label: "4대보험 계산기" },
      { href: calculatorPath("주휴수당"), label: "주휴수당 계산기" },
      { href: calculatorPath("퇴직금"), label: "퇴직금 계산기" },
      { href: "/consult", label: "급여 세팅 상담 요청하기" },
    ],
  },
  audit: {
    label: "세무조사·과세전적부심",
    headline: "연락을 받았다면, 대응 순서부터 정리합니다.",
    subtitle:
      "세무조사·소명 안내를 받으면 당황해서 자료부터 보내는 경우가 많습니다. 무엇을 요구받았고, 어디까지 준비해야 하는지 순서를 먼저 잡는 것이 유리합니다.",
    bullets: [
      "안내문 종류(해명자료·조사통지 등)에 따라 대응 강도를 구분합니다.",
      "요구받은 기간·세목의 자료 상태를 먼저 점검합니다.",
      "혼자 소명할지, 처음부터 전문가와 갈지 판단합니다.",
    ],
    compareQuestions: [
      "이 안내문은 어느 수준의 사안일까?",
      "자료를 그대로 다 보내도 될까?",
      "전문가는 언제부터 붙는 게 맞을까?",
    ],
    calculatorHref: calculatorPath("종합소득세"),
    calculatorLabel: "쟁점 세액 규모 가늠해보기",
    regionHref: regionSigunguPath("서울특별시", "서초구"),
    regionLabel: "조사 대응 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "서초구",
    guideNote:
      "조사 대응은 첫 회신의 방향이 끝까지 갑니다. 회신 전에 한 번이라도 전문가 검토를 거치는 것이 안전합니다.",
    faqs: [
      {
        question: "해명자료 요청과 세무조사는 다른 건가요?",
        answer:
          "다릅니다. 해명자료·과세자료 소명은 서면 확인 단계인 경우가 많고, 조사통지는 공식 조사 절차입니다. 문서 종류에 따라 준비 범위와 대응 강도가 달라집니다.",
      },
      {
        question: "요구받은 자료를 전부 제출해야 하나요?",
        answer:
          "요구 범위에 맞게 정리해서 제출하는 것이 원칙이지만, 쟁점과 무관한 자료까지 넓혀 보낼 필요는 없습니다. 제출 전에 쟁점을 좁히는 정리가 중요합니다.",
      },
      {
        question: "과세전적부심은 언제 쓰나요?",
        answer:
          "과세 예고 통지를 받았을 때 부과 전 단계에서 다투는 절차입니다. 기한이 짧아서 통지를 받으면 바로 대응 여부를 판단해야 합니다.",
      },
    ],
    links: [
      { href: situationPath("income_tax"), label: "종합소득세 가이드" },
      { href: situationPath("corporate_tax"), label: "법인세·결산 가이드" },
      { href: calculatorPath("종합소득세"), label: "종합소득세 계산기" },
      { href: "/consult", label: "조사 대응 상담 요청하기" },
    ],
  },
  international: {
    label: "국제조세·해외거주",
    headline: "거주자 판정이 모든 판단의 출발점입니다.",
    subtitle:
      "해외 소득, 해외 계좌, 이중과세 — 복잡해 보이지만 첫 질문은 하나입니다. 한국 세법상 거주자인지부터 확인하면 신고 범위가 정해집니다.",
    bullets: [
      "거주자·비거주자 판정 기준을 내 상황에 대입해 봅니다.",
      "해외 소득이 한국 신고 대상인지 범위를 확인합니다.",
      "해외금융계좌 신고 의무(잔액 기준)가 있는지 점검합니다.",
    ],
    compareQuestions: [
      "나는 한국 세법상 거주자일까?",
      "해외에서 번 소득도 한국에 신고해야 할까?",
      "외국에서 낸 세금은 한국에서 공제될까?",
    ],
    calculatorHref: calculatorPath("종합소득세"),
    calculatorLabel: "합산 시 세액 가늠해보기",
    regionHref: regionSigunguPath("서울특별시", "강남구"),
    regionLabel: "국제조세 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "강남구",
    guideNote:
      "국제조세는 신고 누락 시 가산 부담이 큰 영역입니다. 애매하면 신고 범위부터 전문가와 확정하는 편이 결과적으로 쌉니다.",
    faqs: [
      {
        question: "해외에 살면 한국에 신고 안 해도 되나요?",
        answer:
          "체류일수만이 아니라 가족·자산·직업 등 생활 관계를 종합해 거주자 여부를 판정합니다. 비거주자라도 국내원천소득은 신고 대상일 수 있습니다.",
      },
      {
        question: "해외 소득에 세금을 두 번 내게 되나요?",
        answer:
          "조세조약과 외국납부세액공제로 이중과세를 조정하는 장치가 있습니다. 다만 적용 요건과 증빙이 까다로워 신고 전에 구조를 확인해야 합니다.",
      },
      {
        question: "해외 계좌도 신고해야 하나요?",
        answer:
          "잔액 합계가 기준 금액을 넘는 거주자는 해외금융계좌 신고 의무가 있을 수 있습니다. 미신고 과태료가 커서 잔액 기준부터 점검해 보세요.",
      },
    ],
    links: [
      { href: calculatorPath("종합소득세"), label: "종합소득세 계산기" },
      { href: situationPath("income_tax"), label: "연금·IRP 절세 가이드" },
      { href: situationPath("inheritance"), label: "상속·증여 판단 가이드" },
      { href: "/consult", label: "국제조세 상담 요청하기" },
    ],
  },
  restructuring: {
    label: "M&A·조직개편·분할합병",
    headline: "구조를 바꾸기 전에, 세금이 따라오는 지점을 봅니다.",
    subtitle:
      "지분 이동, 합병, 분할, 법인 전환 — 구조 변경은 실행 후엔 되돌릴 수 없습니다. 어떤 방식이 과세이연을 받는지, 어디서 양도세·증여세가 발생하는지 먼저 확인하세요.",
    bullets: [
      "주식 양도와 자산 양도, 거래 방식별 세금 차이를 봅니다.",
      "적격 요건(합병·분할) 충족 여부로 과세이연 가능성을 확인합니다.",
      "특수관계자 간 거래는 시가 평가 이슈를 먼저 점검합니다.",
    ],
    compareQuestions: [
      "주식으로 팔까, 자산으로 팔까?",
      "적격합병 요건을 채울 수 있을까?",
      "가족 법인 간 거래, 시가는 어떻게 잡아야 할까?",
    ],
    calculatorHref: calculatorPath("양도세"),
    calculatorLabel: "양도 차익 세금 가늠해보기",
    regionHref: regionSigunguPath("서울특별시", "강남구"),
    regionLabel: "M&A 세무 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "강남구",
    guideNote:
      "조직개편 세무는 실행 전 설계가 전부입니다. 계약서 서명 전에 세무 검토가 들어가야 선택지가 남아 있습니다.",
    faqs: [
      {
        question: "주식양도와 자산양도는 세금이 어떻게 다른가요?",
        answer:
          "과세 주체와 세목 자체가 달라집니다. 주식양도는 주주의 양도소득, 자산양도는 법인의 처분손익으로 잡혀 부가세·취득세까지 영향 범위가 다릅니다.",
      },
      {
        question: "적격합병이면 세금이 없는 건가요?",
        answer:
          "면제가 아니라 과세이연입니다. 요건을 채우면 합병 시점 과세를 미루는 것이고, 사후 요건을 어기면 추징될 수 있어 유지 요건까지 봐야 합니다.",
      },
      {
        question: "가족끼리 지분을 옮기는 데도 문제가 되나요?",
        answer:
          "특수관계자 간 거래는 시가와 다른 가격으로 하면 양도세·증여세가 함께 문제 될 수 있습니다. 평가 방법을 먼저 정하는 것이 순서입니다.",
      },
    ],
    links: [
      { href: calculatorPath("양도세"), label: "양도세 계산기" },
      { href: calculatorPath("상속증여"), label: "상속·증여 시뮬레이션" },
      { href: situationPath("corporate_tax"), label: "법인세·결산 가이드" },
      { href: "/consult", label: "M&A 세무 상담 요청하기" },
    ],
  },
  rnd_credit: {
    label: "R&D·고용·투자 세액공제",
    headline: "받을 수 있는 공제를 안 쓰는 게 가장 큰 손해입니다.",
    subtitle:
      "연구인력개발비, 고용증대, 투자 세액공제는 신청해야 받는 제도입니다. 우리 회사가 해당되는지, 증빙은 갖춰져 있는지부터 점검해 보세요.",
    bullets: [
      "연구소·전담부서 없이도 받을 수 있는 항목이 있는지 봅니다.",
      "직원 수 변화 기준으로 고용 관련 공제 해당 여부를 봅니다.",
      "공제 간 중복 적용 가능 여부와 최저한세 한도를 확인합니다.",
    ],
    compareQuestions: [
      "우리 개발 비용도 R&D 공제가 될까?",
      "작년보다 직원이 늘었는데 공제 대상일까?",
      "여러 공제를 동시에 받을 수 있을까?",
    ],
    calculatorHref: calculatorPath("종합소득세"),
    calculatorLabel: "공제 전 세액 먼저 확인하기",
    regionHref: regionSigunguPath("서울특별시", "구로구"),
    regionLabel: "세액공제 상담 세무사 보기",
    regionSido: "서울특별시",
    regionSigungu: "구로구",
    guideNote:
      "세액공제는 사후 증빙 싸움입니다. 공제액이 커질수록 검증 가능성도 커지니, 요건·증빙을 세트로 준비하세요.",
    faqs: [
      {
        question: "연구소가 없어도 R&D 세액공제를 받을 수 있나요?",
        answer:
          "항목에 따라 다릅니다. 인정 범위가 넓은 항목도 있지만, 연구전담부서 요건이 붙는 항목도 있어 우리 지출이 어느 항목인지부터 분류해야 합니다.",
      },
      {
        question: "고용 관련 공제는 어떻게 판단하나요?",
        answer:
          "상시근로자 수 증감을 기준으로 판단하는 제도가 많고, 이후 인원이 줄면 추징될 수 있습니다. 채용 계획과 함께 시뮬레이션하는 것이 안전합니다.",
      },
      {
        question: "공제를 신청하면 조사 위험이 커지나요?",
        answer:
          "정당한 요건과 증빙이 있으면 공제는 권리입니다. 다만 큰 금액은 사후 검증 가능성이 있으니 산정 근거를 문서로 남겨두는 것이 중요합니다.",
      },
    ],
    links: [
      { href: situationPath("corporate_tax"), label: "법인세·결산 가이드" },
      { href: situationPath("payroll"), label: "급여·4대보험 가이드" },
      { href: calculatorPath("종합소득세"), label: "종합소득세 계산기" },
      { href: "/consult", label: "세액공제 상담 요청하기" },
    ],
  },
};

const DEFAULT_FAQS = [
  {
    question: "이 페이지에서는 무엇을 먼저 보면 좋나요?",
    answer:
      "세금 계산보다 어떤 선택이 먼저 필요한지부터 보는 것이 좋습니다. 대표 시나리오를 비교한 뒤 복잡한 부분만 전문가와 맞추는 흐름을 권합니다.",
  },
  {
    question: "계산기 결과만으로 바로 결정해도 되나요?",
    answer:
      "시뮬레이션은 방향을 보는 데는 좋지만 실행 전에는 예외와 특례를 별도로 확인해야 합니다.",
  },
  {
    question: "세무사 상담은 언제 받는 게 좋나요?",
    answer:
      "비교까지 했는데도 조건 하나만 달라져도 결과가 크게 바뀔 것 같다면 그때 상담으로 연결하는 편이 가장 효율적입니다.",
  },
];

export function generateStaticParams() {
  return TAX_SITUATIONS.map((s) => ({ situation: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ situation: string }>;
}): Promise<Metadata> {
  const { situation: raw } = await params;
  const situation = decodeURIComponent(raw);
  const content = SITUATION_CONTENT[situation];
  const label = content?.label ?? "세무 상황별 판단";
  const path = situationPath(situation);
  const canonical = absoluteUrl(path);
  const description =
    content?.subtitle ??
    "세금은 계산보다 선택이 중요합니다. 지금 어떤 판단이 필요한지 먼저 비교해 보세요.";

  return {
    title: label,
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      url: canonical,
      title: label,
      description,
    },
  };
}

export default async function SituationPage({
  params,
}: {
  params: Promise<{ situation: string }>;
}) {
  const { situation: raw } = await params;
  const situationId = decodeURIComponent(raw);
  const def = TAX_SITUATIONS.find((s) => s.id === situationId);
  if (!def) notFound();

  const content =
    SITUATION_CONTENT[situationId] ??
    ({
      label: "세무 상황별 판단",
      headline: "지금 무엇을 먼저 결정해야 하는지부터 정리합니다.",
      subtitle:
        "세무 이슈는 숫자 계산보다 선택 순서가 중요한 경우가 많습니다. 어떤 비교가 먼저 필요한지부터 살펴보세요.",
      bullets: [
        "지금 선택과 다른 선택의 차이를 먼저 봅니다.",
        "조건에 따라 달라지는 포인트를 정리합니다.",
        "마지막 단계에서만 전문가와 확인합니다.",
      ],
      compareQuestions: [
        "지금 무엇을 비교해야 할까?",
        "세금이 달라지는 포인트는 어디일까?",
        "상담은 언제 받는 게 좋을까?",
      ],
      calculatorHref: calculatorPath("양도세"),
      calculatorLabel: "대표 판단 계산기 보기",
      regionHref: regionSigunguPath("서울특별시", "강남구"),
      regionLabel: "상황에 맞는 세무사 보기",
      regionSido: "서울특별시",
      regionSigungu: "강남구",
      guideNote:
        "세금은 계산보다 먼저 선택이 중요합니다. 방향을 먼저 잡으면 상담도 훨씬 쉬워집니다.",
      faqs: DEFAULT_FAQS,
      links: [
        { href: calculatorPath("양도세"), label: "양도세 계산기" },
        { href: calculatorPath("상속증여"), label: "상속·증여 시뮬레이션" },
        { href: calculatorPath("연말정산"), label: "연금·IRP 절세 시뮬레이션" },
        { href: "/consult", label: "세무사 상담 요청하기" },
      ],
    } satisfies SituationContent);

  const path = situationPath(situationId);
  const url = absoluteUrl(path);
  const regionHrefWithContext = `${content.regionHref}?situation=${encodeURIComponent(situationId)}`;
  const expertLeadMessage = [
    `[${content.label}] 비교 흐름을 보고 전문가 확인을 요청합니다.`,
    "",
    `- 현재 보고 있던 판단 주제: ${content.label}`,
    "- 확인하고 싶은 질문:",
    ...content.compareQuestions.map((question) => `  - ${question}`),
    "",
    "위 질문을 기준으로 실제 적용 가능성과 다음 행동을 함께 확인하고 싶습니다.",
  ].join("\n");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "홈", url: "/" },
          { name: "상황별 안내", url: "/situation" },
          { name: content.label, url: path },
        ])}
      />
      <JsonLd data={faqJsonLd(content.faqs, url)} />

      <div className="app-shell-frame pb-24 pt-10 md:pb-28">
        <div className="space-y-10">
          <section className="space-y-6 border-b border-line pb-10">
            <div className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
              <Link href="/" className="hover:text-ink">
                홈
              </Link>
              <span>/</span>
              <Link href="/situation" className="hover:text-ink">
                상황별 안내
              </Link>
              <span>/</span>
              <span className="text-ink">{content.label}</span>
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.55fr)] lg:items-start">
              <div className="space-y-5">
                <SectionLabel>situation_landing</SectionLabel>
                <div className="space-y-4">
                  <h1 className="max-w-4xl">{content.headline}</h1>
                  <p className="max-w-3xl text-lg leading-9 text-ink-muted">{content.subtitle}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {content.compareQuestions.map((question) => (
                    <SurfaceCard key={question} className="px-4 py-4" muted>
                      <p className="text-sm leading-relaxed text-ink">{question}</p>
                    </SurfaceCard>
                  ))}
                </div>

                <SituationLandingActions
                  situationId={situationId}
                  label={content.label}
                  calculatorHref={content.calculatorHref}
                  calculatorLabel={content.calculatorLabel}
                  regionHref={regionHrefWithContext}
                  regionLabel={content.regionLabel}
                  expertLeadMessage={expertLeadMessage}
                  defaultSido={content.regionSido}
                  defaultSigungu={content.regionSigungu}
                />
              </div>

              <SurfaceCard className="p-6" muted>
                <div className="space-y-4">
                  <Badge tone="accent">판단 포인트</Badge>
                  <div className="space-y-3">
                    {content.bullets.map((bullet) => (
                      <p key={bullet} className="text-sm leading-relaxed text-ink">
                        {bullet}
                      </p>
                    ))}
                  </div>
                  <p className="border-t border-line pt-4 text-sm leading-relaxed text-ink-muted">
                    {content.guideNote}
                  </p>
                </div>
              </SurfaceCard>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <SurfaceCard className="p-7">
              <div className="space-y-4">
                <SectionLabel>decision_flow</SectionLabel>
                <h2 className="text-[2rem] font-medium text-ink">세무 상담 전에, 무엇이 달라지는지 먼저 봅니다.</h2>
                <p className="text-ink-muted">
                  바로 세무사를 찾기보다 어떤 선택이 세금에 차이를 만드는지 먼저 정리하면 상담도 훨씬 쉬워집니다.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <SurfaceCard className="px-4 py-4" muted>
                    <p className="text-xs uppercase tracking-[0.22em] text-ink-soft">step 01</p>
                    <p className="mt-2 text-sm text-ink">지금과 다른 선택을 비교합니다.</p>
                  </SurfaceCard>
                  <SurfaceCard className="px-4 py-4" muted>
                    <p className="text-xs uppercase tracking-[0.22em] text-ink-soft">step 02</p>
                    <p className="mt-2 text-sm text-ink">숫자 차이를 보고 마지막 판단만 확인합니다.</p>
                  </SurfaceCard>
                </div>
              </div>
            </SurfaceCard>

            <SurfaceCard className="p-7">
              <div className="space-y-4">
                <SectionLabel>regional_match</SectionLabel>
                <h2 className="text-[2rem] font-medium text-ink">판단이 끝났다면, 이제 지역과 이슈에 맞춰 찾습니다.</h2>
                <p className="text-ink-muted">
                  지역 검색은 출발점이 아니라 다음 단계입니다. 비교가 끝난 뒤 지금 보고 있는 이슈에 맞는 세무사를 지역 기준으로 이어서 볼 수 있어요.
                </p>
                <Link
                  href={regionHrefWithContext}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-line bg-surface px-6 text-sm font-medium text-ink-muted hover:text-ink"
                >
                  {content.regionLabel}
                </Link>
              </div>
            </SurfaceCard>
          </section>

          <InternalLinksSection links={content.links} />
          <FaqSection items={content.faqs} />
          <StickyPageLeadSection
            defaultSido={content.regionSido}
            defaultSigungu={content.regionSigungu}
            defaultSituation={situationId}
            defaultMessage={expertLeadMessage}
          />
        </div>
      </div>
    </>
  );
}
