import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { absoluteUrl } from "@/lib/seo/urls";

export const metadata: Metadata = {
  title: "이용약관",
  description: "findtax.kr 서비스 이용약관",
  alternates: { canonical: absoluteUrl("/terms") },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "제1조 (목적)",
    body: [
      "이 약관은 findtax.kr(이하 \"서비스\")가 제공하는 세무사 탐색, 상담 연결, 계산기 및 관련 정보 제공 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다.",
    ],
  },
  {
    title: "제2조 (서비스 내용)",
    body: [
      "서비스는 지역 세무사 탐색, 상담 요청 접수, 계산기 기반 정보 제공, 세무사 등록 신청 및 기타 부가 기능을 제공합니다.",
      "서비스에서 제공되는 계산 결과와 정보는 일반적인 참고용이며, 개별 사실관계에 따른 최종 법률·세무 판단을 대신하지 않습니다.",
    ],
  },
  {
    title: "제3조 (이용자의 의무)",
    body: [
      "이용자는 상담 요청 또는 문의 시 본인 또는 사업과 관련된 정확한 정보를 입력해야 하며, 타인의 정보를 무단으로 입력해서는 안 됩니다.",
      "이용자는 서비스 운영을 방해하거나 관련 법령에 위반되는 방식으로 서비스를 이용해서는 안 됩니다.",
    ],
  },
  {
    title: "제4조 (상담 연결 및 책임 제한)",
    body: [
      "서비스는 이용자의 요청에 따라 세무사 또는 세무사 사무소와의 상담 연결을 지원할 수 있습니다.",
      "실제 상담의 내용, 수임 여부, 계약 체결, 보수, 업무 결과 등은 이용자와 해당 전문가 사이에서 별도로 결정됩니다.",
      "서비스는 연결 지원 범위를 넘어 개별 상담의 내용이나 결과를 보증하지 않습니다.",
    ],
  },
  {
    title: "제5조 (지식재산권)",
    body: [
      "서비스 내 콘텐츠, 디자인, 문구, 계산기 구성 및 데이터 편집물에 관한 권리는 서비스 또는 정당한 권리자에게 귀속됩니다.",
      "이용자는 서비스의 사전 승인 없이 이를 복제, 배포, 전송, 전시 또는 상업적으로 이용할 수 없습니다.",
    ],
  },
  {
    title: "제6조 (서비스 변경 및 중단)",
    body: [
      "서비스는 운영상 또는 기술상 필요에 따라 일부 기능을 변경하거나 제공을 일시 중단할 수 있습니다.",
      "다만 이용자에게 중요한 영향이 있는 경우에는 서비스 화면 또는 공지사항 등을 통해 사전에 안내하도록 노력합니다.",
    ],
  },
  {
    title: "제7조 (면책)",
    body: [
      "서비스는 천재지변, 통신 장애, 외부 플랫폼 장애 등 불가항력으로 인한 서비스 중단에 대하여 책임을 지지 않습니다.",
      "이용자가 입력한 정보의 오류, 누락 또는 개별 사실관계의 차이로 인해 발생하는 판단상 손해에 대하여 서비스는 책임을 지지 않습니다.",
    ],
  },
  {
    title: "제8조 (준거법 및 분쟁)",
    body: [
      "이 약관은 대한민국 법령에 따라 해석됩니다.",
      "서비스 이용과 관련하여 분쟁이 발생하는 경우 관계 법령에 따른 관할 법원을 따릅니다.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="app-shell-frame pb-24 pt-10 md:pb-28">
      <div className="space-y-10">
        <section className="space-y-5 border-b border-line pb-8">
          <SectionLabel>legal_document</SectionLabel>
          <h1 className="max-w-4xl text-[3.5rem] leading-[0.95] md:text-[4.75rem]">이용약관</h1>
          <p className="max-w-3xl">
            아래 약관은 findtax.kr의 일반적인 서비스 운영 구조를 기준으로 작성된 기본 약관입니다. 실제 운영 형태에 따라 세부 조정이나 법률 검토가 필요할 수 있습니다.
          </p>
        </section>

        <SurfaceCard className="p-6 sm:p-8">
          <div className="space-y-8">
            {sections.map((section) => (
              <section key={section.title} className="space-y-3">
                <h2 className="text-2xl leading-tight md:text-3xl">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
