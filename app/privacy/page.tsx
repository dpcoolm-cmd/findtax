import type { Metadata } from "next";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SurfaceCard } from "@/components/ui/SurfaceCard";
import { absoluteUrl } from "@/lib/seo/urls";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "findtax.kr 개인정보처리방침",
  alternates: { canonical: absoluteUrl("/privacy") },
  robots: { index: true, follow: true },
};

const sections = [
  {
    title: "1. 수집하는 개인정보 항목",
    body: [
      "서비스는 상담 요청 및 문의 처리 과정에서 이름, 연락처, 이메일(선택), 지역 정보, 상담 유형, 상담 내용 등 이용자가 직접 입력한 정보를 수집할 수 있습니다.",
      "기장 상담 또는 세무사 등록 등 추가 기능에서는 서비스 제공에 필요한 범위에서 사업 관련 정보나 첨부 자료를 추가로 받을 수 있습니다.",
    ],
  },
  {
    title: "2. 개인정보의 이용 목적",
    body: [
      "수집한 개인정보는 상담 요청 접수, 세무사 또는 세무사 사무소와의 연결, 문의 응답, 서비스 품질 개선, 부정 이용 방지 및 관련 법령 준수를 위해 이용됩니다.",
    ],
  },
  {
    title: "3. 보유 및 이용 기간",
    body: [
      "개인정보는 수집 및 이용 목적이 달성될 때까지 보관하며, 관련 법령에 따라 일정 기간 보관이 필요한 경우에는 해당 기간 동안 보관할 수 있습니다.",
      "이용자가 삭제를 요청하거나 보유 필요성이 없어진 경우에는 지체 없이 파기하도록 노력합니다.",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공",
    body: [
      "서비스는 이용자가 상담 연결을 요청한 경우, 상담 진행을 위해 필요한 범위 내에서 해당 세무사 또는 세무사 사무소에 이용자가 입력한 정보를 전달할 수 있습니다.",
      "그 외에는 법령상 근거가 있거나 이용자의 동의가 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.",
    ],
  },
  {
    title: "5. 처리 위탁",
    body: [
      "서비스는 원활한 운영을 위해 호스팅, 데이터 저장, 분석 도구 또는 메시지 발송 도구 등 일부 업무를 외부 서비스에 위탁할 수 있습니다.",
      "이 경우 관련 법령에 따라 개인정보가 안전하게 처리되도록 필요한 관리 조치를 취합니다.",
    ],
  },
  {
    title: "6. 이용자의 권리",
    body: [
      "이용자는 본인의 개인정보에 대하여 열람, 정정, 삭제, 처리정지 등을 요청할 수 있습니다.",
      "관련 요청은 서비스 운영팀을 통해 접수할 수 있으며, 법령상 제한이 없는 범위에서 처리합니다.",
    ],
  },
  {
    title: "7. 안전성 확보 조치",
    body: [
      "서비스는 개인정보의 분실, 도난, 유출, 위조, 변조 또는 훼손을 방지하기 위하여 합리적인 기술적·관리적 보호 조치를 시행하도록 노력합니다.",
    ],
  },
  {
    title: "8. 쿠키 및 로그 정보",
    body: [
      "서비스는 이용 편의성 향상, 접속 통계 분석, 기능 개선을 위해 쿠키 또는 유사한 기술을 사용할 수 있습니다.",
      "이용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다.",
    ],
  },
  {
    title: "9. 제3자 광고 및 Google AdSense",
    body: [
      "서비스는 Google AdSense 등 제3자 광고 서비스를 통해 광고를 게재할 수 있습니다. Google을 포함한 제3자 광고 사업자는 쿠키를 사용하여 이용자의 본 사이트 또는 다른 사이트 방문 기록을 기반으로 광고를 게재합니다.",
      "Google은 광고 쿠키를 사용하여 이용자에게 맞춤형 광고를 제공할 수 있으며, 이용자는 Google 광고 설정(https://www.google.com/settings/ads)에서 맞춤 광고를 선택 해제할 수 있습니다.",
      "또한 www.aboutads.info 를 방문하여 맞춤 광고에 사용되는 제3자 광고 사업자의 쿠키를 일괄적으로 거부할 수 있습니다.",
    ],
  },
  {
    title: "10. 고지 및 문의",
    body: [
      "본 방침은 서비스 운영 정책 또는 관련 법령 변경에 따라 수정될 수 있으며, 중요한 변경 사항은 서비스 화면을 통해 안내합니다.",
      "개인정보 처리와 관련한 문의는 서비스 내 상담 요청 또는 운영자 문의 채널을 통해 접수할 수 있습니다.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="app-shell-frame pb-24 pt-10 md:pb-28">
      <div className="space-y-10">
        <section className="space-y-5 border-b border-line pb-8">
          <SectionLabel>privacy_policy</SectionLabel>
          <h1 className="max-w-4xl text-[3.5rem] leading-[0.95] md:text-[4.75rem]">개인정보처리방침</h1>
          <p className="max-w-3xl">
            아래 방침은 현재 서비스 구조와 상담 요청 흐름을 기준으로 작성한 기본 개인정보처리방침입니다. 실제 수집 항목, 위탁 관계, 운영 주체 정보는 서비스 운영 형태에 맞게 최종 점검이 필요합니다.
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
